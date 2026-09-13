import fs from 'node:fs';
const base='http://127.0.0.1:9224';
const target=await (await fetch(base+'/json/new?'+encodeURIComponent('http://localhost:3107/'),{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let counter=0;const pending=new Map();ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const [resolve,reject]=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(m.error.message)):resolve(m.result);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++counter;pending.set(id,[resolve,reject]);ws.send(JSON.stringify({id,method,params}));});
await call('Page.enable');await call('Runtime.enable');
const width=Number(process.argv[2]||1440),path=process.argv[3]||'/',name=process.argv[4]||'home-desktop';
await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
await call('Page.navigate',{url:'http://localhost:3107'+path});
await new Promise(resolve=>setTimeout(resolve,6000));
if (process.argv.includes('--filled-cart')) {
 await call('Runtime.evaluate',{expression:'localStorage.setItem("kayart-cart-v1",JSON.stringify([{productId:"imperfect-paddle",quantity:1}]))'});
 await call('Page.reload');
 await new Promise(resolve=>setTimeout(resolve,1500));
}
await call('Runtime.evaluate',{expression:'Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,5000))])',awaitPromise:true});
const info=await call('Runtime.evaluate',{expression:'JSON.stringify({title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,headings:[...document.querySelectorAll("h1,h2")].map(e=>e.innerText),brokenImages:[...document.images].filter(e=>e.complete&&!e.naturalWidth).length})',returnByValue:true});
const metrics=await call('Page.getLayoutMetrics');
const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:0,y:0,width,height:Math.min(metrics.cssContentSize.height,14000),scale:1}});
const reportDir=process.env.KAYART_HTTP_REPORT_DIR||'outputs/latest-verification';
fs.mkdirSync(reportDir,{recursive:true});fs.writeFileSync(`${reportDir}/${name}.png`,Buffer.from(shot.data,'base64'));
console.log(info.result.value);
if (process.argv.includes('--filled-cart')) await call('Runtime.evaluate',{expression:'localStorage.removeItem("kayart-cart-v1")'});
ws.close();await fetch(base+'/json/close/'+target.id);
