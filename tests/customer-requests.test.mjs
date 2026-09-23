import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { load } from './helpers/load-module.mjs';
function form(kind='contact') {
 const data=new FormData();
 Object.entries({kind,submissionKey:randomUUID(),name:'Client test',email:' TEST@example.invalid ',subject:'Question produit',message:'Description détaillée de la demande de test.',productType:'Pagaie carbone',privacyAcknowledged:'on'}).forEach(([k,v])=>data.set(k,v));
 return data;
}
test('all request kinds validate fields and normalize email',()=>{
 const {parseCustomerRequest}=load('src/server/requests/request-input.ts');
 for(const kind of ['contact','repair','custom']) assert.equal(parseCustomerRequest(form(kind)).email,'test@example.invalid');
 for(const [key,value] of [['kind','admin'],['email','bad'],['message','short'],['name','x'],['submissionKey','predictable'],['privacyAcknowledged','']]) {
  const input=form();input.set(key,value);assert.throws(()=>parseCustomerRequest(input),e=>Boolean(e.issues[key]));
 }
 const oversized=form();oversized.set('message','x'.repeat(5001));assert.throws(()=>parseCustomerRequest(oversized));
});
test('repair attachments enforce count and actual File sizes, other forms refuse them',()=>{
 const {parseCustomerRequest}=load('src/server/requests/request-input.ts');
 const tooMany=form('repair');for(let i=0;i<4;i++)tooMany.append('photos',new File(['x'],'x.png',{type:'image/png'}));
 assert.throws(()=>parseCustomerRequest(tooMany),e=>Boolean(e.issues.photos));
 const large=form('repair');large.append('photos',new File([new Uint8Array(1024*1024+1)],'big.png',{type:'image/png'}));
 assert.throws(()=>parseCustomerRequest(large));
 const contact=form();contact.append('photos',new File(['x'],'x.png'));assert.throws(()=>parseCustomerRequest(contact));
});
test('private admin request reads and status writes authorize before database access',async()=>{
 let accesses=0;
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>{throw new Error('DENIED');}},
  '@/server/db/prisma':{getPrismaClient:()=>{accesses++;}},
  '@/server/requests/private-images':{}
 });
 await assert.rejects(service.listAdminRequests('contact',1),/DENIED/);
 await assert.rejects(service.getAdminRequest('contact',randomUUID()),/DENIED/);
 await assert.rejects(service.updateAdminRequestStatus('contact','id','closed',new Date().toISOString(),'new'),/DENIED/);
 await assert.rejects(service.setAdminRequestTrashed('contact','id',new Date().toISOString(),true),/DENIED/);
 assert.equal(accesses,0);
});
test('repeated submissions do not duplicate records or upload photos again',async()=>{
 let uploaded=0,created=0;
 const prisma={contactRequest:{findUnique:async()=>({id:'saved'})},$transaction:async()=>{created++;}};
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{},'@/server/db/prisma':{getPrismaClient:()=>prisma},
  '@/server/requests/private-images':{storePrivateRequestImages:async()=>{uploaded++;return [];}}
 });
 const input=load('src/server/requests/request-input.ts').parseCustomerRequest(form());
 await service.submitCustomerRequest(input);await service.submitCustomerRequest(input);
 assert.equal(created,0);assert.equal(uploaded,0);
});
test('new requests store only their correct fields, acknowledgement and private media atomically',async()=>{
 for(const kind of ['contact','repair','custom']) {
  let saved,media;
  const create=async({data})=>{saved=data;return {id:'new-request'};};
  const prisma={contactRequest:{findUnique:async()=>null},repairRequest:{findUnique:async()=>null},customRequest:{findUnique:async()=>null},$transaction:async(fn)=>fn({contactRequest:{create},repairRequest:{create},customRequest:{create},requestMedia:{create:async(q)=>{media=q.data;}}})};
  const service=load('src/server/requests/request-service.ts',{'@/server/auth/session':{},'@/server/db/prisma':{getPrismaClient:()=>prisma},'@/server/requests/private-images':{storePrivateRequestImages:async()=>kind==='repair'?[{path:'requests/abc.webp',sizeBytes:10,originalFilename:'test.png'}]:[],removePrivateRequestImages:async()=>{}}});
  const input=load('src/server/requests/request-input.ts').parseCustomerRequest(form(kind));await service.submitCustomerRequest(input);
  assert.equal(saved.submissionKey,input.submissionKey);assert.ok(saved.privacyAcknowledgedAt);
  assert.equal(saved[kind==='contact'?'message':kind==='repair'?'damageDescription':'projectDescription'],input.message);
  if(kind==='repair'){assert.equal(media.mediaAsset.create.visibility,'private');assert.equal(media.requestType,'repair');}
 }
});
test('failed transactions clean only newly uploaded private objects',async()=>{
 const images=[{path:'requests/new.webp'}];let removed;
 const service=load('src/server/requests/request-service.ts',{'@/server/auth/session':{},'@/server/db/prisma':{getPrismaClient:()=>({repairRequest:{findUnique:async()=>null},$transaction:async()=>{throw new Error('database unavailable');}})},'@/server/requests/private-images':{storePrivateRequestImages:async()=>images,removePrivateRequestImages:async(value)=>{removed=value;}}});
 await assert.rejects(service.submitCustomerRequest({kind:'repair',submissionKey:randomUUID(),files:[]}),/database unavailable/);
 assert.equal(removed,images);
});
test('expired admin version rejects overwriting a concurrent update',async()=>{
 let query;
 const service=load('src/server/requests/request-service.ts',{'@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},'@/server/db/prisma':{getPrismaClient:()=>({contactRequest:{updateMany:async(q)=>{query=q;return {count:0};}}})},'@/server/requests/private-images':{}});
 await assert.rejects(service.updateAdminRequestStatus('contact','id','closed','2026-09-08T00:00:00Z','new'),/changé/);
 assert.equal(query.where.status,'new');
 assert.equal(query.where.updatedAt.gte.toISOString(),'2026-09-08T00:00:00.000Z');
 assert.equal(query.where.updatedAt.lt.toISOString(),'2026-09-08T00:00:00.001Z');
});
test('admin request list separates active requests from the recoverable trash',async()=>{
 const id=randomUUID(),queries=[];
 const row={id,name:'Client test',email:'client@example.invalid',phone:null,status:'closed',createdAt:new Date(),updatedAt:new Date(),deletedAt:null,subject:'Question',message:'Message complet'};
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},
  '@/server/db/prisma':{getPrismaClient:()=>({contactRequest:{findMany:async(query)=>{queries.push(query);return [row];}},requestMedia:{findMany:async()=>[]}})},
  '@/server/requests/private-images':{}
 });
 const active=await service.listAdminRequests('contact',1,'closed');
 const trash=await service.listAdminRequests('contact',1,undefined,true);
 assert.equal(active.requests[0].deletedAt,null);
 assert.equal(queries[0].where.status,'closed');
 assert.equal(queries[0].where.deletedAt,null);
 assert.equal(queries[1].where.deletedAt.not,null);
 assert.equal(trash.requests.length,1);
});
test('admin request detail includes its private image references',async()=>{
 const id=randomUUID(),imageId=randomUUID();
 const row={id,name:'Client test',email:'client@example.invalid',phone:null,status:'new',createdAt:new Date(),updatedAt:new Date(),deletedAt:null,productType:'Pagaie',damageDescription:'Description complète'};
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},
  '@/server/db/prisma':{getPrismaClient:()=>({repairRequest:{findUnique:async()=>row},requestMedia:{findMany:async(query)=>{assert.equal(query.where.requestType,'repair');assert.equal(query.where.requestId,id);return [{mediaAssetId:imageId}];}}})},
  '@/server/requests/private-images':{}
 });
 const detail=await service.getAdminRequest('repair',id);
 assert.equal(detail.message,row.damageDescription);
 assert.equal(detail.imageIds[0],imageId);
});
test('status saves return the new version and reject archived requests',async()=>{
 const id=randomUUID(),before='2026-09-08T00:00:00.000Z',queries=[];
 let count=1;
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},
  '@/server/db/prisma':{getPrismaClient:()=>({contactRequest:{updateMany:async(query)=>{queries.push(query);return {count};}}})},
  '@/server/requests/private-images':{}
 });
 const saved=await service.updateAdminRequestStatus('contact',id,'closed',before,'new');
 assert.equal(saved.status,'closed');
 assert.equal(saved.updatedAt,queries[0].data.updatedAt.toISOString());
 assert.equal(queries[0].where.deletedAt,null);
 count=0;
 await assert.rejects(service.updateAdminRequestStatus('contact',id,'answered',before,'new'),/changé/);
});
test('moving a request to trash and restoring it only update the request row',async()=>{
 const id=randomUUID(),before='2026-09-08T00:00:00.000Z',queries=[];
 const db={contactRequest:{updateMany:async(query)=>{queries.push(query);return {count:1};}}};
 const service=load('src/server/requests/request-service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},
  '@/server/db/prisma':{getPrismaClient:()=>db},'@/server/requests/private-images':{}
 });
 const trashed=await service.setAdminRequestTrashed('contact',id,before,true);
 assert.equal(trashed.deletedAt,queries[0].data.deletedAt.toISOString());
 assert.equal(queries[0].where.deletedAt,null);
 assert.ok(queries[0].data.deletedAt instanceof Date);
 const restored=await service.setAdminRequestTrashed('contact',id,trashed.updatedAt,false);
 assert.equal(restored.deletedAt,null);
 assert.equal(queries[1].where.deletedAt.not,null);
 assert.equal(queries[1].data.deletedAt,null);
 assert.equal(Object.keys(db).includes('requestMedia'),false);
});
test('request storage uses the correct header for new and legacy Supabase keys',()=>{
 for(const [key,authorization] of [['sb_secret_fixture',undefined],['legacy-service-role-jwt','Bearer legacy-service-role-jwt']]) {
  const storage=load('src/server/requests/private-images.ts',{'@/server/catalog/product-image-storage':{}},{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:key});
  assert.equal(storage.requestStorageConfig().headers.apikey,key);
  assert.equal(storage.requestStorageConfig().headers.Authorization,authorization);
 }
});
test('a repair photo uploads privately, appears in admin, and can be read by an admin',async()=>{
 const url='https://fixture.supabase.co',key='sb_secret_fixture',imageId=randomUUID(),requestId=randomUUID();
 const objects=new Map(),calls=[];
 const fakeFetch=async(address,options={})=>{
  const endpoint=new URL(address).pathname;
  calls.push({endpoint,method:options.method??'GET',headers:options.headers??{}});
  if(endpoint==='/storage/v1/bucket/request-images')return Response.json({public:false});
  if(endpoint.startsWith('/storage/v1/object/request-images/')&&options.method==='POST'){
   objects.set(endpoint.slice('/storage/v1/object/request-images/'.length),Buffer.from(options.body));
   return Response.json({Key:endpoint});
  }
  if(endpoint.startsWith('/storage/v1/object/authenticated/request-images/')){
   const bytes=objects.get(endpoint.slice('/storage/v1/object/authenticated/request-images/'.length));
   return bytes?new Response(bytes,{status:200}):new Response(null,{status:404});
  }
  throw new Error(`Unexpected storage request: ${endpoint}`);
 };
 const storage=load('src/server/requests/private-images.ts',{fetch:fakeFetch},{SUPABASE_URL:url,SUPABASE_SECRET_KEY:key});
 const png=await sharp({create:{width:2,height:2,channels:3,background:'#4488aa'}}).png().toBuffer();
 const stored=await storage.storePrivateRequestImages([new File([png],'damage.png',{type:'image/png'})]);
 assert.equal(stored.length,1);
 assert.match(stored[0].path,/^requests\/[0-9a-f-]{36}\.webp$/);
 assert.equal((await sharp(objects.get(stored[0].path)).metadata()).format,'webp');
 assert.equal(calls.some(call=>call.headers.Authorization),false);

 const db={
  repairRequest:{findMany:async()=>[{id:requestId,name:'Client test',email:'client@example.invalid',phone:null,status:'new',createdAt:new Date(),updatedAt:new Date(),productType:'Pagaie',damageDescription:'Une longue description du dommage.'}]},
  requestMedia:{findMany:async()=>[{requestId,mediaAssetId:imageId}]},
  mediaAsset:{findFirst:async()=>({id:imageId,path:stored[0].path,bucket:'request-images',visibility:'private'})}
 };
 const admin=load('src/server/requests/request-service.ts',{'@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},'@/server/db/prisma':{getPrismaClient:()=>db},'@/server/requests/private-images':{}});
 const listed=await admin.listAdminRequests('repair',1);
 assert.deepEqual(listed.requests[0].imageIds,[imageId]);
 const route=load('src/app/api/admin/request-images/[id]/route.ts',{
  fetch:fakeFetch,
  '@/server/auth/session':{getCurrentAuthSession:async()=>({role:'admin'})},
  '@/server/db/prisma':{getPrismaClient:()=>db},
  '@/server/requests/private-images':{requestStorageConfig:storage.requestStorageConfig}
 });
 const response=await route.GET(new Request(`http://localhost/api/admin/request-images/${imageId}`),{params:Promise.resolve({id:imageId})});
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Content-Type'),'image/webp');
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),objects.get(stored[0].path));
});
test('private photo endpoint denies unauthenticated requests before reading metadata',async()=>{
 let accessed=false;
 const route=load('src/app/api/admin/request-images/[id]/route.ts',{'@/server/auth/session':{getCurrentAuthSession:async()=>null},'@/server/db/prisma':{getPrismaClient:()=>{accessed=true;}},'@/server/requests/private-images':{}});
 const response=await route.GET(new Request('http://localhost'),{params:Promise.resolve({id:randomUUID()})});
 assert.equal(response.status,401);assert.equal(accessed,false);
});
test('persistent rate limiting hashes identifiers and fails closed at the database limit',async()=>{
 let queryValues,allow=true;
 const limiter=load('src/server/requests/request-rate-limit.ts',{'@/server/db/prisma':{getPrismaClient:()=>({$queryRaw:async(_,...values)=>{queryValues=values;return allow?[{count:1}]:[];},requestRateLimit:{deleteMany:async()=>{}}})},'@/server/security/request-guards':{RateLimitError:class extends Error{}}},{REQUEST_RATE_LIMIT_SECRET:'test-only-secret'});
 await limiter.enforcePersistentRequestLimit('ip:192.0.2.1',5,60000);
 assert.match(queryValues[0],/^[a-f0-9]{64}$/);assert.equal(queryValues.includes('ip:192.0.2.1'),false);
 allow=false;await assert.rejects(limiter.enforcePersistentRequestLimit('ip:192.0.2.1',5,60000));
});
