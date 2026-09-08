// Modifie uniquement la copie isolée utilisée par l'audit.
import fs from 'node:fs';
const copy='work/audit-2026-09-07-app/';
fs.appendFileSync(copy+'src/data/products.ts', '\nproducts.push({ ...products[0], id: "audit-private-draft", slug: "audit-private-draft", name: "AUDIT_PRIVATE_DRAFT_7391", sku: "PRIVATE-7391", availability: "draft", publishedAt: null, description: "Description confidentielle fictive 7391" });\n');
const file=copy+'src/server/catalog/catalog.repository.ts';
let code=fs.readFileSync(file,'utf8');
code=code.replace('async listAdminOrders() {\n    return [];\n  }', 'async listAdminOrders() { return [{id:"audit-order",orderNumber:"REAL-AUDIT-7391",guestEmail:"private-audit-7391@example.invalid",status:"pending",paymentStatus:"pending",currency:"EUR",subtotalCents:1000,shippingCents:0,totalCents:1000,customerNote:"PRIVATE_NOTE_7391",paidAt:null,createdAt:"2026-09-07T00:00:00Z",isFictive:false,items:[]}]; }');
// Prend également en charge les fichiers CRLF.
code=code.replace('async listAdminOrders() {\r\n    return [];\r\n  }', 'async listAdminOrders() { return [{id:"audit-order",orderNumber:"REAL-AUDIT-7391",guestEmail:"private-audit-7391@example.invalid",status:"pending",paymentStatus:"pending",currency:"EUR",subtotalCents:1000,shippingCents:0,totalCents:1000,customerNote:"PRIVATE_NOTE_7391",paidAt:null,createdAt:"2026-09-07T00:00:00Z",isFictive:false,items:[]}]; }');
fs.writeFileSync(file,code);
console.log('Fixtures ajoutées uniquement à la copie isolée.');
