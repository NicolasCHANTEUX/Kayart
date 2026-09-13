import fs from 'node:fs';
const endpoint = 'http://127.0.0.1:9224', origin = 'http://localhost:3107';
const name = process.argv[2] || 'layout';
const directory = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/latest-verification';
const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', event => { const message = JSON.parse(event.data); if (pending.has(message.id)) { pending.get(message.id)(message.result); pending.delete(message.id); } });
const call = (method, params = {}) => new Promise(resolve => { pending.set(++id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
const results = [];
try {
  await call('Page.enable');await call('Runtime.enable');
  for (const width of [390,1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    for (const route of ['/', '/boutique', '/boutique/pagaie-carbone-signature-imparfaite', '/contact', '/reparation', '/sur-mesure', '/connexion', '/panier']) {
      await call('Page.navigate', { url: origin + route });
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('h1')`)) break;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))])');
      await new Promise(resolve => setTimeout(resolve, 300));
      results.push({ route, width, ...await evaluate(`({height:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,h1Size:getComputedStyle(document.querySelector('h1')).fontSize,sectionPadding:getComputedStyle(document.querySelector('main section')).paddingTop,buttons:[...document.querySelectorAll('main .button')].map(e=>Math.round(e.getBoundingClientRect().height))})`) });
    }
  }
  fs.mkdirSync(directory, { recursive: true });fs.writeFileSync(directory + '/' + name + '.json', JSON.stringify(results,null,2));
  console.log('Measured layouts:', results.length);
} finally { ws.close(); await fetch(endpoint + '/json/close/' + target.id); }
