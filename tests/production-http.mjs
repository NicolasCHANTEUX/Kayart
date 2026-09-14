import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:3107';
const results=[];
const privateMarkers=['PRIVATE_DRAFT_7391','PRIVATE_DESCRIPTION_7391','PRIVATE_NOTE_7391','private-7391@example.invalid'];
for(const path of ['/admin','/admin/produits','/admin/commandes','/admin/demandes','/admin/livraison','/admin/produits/regression-private-draft/modifier','/boutique','/boutique/regression-private-draft']) {
  for(const rsc of [false,true]) {
    const response=await fetch(base+path,{redirect:'manual',headers:rsc?{RSC:'1'}:{}});
    const body=await response.text();
    for(const marker of privateMarkers) assert.equal(body.includes(marker),false,path+' must not serialize '+marker);
    if(path==='/boutique') { assert.equal(response.status,200); assert.ok(body.length>1000); }
    if(path.startsWith('/admin')) assert.ok([200,303,307].includes(response.status));
    results.push({path,rsc,status:response.status,privateMarkersAbsent:true});
  }
}
for(const [origin,status] of [[base,401],['https://evil.invalid',403]]) {
 const response=await fetch(base+'/api/admin/product-images/upload',{method:'POST',headers:{origin}});
 assert.equal(response.status,status);results.push({path:'/api/admin/product-images/upload',origin,status});
}
const retired=await fetch(base+'/api/admin/product-images/upload-url',{method:'POST'});
assert.equal(retired.status,410);
const contact=await fetch(base+'/contact?produit=Produit%20test&reference=REF-1');
const contactBody=await contact.text();
assert.ok(contactBody.includes('mailto:'));assert.ok(contactBody.includes('REF-1'));assert.ok(contactBody.includes('tel:'));
const csp=contact.headers.get('content-security-policy');
assert.equal(csp.includes("'unsafe-eval'"),false,'production must never permit the development eval runtime');
for(const domain of ['https://images.unsplash.com','https://fonts.googleapis.com','https://fonts.gstatic.com']) assert.ok(csp.includes(domain));
results.push({path:'/contact',status:contact.status,contextualContact:true,cspResourcesAllowed:true});
for(const path of ['/mentions-legales','/cgv','/confidentialite']) {
 const response=await fetch(base+path);assert.equal(response.status,404);
 const body=await response.text();for(const fake of ['KayArt SARL','12 Route des Coudrais','000 000 000 00000']) assert.equal(body.includes(fake),false);
 results.push({path,status:response.status,legalPublicationBlocked:true});
}
for(const path of ['/contact','/reparation','/sur-mesure']){
 const response=await fetch(base+path),body=await response.text();assert.equal(response.status,200);assert.ok(body.includes('submissionKey'));assert.ok(body.includes('privacyAcknowledged'));results.push({path,status:response.status,formPresent:true});
}
for(const [path,method,status] of [['/api/checkout','POST',503],['/api/stripe/webhook','POST',400],['/api/cron/checkouts','GET',401],['/api/admin/request-images/11111111-1111-4111-8111-111111111111','GET',401]]){
 const response=await fetch(base+path,{method,headers:{origin:base}});assert.equal(response.status,status);results.push({path,status});
}
const quote=await fetch(base+'/api/cart/quote',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({items:[]})});
assert.equal(quote.status,200);const payload=await quote.json();assert.equal(payload.testCheckoutEnabled,false);assert.equal(payload.shippingZones.length,0);results.push({path:'/api/cart/quote',status:quote.status,paymentDisabled:true,noInventedRate:true});
const partialQuote=await fetch(base+'/api/cart/quote',{method:'POST',headers:{origin:base,'Content-Type':'application/json'},body:JSON.stringify({items:[{productId:'regression-private-draft',quantity:1},{productId:'imperfect-paddle',quantity:1}]})});
assert.equal(partialQuote.status,200);const partial=await partialQuote.json();assert.equal(partial.canCheckout,false);
assert.equal(partial.lines.find(line=>line.productId==='regression-private-draft').slug,null);
assert.equal(partial.lines.find(line=>line.productId==='imperfect-paddle').issue,null);
for(const marker of privateMarkers) assert.equal(JSON.stringify(partial).includes(marker),false);
results.push({path:'/api/cart/quote',partialCartPreserved:true,privateProductHidden:true});
const orderPage=await fetch(base+'/commande'),orderBody=await orderPage.text();assert.equal(orderPage.status,200);assert.ok(orderBody.includes('Préparer votre commande'));assert.ok(/name="robots" content="noindex, nofollow"/.test(orderBody));results.push({path:'/commande',status:orderPage.status,noindex:true});
for (const path of ['/boutique?q=aucun-resultat-fixture-62948','/boutique?q=regression-private-draft']) {
 const response=await fetch(base+path),body=await response.text();assert.equal(response.status,200);assert.ok(body.includes('Aucun produit ne correspond'));assert.equal(body.includes('PRIVATE_DRAFT_7391'),false);results.push({path,status:response.status,emptySearchSafe:true});
}
const filtered=await fetch(base+'/boutique?sort=price-asc&stock=1&page=9999');
const filteredBody=await filtered.text();assert.equal(filtered.status,200);assert.ok(filteredBody.includes('name="sort"'));assert.ok(filteredBody.includes('Aller au contenu'));results.push({path:'/boutique?sort=price-asc&stock=1&page=9999',status:filtered.status,filtersPresent:true});
const outputDir=process.env.KAYART_HTTP_REPORT_DIR || 'outputs/suite-v1-2026-09-08';
const robots=await fetch(base+'/robots.txt'),robotsBody=await robots.text();
assert.equal(robots.status,200);assert.ok(robotsBody.includes('Disallow: /'));assert.equal(robotsBody.includes('Sitemap:'),false);
results.push({path:'/robots.txt',status:robots.status,indexingDisabled:true});
const sitemap=await fetch(base+'/sitemap.xml'),sitemapBody=await sitemap.text();
assert.equal(sitemap.status,200);assert.equal(sitemapBody.includes('<loc>'),false);
for(const marker of privateMarkers) assert.equal(sitemapBody.includes(marker),false);
results.push({path:'/sitemap.xml',status:sitemap.status,noMockOrPrivateUrls:true});
assert.ok(/name="robots" content="noindex, nofollow"/.test(filteredBody));
results.push({path:'/boutique',previewNoindexMetadata:true});
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(outputDir+'/http-verification.json',JSON.stringify(results,null,2));
console.log('Production HTTP checks passed:',results.length,'checks plus retired endpoint (410).');
