import fs from 'node:fs';
import path from 'node:path';
const target='work/urgent-production-check';
fs.mkdirSync(target,{recursive:true});
for(const name of ['src','public','prisma','package.json','package-lock.json','next.config.ts','tsconfig.json','next-env.d.ts']) {
  fs.cpSync(name,path.join(target,name),{recursive:true,filter:(source)=>!source.includes(path.join('public','uploads'))});
}
fs.appendFileSync(target+'/src/data/products.ts','\nproducts.push({ ...products[0], id:"regression-private-draft", slug:"regression-private-draft", name:"PRIVATE_DRAFT_7391", sku:"PRIVATE-7391", availability:"draft", publishedAt:null, description:"PRIVATE_DESCRIPTION_7391" });\n');
const repo=target+'/src/server/catalog/catalog.repository.ts';
const source=fs.readFileSync(repo,'utf8').replace(/async listAdminOrders\(\) \{\s*return \[\];\s*\}/,'async listAdminOrders() { return [{id:"private-order",orderNumber:"REAL-7391",guestEmail:"private-7391@example.invalid",status:"pending",paymentStatus:"pending",currency:"EUR",subtotalCents:1000,shippingCents:0,totalCents:1000,customerNote:"PRIVATE_NOTE_7391",paidAt:null,createdAt:"2026-09-08T00:00:00Z",isFictive:false,items:[]}]; }');
if (!source.includes('PRIVATE_NOTE_7391')) throw new Error('Private fixture injection failed');
fs.writeFileSync(repo,source);
console.log('Isolated production copy prepared with private fixtures; no environment or client data copied.');
