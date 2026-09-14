import assert from 'node:assert/strict';
import fs from 'node:fs';

// Requires prepare-route-loading-fixture.mjs and the isolated mock app on port 3107.
const endpoint = 'http://127.0.0.1:9224', origin = 'http://localhost:3107';
const reportDir = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/ui-route-background-latest';
const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(), results = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!pending.has(message.id)) return;
  const [resolve, reject] = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(message.error.message)) : resolve(message.result);
});
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, [resolve, reject]);
  ws.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 180; i++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('UI wait expired: ' + expression);
}
const noLoader = '![...document.querySelectorAll(".route-loading-screen")].some(el => el.getClientRects().length)';
async function navigate(path) {
  await evaluate('window.__previousBackgroundDocument = true');
  await call('Page.navigate', { url: origin + path });
  await waitFor('!window.__previousBackgroundDocument && location.pathname === ' + JSON.stringify(path) + ' && document.readyState === "complete" && !!document.querySelector(".shell[data-page-background]") && ' + noLoader);
}
async function click(selector) {
  const point = await evaluate(`(() => {const link=document.querySelector(${JSON.stringify(selector)});link.scrollIntoView({block:'center',behavior:'instant'});const rect=link.getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()`);
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
}
try {
  await call('Page.enable'); await call('Runtime.enable');
  fs.mkdirSync(reportDir, { recursive: true });
  for (const width of [390, 1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    for (const [source, destination, selector, before, after] of [
      ['/', '/boutique', '.hero-actions a[href="/boutique"]', 'ambient', 'ambient'],
      ['/boutique', '/contact', '.footer-cta__link', 'ambient', 'plain'],
      ['/contact', '/', '.site-header a[href="/"]', 'plain', 'ambient'],
      ['/reparation', '/contact', '.footer-cta__link', 'plain', 'plain']
    ]) {
      await navigate(source);
      assert.equal(await evaluate('document.querySelector(".shell").dataset.pageBackground'), before);
      await evaluate(`window.__backgroundFrames=[];window.__sampleBackground=true;(function sample(){if(!window.__sampleBackground)return;const shell=document.querySelector('.shell');const loader=[...document.querySelectorAll('.route-loading-screen')].find(el=>el.getClientRects().length);window.__backgroundFrames.push({loading:!!loader,background:getComputedStyle(shell,'::before').backgroundImage,loaderColor:loader?getComputedStyle(loader).backgroundColor:null});requestAnimationFrame(sample);})()`);
      await click(selector);
      await waitFor('window.__backgroundFrames.some(frame => frame.loading)');
      // Capture the actual intermediate screen, not a synthetic CSS preview.
      const screenshot = await call('Page.captureScreenshot', { format: 'png' });
      const name = `${width}-${source === '/' ? 'home' : source.slice(1)}-to-${destination === '/' ? 'home' : destination.slice(1)}`;
      fs.writeFileSync(`${reportDir}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
      await waitFor('location.pathname === ' + JSON.stringify(destination) + ' && ' + noLoader + ' && document.querySelector(".shell").dataset.pageBackground === ' + JSON.stringify(after));
      const frames = await evaluate('window.__sampleBackground=false;window.__backgroundFrames');
      const loading = frames.filter(frame => frame.loading);
      assert.ok(loading.length > 3, 'Expected the delayed fixture to show its loading screen');
      assert.ok(loading.every(frame => frame.loaderColor === 'rgba(0, 0, 0, 0)'), 'Opaque loading screen');
      assert.ok(loading.every(frame => frame.background.includes('Emile_photo_principale.png') === (before === 'ambient')), 'Background changed during loading');
      if (before === after) assert.ok(frames.every(frame => frame.background.includes('Emile_photo_principale.png') === (before === 'ambient')), 'Background flashed between matching pages');
      assert.ok(await evaluate('document.documentElement.scrollWidth') <= width, 'Horizontal overflow');
      results.push({ width, source, destination, before, after, loadingFrames: loading.length, passed: true });
    }
  }
  fs.writeFileSync(`${reportDir}/route-background-checks.json`, JSON.stringify(results, null, 2));
  console.log('Route background checks passed:', results.length);
} finally {
  ws.close(); await fetch(endpoint + '/json/close/' + target.id);
}
