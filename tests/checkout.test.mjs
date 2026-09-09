import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { load } from './helpers/load-module.mjs';

const productId=randomUUID();
function input(overrides={}) { return { checkoutKey:randomUUID(),email:'buyer@example.invalid',name:'Test buyer',method:'pickup',address:null,shippingZoneId:null,items:[{productId,quantity:1}],...overrides }; }
function harness({stock=1, zones=[]}={}) {
 let state={products:[{id:productId,name:'Test piece',sku:'FIXTURE',publishedAt:new Date(),availability:'available',condition:'new',isCustomizable:false,priceCents:1990,stockQuantity:stock,deliveryMode:'shippable'}],orders:[],holds:[],events:[]};
 const sessions=new Map();let stripeCalls=0,lock=Promise.resolve();
 const getOrder=q=>state.orders.find(order=>q.where.id?order.id===q.where.id:order.checkoutKey===q.where.checkoutKey);
 const full=order=>order?structuredClone({...order,checkoutHolds:state.holds.filter(hold=>hold.orderId===order.id)}):null;
 const db={
  product:{findMany:async()=>structuredClone(state.products),updateMany:async(q)=>{const row=state.products.find(p=>p.id===q.where.id&&p.stockQuantity>=q.where.stockQuantity.gte);if(!row)return {count:0};row.stockQuantity-=q.data.stockQuantity.decrement;return {count:1};},update:async(q)=>{const row=state.products.find(p=>p.id===q.where.id);row.stockQuantity+=q.data.stockQuantity.increment;return structuredClone(row);}},
  shippingZone:{findMany:async()=>zones},
  order:{findUnique:async q=>full(getOrder(q)),create:async({data})=>{const id=randomUUID(),order={...data,id,status:'pending',paymentStatus:'pending',stripeCheckoutSessionId:null,items:data.items.create};state.orders.push(order);for(const hold of data.checkoutHolds.create)state.holds.push({...hold,id:randomUUID(),orderId:id,status:'active'});return full(order);},update:async(q)=>{const row=getOrder(q);Object.assign(row,q.data);return full(row);},updateMany:async(q)=>{const row=getOrder(q);if(!row)return {count:0};Object.assign(row,q.data);return {count:1};}},
  checkoutHold:{findMany:async(q)=>structuredClone(state.holds.filter(h=>h.orderId===q.where.orderId&&h.status===q.where.status)),updateMany:async(q)=>{let count=0;for(const hold of state.holds){if((!q.where.id||q.where.id===hold.id)&&(!q.where.orderId||q.where.orderId===hold.orderId)&&hold.status===q.where.status){Object.assign(hold,q.data);count++;}}return {count};}},
  stripeEvent:{findUnique:async(q)=>state.events.includes(q.where.id)?{id:q.where.id}:null,create:async(q)=>{if(state.events.includes(q.data.id))throw Object.assign(new Error('duplicate'),{code:'P2002'});state.events.push(q.data.id);return q.data;}}
 };
 db.$transaction=(fn)=>{const run=lock.then(async()=>{const snapshot=structuredClone(state);try{return await fn(db);}catch(error){state=snapshot;throw error;}});lock=run.catch(()=>{});return run;};
 const stripe={checkout:{sessions:{create:async(params,options)=>{stripeCalls++;const id='cs_test_'+randomUUID().replaceAll('-','');const session={id,url:'https://checkout.stripe.com/c/pay/'+id,mode:'payment',livemode:false,status:'open',payment_status:'unpaid',currency:'eur',amount_total:params.line_items.reduce((sum,item)=>sum+item.quantity*item.price_data.unit_amount,0),metadata:params.metadata,params,idempotencyKey:options.idempotencyKey};sessions.set(id,session);return session;},retrieve:async id=>sessions.get(id)}}};
 const mocks={'@/server/db/prisma':{getPrismaClient:()=>db},'@/server/checkout/stripe':{getTestStripe:()=>stripe,isTestCheckoutEnabled:()=>true}};
 const service=load('src/server/checkout/checkout-service.ts',mocks,{NEXT_PUBLIC_SITE_URL:'https://test.example.invalid'});
 const settlement=load('src/server/checkout/settlement.ts',mocks);
 const reconciliation=load('src/server/checkout/reconciliation.ts',mocks);
 return {service,settlement,reconciliation,db,stripe,state:()=>state,sessions, stripeCalls:()=>stripeCalls};
}

test('cart normalizes duplicates and rejects malformed, excessive or fractional quantities',()=>{
 const {normalizeCart}=load('src/lib/cart.ts');
 assert.equal(normalizeCart([{productId,quantity:1},{productId,quantity:2}])[0].quantity,3);
 for(const items of [[{productId,quantity:0}],[{productId,quantity:1.5}],[{productId,quantity:11}],Array(21).fill({productId,quantity:1})]) assert.throws(()=>normalizeCart(items));
});
test('shipping requires a positive configured rate and matching country and postal rules',()=>{
 const {availableShippingZones}=load('src/server/checkout/shipping.ts');
 const zone={id:'fr',name:'France fixture',countryCodes:['FR'],postalPrefixes:[],excludedPostalPrefixes:['20','97','98'],priceCents:1234,enabled:true};
 assert.equal(availableShippingZones([zone],'FR','75001',true).length,1);
 for(const postal of ['20000','97100','98000','wrong',''])assert.equal(availableShippingZones([zone],'FR',postal,true).length,0);
 for(const altered of [{...zone,enabled:false},{...zone,priceCents:null},{...zone,priceCents:0}])assert.equal(availableShippingZones([altered],'FR','75001',true).length,0);
 assert.equal(availableShippingZones([zone],'BE','1000',true).length,0);
 assert.equal(availableShippingZones([zone],'FR','75001',false).length,0);
});
test('shipping settings cannot activate an empty or invalid tariff',()=>{
 const {parseShippingZone}=load('src/server/checkout/shipping-input.ts');const fd=new FormData();fd.set('name','France');fd.set('countryCodes','fr');
 assert.equal(parseShippingZone(fd).priceCents,null);fd.set('enabled','on');assert.throws(()=>parseShippingZone(fd));
 fd.set('price','12,34');assert.equal(parseShippingZone(fd).priceCents,1234);
});
test('checkout blocks live keys and requires explicit test configuration',()=>{
 for(const key of ['sk_live_never_use','rk_live_never_use','']){
  const stripe=load('src/server/checkout/stripe.ts',{}, {STRIPE_SECRET_KEY:key,KAYART_CHECKOUT_MODE:'test',STRIPE_WEBHOOK_SECRET:'test-only'});
  assert.equal(stripe.isTestCheckoutEnabled(),false);assert.throws(()=>stripe.getTestStripe());
 }
});
test('checkout uses server prices and free pickup, and retries reuse the Stripe session',async()=>{
 const h=harness(),request=input();const response=await h.service.startTestCheckout(request);
 const session=[...h.sessions.values()][0];assert.equal(session.amount_total,1990);assert.equal(h.state().orders[0].shippingCents,0);assert.equal(h.state().products[0].stockQuantity,0);
 assert.equal(h.state().orders[0].customerName,'Test buyer');
 assert.equal(session.params.line_items[0].price_data.unit_amount,1990);assert.match(response.url,/checkout.stripe.com/);
 await h.service.startTestCheckout(request);assert.equal(h.stripeCalls(),1);assert.equal(h.state().orders.length,1);
 await assert.rejects(h.service.startTestCheckout({...request,email:'different@example.invalid'}),/changé/);
});
test('two checkouts cannot reserve the same last unit',async()=>{
 const h=harness();const results=await Promise.allSettled([h.service.startTestCheckout(input()),h.service.startTestCheckout(input())]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(h.state().products[0].stockQuantity,0);assert.equal(h.state().orders.length,1);
});
test('unavailable shipping fails before any stock is reserved',async()=>{
 const h=harness();await assert.rejects(h.service.startTestCheckout(input({method:'shipping',shippingZoneId:randomUUID(),address:{country:'FR',postalCode:'20000'}})),/livraison/);
 assert.equal(h.state().products[0].stockQuantity,1);assert.equal(h.state().orders.length,0);assert.equal(h.stripeCalls(),0);
});
test('verified payment commits holds exactly once without double decrementing stock',async()=>{
 const h=harness();await h.service.startTestCheckout(input());const session={...[...h.sessions.values()][0],status:'complete',payment_status:'paid',payment_intent:'pi_test_fixture'};
 await h.settlement.settleVerifiedSession(session,'evt_paid_fixture','paid');const paidAt=h.state().orders[0].paidAt;
 await h.settlement.settleVerifiedSession(session,'evt_paid_fixture','paid');
 assert.equal(h.state().products[0].stockQuantity,0);assert.equal(h.state().orders[0].paymentStatus,'paid');assert.equal(h.state().holds[0].status,'committed');assert.equal(h.state().orders[0].paidAt,paidAt);
 await assert.rejects(h.settlement.settleVerifiedSession(session,'evt_wrong_expiration','expired'));
});
test('verified expiry releases stock once; a wrong amount never finalizes payment',async()=>{
 const h=harness();await h.service.startTestCheckout(input());const session=[...h.sessions.values()][0];
 await assert.rejects(h.settlement.settleVerifiedSession({...session,payment_status:'paid',amount_total:1},'evt_wrong_amount','paid'),/mismatch/);
 assert.equal(h.state().events.length,0);assert.equal(h.state().orders[0].paymentStatus,'pending');
 await h.settlement.settleVerifiedSession({...session,status:'expired'},'evt_expiry','expired');
 await h.settlement.settleVerifiedSession({...session,status:'expired'},'evt_expiry_again','expired');
 assert.equal(h.state().products[0].stockQuantity,1);assert.equal(h.state().holds[0].status,'released');
});
test('webhook verifies the raw body signature before settlement and rejects live events',async()=>{
 const stripe=new Stripe('sk_test_local_signature_only');const secret='whsec_local_signature_only';let calls=0;
 const route=load('src/app/api/stripe/webhook/route.ts',{'@/server/checkout/stripe':{getTestStripe:()=>stripe},'@/server/checkout/settlement':{settleVerifiedSession:async()=>{calls++;}}},{STRIPE_WEBHOOK_SECRET:secret});
 async function send(event,tamper=false){const payload=JSON.stringify(event);const signature=stripe.webhooks.generateTestHeaderString({payload,secret});return route.POST(new Request('https://test.example.invalid/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':signature},body:tamper?payload+' ':payload}));}
 const event={id:'evt_fixture',livemode:false,type:'checkout.session.completed',data:{object:{id:'cs_test_fixture'}}};
 assert.equal((await send(event,true)).status,400);assert.equal(calls,0);
 assert.equal((await send({...event,livemode:true})).status,400);assert.equal(calls,0);
 assert.equal((await send(event)).status,200);assert.equal(calls,1);
});
test('legal publication is blocked without complete approved data and rejects known mock identities',()=>{
 const config=load('src/config/legal.ts').getLegalConfig();assert.equal(config.approved,false);assert.ok(config.missing.includes('legalName'));
 const fake=load('src/config/legal.ts',{}, {KAYART_LEGAL_APPROVED:'true',KAYART_LEGAL_NAME:'KayArt SARL',KAYART_LEGAL_REGISTRATION:'000 000 000 00000'}).getLegalConfig();assert.equal(fake.approved,false);assert.ok(fake.missing.includes('legalName'));
});

test('cancelling before order creation prevents a late request from reserving stock',async()=>{
 const h=harness(),request=input();
 assert.equal((await h.reconciliation.reconcileCheckout(request.checkoutKey,true)).status,'absent');
 await assert.rejects(h.service.startTestCheckout(request),/annulée/);
 assert.equal(h.state().products[0].stockQuantity,1);
});
test('a definitive Stripe rejection releases stock, an ambiguous network failure retains it',async()=>{
 for(const type of ['StripeInvalidRequestError','StripeConnectionError']){
  const h=harness(),request=input();h.stripe.checkout.sessions.create=async()=>{throw {type};};
  await assert.rejects(h.service.startTestCheckout(request));
  assert.equal(h.state().products[0].stockQuantity,type==='StripeInvalidRequestError'?1:0);
  assert.equal(h.state().holds[0].status,type==='StripeInvalidRequestError'?'released':'active');
 }
});
test('admin order workflow authorizes first and requires a verified payment and current status',async()=>{
 let reads=0;const id=randomUUID();
 const denied=load('src/server/checkout/admin-orders.ts',{'@/server/auth/session':{requireAdminSession:async()=>{throw new Error('denied');}},'@/server/checkout/transactions':{checkoutTransaction:async()=>{reads++;}}});
 await assert.rejects(denied.advanceTestOrder(id,'paid'),/denied/);assert.equal(reads,0);
 const order={id,isTest:true,paymentStatus:'paid',stripeCheckoutSessionId:'cs_test_fixture',status:'paid',fulfillmentMethod:'pickup'};
 const service=load('src/server/checkout/admin-orders.ts',{'@/server/auth/session':{requireAdminSession:async()=>({})},'@/server/checkout/transactions':{checkoutTransaction:async fn=>fn({order:{findUnique:async()=>order,update:async q=>Object.assign(order,q.data)}})}});
 await service.advanceTestOrder(id,'paid');assert.equal(order.status,'preparing');
 await assert.rejects(service.advanceTestOrder(id,'paid'));
 await service.advanceTestOrder(id,'preparing');assert.equal(order.status,'ready');
 await service.advanceTestOrder(id,'ready');assert.equal(order.status,'completed');
 await assert.rejects(service.advanceTestOrder(id,'completed'));
 order.status='paid';order.paymentStatus='pending';await assert.rejects(service.advanceTestOrder(id,'paid'));
});
test('cron denies missing or incorrect authorization before any database access',async()=>{
 let reads=0;const route=load('src/app/api/cron/checkouts/route.ts',{'@/server/db/prisma':{getPrismaClient:()=>{reads++;throw new Error('unexpected');}}},{CRON_SECRET:'local-fixture'});
 for(const authorization of ['', 'Bearer wrong'])assert.equal((await route.GET(new Request('https://test.invalid/api/cron/checkouts',{headers:{authorization}}))).status,401);
 assert.equal(reads,0);
});
