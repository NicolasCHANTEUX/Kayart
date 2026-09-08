import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { load } from './helpers/load-module.mjs';

const base = { id:'product', name:'Produit test', slug:'produit-test', sku:'TEST', categoryId:'category', condition:'new', availability:'available', priceCents:1990, compareAtPriceCents:null, stockQuantity:1, description:'Description technique existante.', shortDescription:'Test', attributes:[{label:'Poids',value:'0.5',unit:'kg'},{label:'Dimensions',value:'20 cm'},{label:'Matière',value:'Carbone'}], images:[], isFeatured:false,isCustomizable:false,isReservable:false, publishedAt:new Date(), category:null };
function repository(prisma, env={KAYART_ENABLE_ORDER_SIMULATOR:'true'}) {
  return load('src/server/catalog/catalog.repository.ts', {'@/server/db/prisma':{getPrismaClient:()=>prisma}},env).prismaCatalogRepository;
}

test('all admin service operations deny access before accessing the repository',async()=>{
 let touched=0;
 const service=load('src/server/catalog/catalog.service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>{throw new Error('AUTH_REQUIRED');}},
  '@/server/catalog/catalog.repository':{getCatalogRepository:()=>{touched++;throw new Error('PRIVATE_READ');}}
 });
 for(const name of ['listCategories','createCategory','updateCategory','deleteCategory','listAdminProducts','listAdminOrders','findAdminProductById','createProduct','updateProduct','updateProductStock','updateProductVisibility','deleteProduct','createAdminOrder','markAdminOrderPaid','deleteAdminOrder']) {
   await assert.rejects(service[name]({id:'private'}),/AUTH_REQUIRED/,name);
 }
 assert.equal(touched,0);
});

test('role lookup never links an existing email or writes customer data',async()=>{
 let queries=0;
 const session=load('src/server/auth/session.ts',{
  'next/headers':{},'next/navigation':{},'./supabase-auth':{},
  '@/server/db/prisma':{getPrismaClient:()=>({customer:{findUnique:async(q)=>{queries++;assert.equal(q.where.authUserId,'new-auth');return null;}}})}
 });
 const result=await session.resolveAuthenticatedSession({id:'new-auth',email:'existing-admin@example.invalid'});
 assert.equal(result.role,'customer');assert.equal(queries,1);
});

test('a verified Auth ID with an explicit admin binding retains admin access',async()=>{
 const session=load('src/server/auth/session.ts',{
  'next/headers':{cookies:async()=>({get:()=>({value:'verified-token'})})},
  'next/navigation':{redirect:()=>{throw new Error('Unexpected redirect');}},
  './supabase-auth':{getSupabaseAuthUser:async(token)=>{assert.equal(token,'verified-token');return {id:'bound-admin',email:'admin@example.invalid'};}},
  '@/server/db/prisma':{getPrismaClient:()=>({customer:{findUnique:async(q)=>{assert.equal(q.where.authUserId,'bound-admin');return {role:'admin'};}}})}
 });
 assert.equal((await session.requireAdminSession()).role,'admin');
 let called=false;
 const service=load('src/server/catalog/catalog.service.ts',{
  '@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},
  '@/server/catalog/catalog.repository':{getCatalogRepository:()=>({listProducts:async()=>{called=true;return [];}})}
 });
 await service.listAdminProducts();assert.equal(called,true);
});

test('redirects reject alternate origins, encoded backslashes and controls',()=>{
 const {sanitizeRedirectPath:clean}=load('src/lib/safe-redirect.ts');
 for(const value of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/%5cevil.invalid','/%255cevil.invalid','/\tevil.invalid','/%0d%0aevil.invalid','/%']) assert.equal(clean(value),'',value);
 assert.equal(clean('/admin/produits?x=1#stock'),'/admin/produits?x=1#stock');
});

test('euro amounts survive form roundtrips down to the cent',()=>{
 const {parseEuroCents}=load('src/lib/money.ts');
 assert.equal(parseEuroCents('19,90'),1990); assert.equal(parseEuroCents('0.01'),1);
 for(const bad of ['1e3','1.234','-1','21474836.48','Infinity']) assert.equal(parseEuroCents(bad),null);
 const {createProductFormDraftFromProduct:draft}=load('src/server/catalog/product-form-draft.ts');
 const input=load('src/server/catalog/catalog.input.ts');
 for(const price of [1,99,1990,1999,10001]) {
  const fd=new FormData(); Object.entries(draft({...base,priceCents:price})).forEach(([k,v])=>{if(typeof v==='string')fd.set(k,v);});fd.set('id',base.id);
  assert.equal(input.parseProductUpdateFormData(fd).priceCents,price);
 }
});

test('editing keeps non-managed attributes, precise discount prices and hidden visibility',async()=>{
 let saved;
 const existing={...base,priceCents:1234,compareAtPriceCents:1999,publishedAt:null};
 const tx={product:{findUnique:async()=>existing,update:async(q)=>{saved=q.data;return {...existing,...q.data,images:[],attributes:[]};}}};
 await repository({$transaction:async(fn)=>fn(tx)}).updateProduct({...base,attributes:base.attributes.slice(0,2),deletedImageIds:[],preservePrices:true});
 assert.equal(saved.priceCents,1234);assert.equal(saved.compareAtPriceCents,1999);
 assert.equal(JSON.stringify(saved.attributes.deleteMany),JSON.stringify({label:{in:['Poids','Dimensions']}}));
 assert.equal(saved.publishedAt,null);
});

test('existing and newly uploaded images cannot exceed six',async()=>{
 const existing={...base,images:Array.from({length:6},(_,i)=>({id:String(i),isPrimary:i===0}))};
 const tx={product:{findUnique:async()=>existing}};
 await assert.rejects(repository({$transaction:async(fn)=>fn(tx)}).updateProduct({...base,images:[{}],deletedImageIds:[]}),/6 images/);
});

test('archiving retains order links and reservations without any deletion',async()=>{
 let query;
 await repository({product:{update:async(q)=>{query=q;}}}).deleteProduct({id:'product'});
 assert.equal(query.data.availability,'archived');assert.equal(query.data.publishedAt,null);
});

test('hide and show retain reserved and made-to-order states',async()=>{
 for(const availability of ['reserved','madeToOrder']) {
  let saved;
  const product={...base,availability};
  const repo=repository({product:{findUnique:async()=>product,update:async(q)=>{saved=q.data;return {...product,...q.data};}}});
  await repo.updateProductVisibility({id:'product',availability:'unavailable'});
  assert.equal(saved.publishedAt,null);assert.equal(saved.availability,undefined);
  await repo.updateProductVisibility({id:'product',availability:'available'});
  assert.ok(saved.publishedAt);assert.equal(saved.availability,undefined);
 }
});

test('used products retain their condition and private base models are omitted publicly',()=>{
 const mapper=load('src/server/catalog/catalog.mapper.ts');
 assert.equal(mapper.mapPrismaProduct({...base,condition:'used'}).condition,'used');
 const result=mapper.mapPublicPrismaProduct({...base,baseProductId:'private',baseProduct:{...base,availability:'draft',publishedAt:null}});
 assert.equal(result.baseProduct,null);assert.equal(result.baseProductId,null);
});

const order={id:'order',orderNumber:'TEST-20260908-ABC',customerNote:'Commande factice admin',stripeCheckoutSessionId:null,stripePaymentIntentId:null,status:'pending',paymentStatus:'pending',createdAt:new Date(),paidAt:null,items:[]};
test('simulator rejects real orders, legacy ADM orders, external payments and disabled configuration',async()=>{
 for(const unsafe of [{...order,orderNumber:'REAL-1'},{...order,orderNumber:'ADM-1'},{...order,stripePaymentIntentId:'pi_real'},{...order,customerNote:'customer text'}]) {
  const repo=repository({order:{findUnique:async()=>unsafe}});
  await assert.rejects(repo.markAdminOrderPaid({id:'order'}),/réservée/);
  await assert.rejects(repo.deleteAdminOrder({id:'order'}),/réservée/);
 }
 await assert.rejects(repository({},{}).createAdminOrder({}),/désactivé/);
});

test('simulation payment updates both statuses and is idempotent; cancellation retains history',async()=>{
 let current={...order},updates=0;
 const repo=repository({order:{findUnique:async()=>current,findUniqueOrThrow:async()=>current,updateMany:async(q)=>{updates++;current={...current,...q.data};return {count:1};}}});
 await repo.markAdminOrderPaid({id:'order'});const paidAt=current.paidAt;
 await repo.markAdminOrderPaid({id:'order'});
 assert.equal(updates,1);assert.equal(current.status,'paid');assert.equal(current.paidAt,paidAt);
 await assert.rejects(repo.deleteAdminOrder({id:'order'}),/attente/);
 current={...order};await repo.deleteAdminOrder({id:'order'});assert.equal(current.status,'cancelled');
});

test('image decoding rejects disguised text and SVG; valid pixels are reencoded',async()=>{
 const {normalizeProductImage}=load('src/server/catalog/product-image-storage.ts');
 for(const content of ['<script>alert(1)</script>','<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>']) {
  await assert.rejects(normalizeProductImage(new File([content],'fake.png',{type:'image/png'})));
 }
 const png=await sharp({create:{width:8,height:8,channels:3,background:'red'}}).png().toBuffer();
 const result=await normalizeProductImage(new File([png,Buffer.from('PRIVATE TRAILING CONTENT')],'real.png',{type:'image/png'}));
 assert.equal((await sharp(result).metadata()).format,'webp');
 assert.equal(result.includes(Buffer.from('PRIVATE TRAILING CONTENT')),false);
 const oversized={name:'big.png',type:'image/png',size:4*1024*1024+1,arrayBuffer:()=>{throw new Error('Must not read');}};
 await assert.rejects(normalizeProductImage(oversized),/4 Mo/);
});

test('uploaded image receipts reject forgery, changed metadata, wrong users and expiry',()=>{
 const storage=load('src/server/catalog/product-image-storage.ts');
 const image={bucket:'product-images',path:'https://example.invalid/image.webp',originalFilename:'image.png',mimeType:'image/webp',sizeBytes:100,isPrimary:true,position:0};
 const receipt=storage.signProductImageReceipt(image,'admin-1');
 assert.equal(storage.verifyProductImageReceipt(receipt,'admin-1').path,image.path);
 assert.equal(storage.verifyProductImageReceipt(receipt,'admin-2'),null);
 assert.equal(storage.verifyProductImageReceipt(JSON.stringify(image),'admin-1'),null);
 const [data,signature]=receipt.split('.');const decoded=JSON.parse(Buffer.from(data,'base64url'));
 decoded.image.path='https://evil.invalid/fake.webp';
 assert.equal(storage.verifyProductImageReceipt(Buffer.from(JSON.stringify(decoded)).toString('base64url')+'.'+signature,'admin-1'),null);
 const now=Date.now;try {Date.now=()=>now()+3600001;assert.equal(storage.verifyProductImageReceipt(receipt,'admin-1'),null);} finally {Date.now=now;}
});

test('upload endpoint requires admin, rejects oversize streams and signs successful uploads for the user',async()=>{
 let stored=0;
 const route=load('src/app/api/admin/product-images/upload/route.ts',{
  'next/server':{NextResponse:Response},
  '@/server/auth/session':{getCurrentAuthSession:async()=>({role:'admin',user:{id:'admin-1'}})},
  '@/server/security/request-guards':{requireSameOriginRequest:()=>{},enforceRateLimit:()=>{},RateLimitError:class extends Error{}},
  '@/server/catalog/product-image-storage':{maxImageSizeBytes:32,storeProductImages:async(_,uploads)=>{stored++;assert.equal(uploads[0].file.name,'test.png');return [{path:'verified'}];},signProductImageReceipt:(image,id)=>image.path+':'+id}
 });
 const body=new FormData();body.set('image',new File(['pixels'],'test.png',{type:'image/png'}));body.set('position','0');
 const response=await route.POST(new Request('http://localhost/upload',{method:'POST',body}));
 assert.equal(response.status,200);assert.equal((await response.json()).receipt,'verified:admin-1');assert.equal(stored,1);
 const oversized=await route.POST(new Request('http://localhost/upload',{method:'POST',body:new Uint8Array(66000)}));
 assert.equal(oversized.status,413);assert.equal(stored,1);
});
