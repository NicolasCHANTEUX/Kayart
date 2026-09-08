import fs from 'node:fs';
const base='http://127.0.0.1:3107';
const results=[];
for(const route of ['/','/boutique','/boutique/pagaie-carbone-signature','/panier','/reparation','/sur-mesure','/contact','/journal','/savoir-faire','/connexion','/inscription','/mot-de-passe-oublie','/nouveau-mot-de-passe','/cgv','/confidentialite','/mentions-legales','/manifest.webmanifest','/sw.js','/sitemap.xml','/robots.txt','/faq','/services','/journal/article-inexistant','/boutique/inexistant','/admin','/admin/produits','/admin/commandes','/admin/produits/nouveau']) {
 const response=await fetch(base+route,{redirect:'manual'});const html=await response.text();
 if(route.startsWith('/admin')) fs.writeFileSync('outputs/audit-2026-09-07/preuve-http'+route.replaceAll('/','-')+'.html',html);
 results.push({route,status:response.status,location:response.headers.get('location'),htmlBytes:Buffer.byteLength(html),hasLoginRedirectInStream:html.includes('NEXT_REDIRECT')&&html.includes('/connexion'),hasCartLink:html.includes('Ajouter au panier'),hasForms:html.includes('<form'),...(route==='/'?{csp:response.headers.get('content-security-policy'),cacheControl:response.headers.get('cache-control')}: {})});
}
for(const [origin,expected] of [['http://127.0.0.1:3107',401],['https://example.invalid',403]]) {
 const response=await fetch(base+'/api/admin/product-images/upload-url',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({files:[]})});results.push({route:'POST upload-url',origin,status:response.status,expected});
}
fs.writeFileSync('outputs/audit-2026-09-07/preuves-http.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
const adminHtml=fs.readFileSync('outputs/audit-2026-09-07/preuve-http-admin-produits.html','utf8');
for(const key of ['priceCents','stockQuantity','categoryId','ProductTable','KAY-PAG-SIGNATURE']) {const i=adminHtml.indexOf(key); console.log(key,i,i<0?'':adminHtml.slice(Math.max(0,i-60),i+180));}
