import fs from 'node:fs';
import path from 'node:path';
const folder='outputs/audit-2026-09-07';
const root=process.cwd().replaceAll('\\','/');
const reports=['README.md','01-urgences.md','02-fonctionnalites-et-completion.md'];
const failures=[];
for(const name of reports){
 let content=fs.readFileSync(path.join(folder,name),'utf8');
 content=content.replaceAll('src/server/catalog/catalog.input.ts:726','src/server/catalog/catalog.input.ts:722');
 content=content.replace(/`((?:src|prisma|database|scripts)\/[^`\n]+):(\d+)`/g,(_,file,line)=>{
  if(!fs.existsSync(file)) failures.push('Source absente : '+file);
  else if(Number(line)>fs.readFileSync(file,'utf8').split(/\r?\n/).length) failures.push('Ligne absente : '+file+':'+line);
  return '['+file+':'+line+'](<'+root+'/'+file+':'+line+'>)';
 });
 for(const match of content.matchAll(/\]\(([^)]+)\)/g)){
  const link=match[1];
  if(link.startsWith('http')||link.startsWith('<')||link.startsWith('#')) continue;
  if(!fs.existsSync(path.resolve(folder,link))) failures.push('Lien absent : '+name+' '+link);
 }
 fs.writeFileSync(path.join(folder,name),content);
}
console.log(JSON.stringify({reports,failures},null,2));
if(failures.length) process.exitCode=1;
