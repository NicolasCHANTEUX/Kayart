import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:3107';
const results=[];
const privateMarkers=['PRIVATE_DRAFT_7391','PRIVATE_DESCRIPTION_7391','PRIVATE_NOTE_7391','private-7391@example.invalid'];
for(const path of ['/admin','/admin/produits','/admin/commandes','/admin/produits/regression-private-draft/modifier','/boutique','/boutique/regression-private-draft']) {
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
for(const domain of ['https://images.unsplash.com','https://fonts.googleapis.com','https://fonts.gstatic.com']) assert.ok(csp.includes(domain));
results.push({path:'/contact',status:contact.status,contextualContact:true,cspResourcesAllowed:true});
fs.mkdirSync('outputs/corrections-2026-09-08',{recursive:true});
fs.writeFileSync('outputs/corrections-2026-09-08/http-verification.json',JSON.stringify(results,null,2));
console.log('Production HTTP checks passed:',results.length,'checks plus retired endpoint (410).');
