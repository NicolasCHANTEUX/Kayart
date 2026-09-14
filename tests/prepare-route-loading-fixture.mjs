import './prepare-production-check.mjs';
import fs from 'node:fs';

// Artificial latency lives only in the isolated mock copy, never in application source.
for (const [file, anchor] of [
  ['src/app/page.tsx', '  const products ='],
  ['src/app/boutique/page.tsx', '  const result ='],
  ['src/app/contact/page.tsx', '  const params =']
]) {
  const target = 'work/urgent-production-check/' + file;
  const source = fs.readFileSync(target, 'utf8');
  if (!source.includes(anchor)) throw new Error('Loading fixture anchor missing: ' + file);
  fs.writeFileSync(target, source.replace(anchor, '  await new Promise(resolve => setTimeout(resolve, 2000));\n' + anchor));
}
console.log('Home, shop and contact delayed by 2 seconds in the isolated copy.');
