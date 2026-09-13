import assert from 'node:assert/strict';
import fs from 'node:fs';
// Use only the project's dedicated headless browser and local fixture application.
const endpoint='http://127.0.0.1:9224',origin='http://localhost:3107';
const target=await (await fetch(endpoint+'/json/new?'+encodeURIComponent(origin),{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let sequence=0;const pending=new Map(),results=[];
ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(pending.has(message.id)){const [resolve,reject]=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,[resolve,reject]);ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;};
async function waitFor(expression){for(let i=0;i<60;i++){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,150));}throw new Error('UI wait expired: '+expression);}
async function navigate(path){await call('Page.navigate',{url:origin+path});await waitFor('document.readyState === "complete" && !!document.querySelector(".site-header")');await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))])');}
try {
 await call('Page.enable');await call('Runtime.enable');
 for(const width of [320,390,768,860,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
  for(const path of ['/','/boutique','/contact','/reparation','/sur-mesure','/connexion','/inscription','/savoir-faire','/journal','/panier','/boutique/pagaie-carbone-signature-imparfaite']) {
   await navigate(path);
   const state=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll("h1").length,main:!!document.querySelector("#main-content"),lang:document.documentElement.lang})');
   assert.ok(state.scroll<=state.width+1,`${path} overflows at ${width}: ${state.scroll}`);assert.equal(state.h1,1);assert.ok(state.main);assert.equal(state.lang,'fr');
   results.push({path,width,noOverflow:true,oneHeading:true});
  }
 }
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await navigate('/');await evaluate('localStorage.removeItem("kayart-cart-v1");window.dispatchEvent(new Event("kayart:cart-updated"))');
 await evaluate('document.querySelector(".menu-toggle").click()');await waitFor('document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="true"');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".main-nav")).display'),'flex');
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await waitFor('document.querySelector(".menu-toggle").getAttribute("aria-expanded")==="false"');assert.ok(await evaluate('document.activeElement === document.querySelector(".menu-toggle")'));
 results.push({check:'mobile menu opens and Escape closes with focus restored',passed:true});
 await navigate('/boutique?q=aucun-resultat-fixture-62948');assert.ok(await evaluate('document.body.innerText.includes("Aucun produit ne correspond")'));results.push({check:'filtered empty catalogue remains actionable',passed:true});
 await navigate('/boutique/pagaie-carbone-signature-imparfaite');
 await evaluate('[...document.querySelectorAll("button")].find(button=>button.textContent.includes("Ajouter au panier")).click()');
 await waitFor('document.querySelector(".cart-count").textContent === "1"');results.push({check:'add to cart updates header immediately',passed:true});
 await navigate('/panier');await waitFor('!!document.querySelector(".cart-lines")');
 await waitFor('document.querySelector(".cart-lines").innerText.includes("Imparfait")');
 for(const width of [320,390,768,860,1440]) {
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
  const state=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,radio:document.querySelector("input[type=radio]").getBoundingClientRect().width})');
  assert.ok(state.scroll<=state.width+1,`Filled cart overflows at ${width}`);assert.equal(state.radio,17);
  results.push({check:'filled cart and delivery control fit viewport',width,passed:true});
 }
 await evaluate('[...document.querySelectorAll(".cart-lines button")].find(button=>button.textContent.includes("Retirer")).click()');
 await waitFor('!!document.querySelector(".cart-empty") && document.querySelector(".cart-count").textContent === "0"');results.push({check:'remove restores empty state and updates header',passed:true});
 const reportDir=process.env.KAYART_HTTP_REPORT_DIR||'outputs/latest-verification';
 fs.mkdirSync(reportDir,{recursive:true});fs.writeFileSync(reportDir+'/browser-checks.json',JSON.stringify(results,null,2));
 console.log('Browser UI checks passed:',results.length);
} finally {ws.close();await fetch(endpoint+'/json/close/'+target.id);}
