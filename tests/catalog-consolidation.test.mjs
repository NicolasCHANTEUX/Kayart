import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

test('shop database queries paginate published products and combine user filters', async () => {
  let query, countWhere;
  const tx = { product: { count: async ({where}) => { countWhere=where; return 30; }, findMany: async q => {query=q;return [];} }, category: { findMany: async () => [] } };
  const service=load('src/server/catalog/search.ts', { '@/server/db/prisma': { getPrismaClient: () => ({$transaction:async fn=>fn(tx)}) } });
  const result=await service.searchShop({q:'carbone',category:'pagaies',condition:'used',stock:'1',sort:'price-desc',page:'2'});
  assert.equal(query.take,12);assert.equal(query.skip,12);assert.equal(query.where.publishedAt.not,null);assert.equal(query.where.availability,'available');
  assert.equal(query.where.condition,'used');assert.equal(query.where.category.slug,'pagaies');assert.equal(query.where.stockQuantity.gt,0);
  assert.equal(query.where.OR[0].name.contains,'carbone');assert.deepEqual(query.where,countWhere);
  assert.equal(query.orderBy[0].priceCents.nulls,'last');assert.equal(result.pages,3);
  await service.searchShop({page:'9999'});assert.equal(query.skip,24);assert.equal(query.where.availability.notIn.includes('draft'),true);
});
test('mock shop sorts priced articles before quotes and preserves combined filters', async () => {
  const base={categoryId:'cat',condition:'new',availability:'available',stockQuantity:1,description:'Carbone',sku:'PAG',publishedAt:'2026-09-01'};
  const rows=[{...base,id:'a',name:'Pagaie A',priceCents:null},{...base,id:'b',name:'Pagaie B',priceCents:1990},{...base,id:'c',name:'Pagaie C',priceCents:2990}];
  const service=load('src/server/catalog/search.ts',{'./catalog.repository':{getCatalogRepository:()=>({listPublishedProducts:async()=>rows,listCategories:async()=>[{id:'cat',slug:'pagaies',name:'Pagaies',isActive:true}]})}}, {KAYART_DATA_SOURCE:'mock'});
  assert.equal((await service.searchShop({sort:'price-desc'})).products.map(p=>p.id).join(','),'c,b,a');
  assert.equal((await service.searchShop({q:'pagaie b',category:'pagaies',stock:'1'})).total,1);
  const empty=await service.searchShop({condition:'used'});assert.equal(empty.total,0);assert.equal(empty.pages,1);
});
test('order search authorizes before database access and reaches records beyond the fiftieth', async () => {
  let touched=0,query;
  const denied=load('src/server/catalog/search.ts',{'@/server/auth/session':{requireAdminSession:async()=>{throw new Error('denied');}},'@/server/db/prisma':{getPrismaClient:()=>{touched++;}}});
  await assert.rejects(denied.searchAdminOrders({}),/denied/);assert.equal(touched,0);
  const tx={order:{count:async()=>76,findMany:async q=>{query=q;return [];}}};
  const allowed=load('src/server/catalog/search.ts',{'@/server/auth/session':{requireAdminSession:async()=>({role:'admin'})},'@/server/db/prisma':{getPrismaClient:()=>({$transaction:async fn=>fn(tx)})}});
  const result=await allowed.searchAdminOrders({page:'3',q:'KT-TEST',status:'paid'});
  assert.equal(query.skip,50);assert.equal(query.take,25);assert.equal(query.where.status,'paid');assert.equal(result.total,76);assert.equal(result.pages,4);
});
test('pagination normalizes malformed values and carries safely encoded filters',()=>{
  const {queryPage,pageHref}=load('src/lib/list-query.ts');
  for(const value of ['-1','NaN','0','1e3'])assert.equal(queryPage({page:value}),1);
  assert.equal(pageHref('/boutique',{q:'carbone & bois',sort:'name'},2),'/boutique?q=carbone+%26+bois&sort=name&page=2');
});
test('logout revokes the current Supabase session without touching other sessions', async()=>{
  const auth=load('src/server/auth/supabase-auth.ts',{fetch:async(url,options)=>{
    assert.equal(url,'https://project.supabase.co/auth/v1/logout?scope=local');assert.equal(options.method,'POST');assert.equal(options.headers.Authorization,'Bearer fixture');return new Response(null,{status:204});
  }},{NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-key'});
  await auth.revokePasswordSession('fixture');
});
test('logout always clears both cookies even when remote revocation fails', async()=>{
  for(const fail of [false,true]){
    const writes=[];let revoked=0;
    const session=load('src/server/auth/session.ts',{'next/headers':{cookies:async()=>({get:()=>({value:'fixture'}),set:(...args)=>writes.push(args)})},'./supabase-auth':{revokePasswordSession:async token=>{assert.equal(token,'fixture');revoked++;if(fail)throw new Error('fixture outage');}}});
    await session.clearPasswordSession();assert.equal(revoked,1);assert.equal(writes.length,2);for(const [,value,options]of writes){assert.equal(value,'');assert.equal(options.maxAge,0);assert.equal(options.httpOnly,true);}
  }
});
