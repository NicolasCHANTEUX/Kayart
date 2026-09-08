import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import ts from 'typescript';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const rows=files.map(file=>{
 const bytes=fs.readFileSync(file);const binary=file.endsWith('.db');const text=binary?'':bytes.toString('utf8');
 const group=file.startsWith('src/')?'Application active':file.startsWith('work/figma-')?'Prototype Figma séparé':file.startsWith('work/')?'Cache/outillage sans fonctionnalité':file.startsWith('outputs/')?'Cadrage et documentation':file.startsWith('database/')||file.startsWith('prisma/')?'Base de données':file.startsWith('public/')?'Assets publics':file.startsWith('scripts/')?'Scripts opératoires':'Configuration projet';
 const source=/\.(tsx?|m?js)$/.test(file)?ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true):null;
 const imports=source?source.statements.filter(ts.isImportDeclaration).map(n=>n.moduleSpecifier.text):[];
 const note=group==='Prototype Figma séparé'?'Référence uniquement ; exclu du build Next.js et du périmètre livré':group.startsWith('Cache')?'Inventorié ; aucun code métier à auditer':file==='src/app/globals.css'?'Styles et responsive inspectés ; audit visuel restant':file==='package-lock.json'?'Versions et graphe vérifiés avec npm audit / npm ls':'Lu et rapproché des usages, configurations ou exigences du projet';
 return {file,group,bytes:bytes.length,lines:binary?null:text.split(/\r?\n/).length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),imports,parseDiagnostics:source?.parseDiagnostics.length??0,note};
});
const stats={trackedFiles:rows.length,byGroup:Object.fromEntries([...new Set(rows.map(r=>r.group))].map(group=>[group,rows.filter(r=>r.group===group).length])),applicationLines:rows.filter(r=>r.group==='Application active').reduce((n,r)=>n+r.lines,0)};
fs.writeFileSync('outputs/audit-2026-09-07/inventaire-fichiers.json',JSON.stringify({stats,files:rows},null,2));
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
fs.writeFileSync('outputs/audit-2026-09-07/inventaire-fichiers.csv','\ufeff'+['Fichier;Périmètre;Octets;Lignes;SHA256;Traitement',...rows.map(r=>[r.file,r.group,r.bytes,r.lines,r.sha256,r.note].map(quote).join(';'))].join('\n'));
console.log(JSON.stringify(stats,null,2));
console.log('Diagnostics syntaxiques',rows.filter(r=>r.parseDiagnostics).map(r=>({file:r.file,count:r.parseDiagnostics})));
