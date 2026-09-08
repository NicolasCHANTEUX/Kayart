import fs from 'node:fs';
const results=[];
for(const route of ['/boutique','/admin/produits','/admin/commandes','/admin/produits/audit-private-draft/modifier']) {
 const response=await fetch('http://127.0.0.1:3107'+route);const html=await response.text();
 results.push({route,status:response.status,unauthenticated:true,redirectInStream:html.includes('NEXT_REDIRECT')&&html.includes('/connexion'),privateDraftInResponse:html.includes('AUDIT_PRIVATE_DRAFT_7391'),customerEmailInResponse:html.includes('private-audit-7391@example.invalid'),internalNoteInResponse:html.includes('PRIVATE_NOTE_7391')});
 fs.writeFileSync('outputs/audit-2026-09-07/fixture'+route.replaceAll('/','-')+'.html',html);
}
fs.writeFileSync('outputs/audit-2026-09-07/preuves-fuite-admin.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
