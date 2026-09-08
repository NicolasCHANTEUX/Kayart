import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
 await assert.rejects(service.updateAdminRequestStatus('contact','id','closed',new Date().toISOString()),/DENIED/);
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
 await assert.rejects(service.updateAdminRequestStatus('contact','id','closed','2026-09-08T00:00:00Z'),/changé/);
 assert.equal(query.where.updatedAt.toISOString(),'2026-09-08T00:00:00.000Z');
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
