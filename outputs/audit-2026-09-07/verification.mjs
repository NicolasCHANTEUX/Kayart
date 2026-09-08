// Audit uniquement : exécute le code existant sur des doubles en mémoire.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const root = process.cwd();
const out = path.join(root, 'outputs/audit-2026-09-07');
const nativeRequire = createRequire(import.meta.url);
const results = [];
function load(file, mocks = {}, extra = '') {
  const cache = new Map();
  function inner(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const source = fs.readFileSync(filename, 'utf8') + (filename === path.resolve(root, file) ? extra : '');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const req = (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id);
        for (const suffix of ['', '.ts', '.tsx']) if (fs.existsSync(base + suffix) && fs.statSync(base + suffix).isFile()) return inner(base + suffix);
      }
      return nativeRequire(id);
    };
    vm.runInNewContext('(function(require,module,exports){' + compiled + '\n})', { process: { env: { KAYART_DATA_SOURCE: 'prisma' } }, URL, FormData, File, Buffer, console, Date, Math, setTimeout, clearTimeout })(req, module, module.exports);
    return module.exports;
  }
  return inner(file);
}
function record(id, observation) { results.push({ id, observation }); }
const input = load('src/server/catalog/catalog.input.ts');
const draft = load('src/server/catalog/product-form-draft.ts');
const mapper = load('src/server/catalog/catalog.mapper.ts');
const base = { id:'example', name:'Produit test', slug:'produit-test', sku:'TEST', categoryId:'category', condition:'new', availability:'available', priceCents:1990, compareAtPriceCents:null, stockQuantity:1, description:'Description technique existante.', shortDescription:'Test', attributes:[{label:'Poids',value:'0.5',unit:'kg'},{label:'Dimensions',value:'20 cm'},{label:'Matière',value:'Carbone'}], images:[], isFeatured:false,isCustomizable:false,isReservable:false };
const values = draft.createProductFormDraftFromProduct(base);
const fd = new FormData(); Object.entries(values).forEach(([k,v]) => { if (v !== undefined && typeof v !== 'boolean') fd.set(k,v); }); fd.set('id',base.id);
const parsed = input.parseProductUpdateFormData(fd);
record('U04', { originalPriceCents:base.priceCents, formBasePrice:values.basePrice, savedPriceCents:parsed.priceCents });
record('U05', { originalAttributes:base.attributes, attributesSubmitted:parsed.attributes });
const giantDraft = draft.encodeProductFormDraft({ description:'é'.repeat(2000) });
record('C12', { cookieValueBytesFor2000AccentedCharacters:Buffer.byteLength(giantDraft) });
const row = { ...base, condition:'used', category:null, images:[], attributes:[], publishedAt:null };
record('U06', { databaseCondition:'used', displayedCondition:mapper.mapPrismaProduct(row).condition });
let linkedAccount = { id:'customer-example', role:'admin', authUserId:'legitimate-auth-id' };
const auth = load('src/server/auth/session.ts', {
  'next/headers':{cookies:async()=>({get:()=>undefined})},
  'next/navigation':{redirect:()=>{}},
  './supabase-auth':{getSupabaseAuthUser:async()=>null},
  '@/server/db/prisma':{getPrismaClient:()=>({customer:{findUnique:async()=>null,findFirst:async()=>({...linkedAccount}),update:async({data})=>Object.assign(linkedAccount,data)}})}
});
const role = await auth.resolveAuthenticatedSession({id:'unverified-or-obfuscated-auth-id',email:'admin@example.invalid'});
record('U01', { existingLinkReplaced:linkedAccount.authUserId, returnedRole:role.role, scope:'Simulation locale de la réponse signup, aucun compte distant modifié' });
const page = load('src/app/boutique/[slug]/page.tsx', {'next/link':{},'next/navigation':{},'@/components/catalog/product-gallery':{},'@/components/catalog/product-price':{},'@/server/catalog/catalog.service':{}}, '\nexport { getPrimaryAction };');
record('U07', { reservedProductAction:page.getPrimaryAction({...base,availability:'reserved'}) });
const login = load('src/app/connexion/actions.ts', {'next/navigation':{},'@/server/auth/session':{},'@/server/auth/supabase-auth':{},'@/server/security/request-guards':{}}, '\nexport { sanitizeRedirectPath, readRequiredField };');
const unsafePath = '/\\example.invalid';
record('U03', { accepted:login.sanitizeRedirectPath(unsafePath), resolvedOrigin:new URL(login.sanitizeRedirectPath(unsafePath),'https://kayart.example').origin });
const passwordForm = new FormData(); passwordForm.set('password','  password123  ');
record('C11', { submittedLength:14, loginPasswordLength:login.readRequiredField(passwordForm,'password').length });
const guard = load('src/server/security/request-guards.ts',{'next/headers':{headers:async()=>new Headers({'x-forwarded-for':'192.0.2.1'})}});
for(let i=0;i<20;i++) guard.enforceRateLimit({key:await guard.getActionClientKey('signup',`u${i}@example.invalid`),limit:5,windowMs:3600000});
record('C10',{requestsFromSameIpWithDifferentEmailsAccepted:20,perPairLimit:5});
const statements=[];
const fakeTx={orderItem:{updateMany:async(q)=>statements.push(['orderItem.updateMany',q])},reservation:{deleteMany:async(q)=>statements.push(['reservation.deleteMany',q])},product:{delete:async(q)=>statements.push(['product.delete',q])}};
const fakePrisma={$transaction:async(fn)=>fn(fakeTx),order:{delete:async(q)=>statements.push(['order.delete',q]),update:async(q)=>{statements.push(['order.update',q]); return {...q.data,id:'real-order',orderNumber:'REAL-1',createdAt:new Date(),items:[]};}}};
const repo=load('src/server/catalog/catalog.repository.ts',{'@/server/db/prisma':{getPrismaClient:()=>fakePrisma}});
await repo.prismaCatalogRepository.deleteProduct({id:'sold-product'});
await repo.prismaCatalogRepository.deleteAdminOrder({id:'real-order'});
await repo.prismaCatalogRepository.markAdminOrderPaid({id:'real-order'});
record('U08',{statements});
fs.writeFileSync(path.join(out,'preuves-reproductions.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
