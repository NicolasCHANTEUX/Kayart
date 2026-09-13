import assert from 'node:assert/strict';
import fs from 'node:fs';

const endpoint = 'http://127.0.0.1:9224', origin = 'http://localhost:3107';
const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map(), errors = [], results = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (pending.has(message.id)) {
    const [resolve, reject] = pending.get(message.id);pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
});
const call = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, [resolve, reject]);ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('UI wait expired: ' + expression);
}
async function openMenu() {
  await evaluate('document.querySelector(".row-actions__trigger").scrollIntoView({block:"center"})');
  await new Promise(resolve => setTimeout(resolve, 150));
  await evaluate('document.querySelector(".row-actions__trigger").click()');
  await waitFor('!!document.querySelector(".row-actions__menu")');
}
try {
  await call('Page.enable');await call('Runtime.enable');
  for (const width of [320,390,860,1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 600 });
    await call('Page.navigate', { url: origin + '/ui-regression' });
    await waitFor('!!document.querySelector("[data-ui-ready=true]")');
    await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,3000))]).then(()=>true)');
    await openMenu();
    const menu = await evaluate(`(() => {
      const node=document.querySelector('.row-actions__menu'),rect=node.getBoundingClientRect();
      return {text:node.innerText,visible:rect.width>0&&rect.height>0&&rect.left>=0&&rect.right<=innerWidth&&rect.top>=0&&rect.bottom<=innerHeight,clickable:node.contains(document.elementFromPoint(rect.left+rect.width/2,rect.top+20)),href:node.querySelector('a').getAttribute('href')};
    })()`);
    for (const label of ['Modifier','Stock','Masquer','Archiver']) assert.ok(menu.text.includes(label));
    assert.ok(menu.visible && menu.clickable, `Menu must be visible and clickable at ${width}`);
    assert.equal(menu.href, '/admin/produits/ui-fixture-product/modifier');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor('!document.querySelector(".row-actions__menu")');
    await openMenu();
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 80, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 80, button: 'left', clickCount: 1 });
    await waitFor('!document.querySelector(".row-actions__menu")');
    for (const label of ['Stock','Archiver']) {
      await openMenu();
      await evaluate(`[...document.querySelectorAll('.row-actions__menu button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
      await waitFor('!!document.querySelector(".admin-modal")');
      assert.ok(await evaluate(`document.querySelector('.admin-modal').textContent.includes(${JSON.stringify(label === 'Stock' ? 'Enregistrer' : 'Archivage')})`));
      // Only cancel: no stock, visibility or archive mutation is submitted.
      await evaluate(`[...document.querySelectorAll('.admin-modal button')].find(b=>b.textContent.trim()==='Annuler').click()`);
      await waitFor('!document.querySelector(".admin-modal")');
    }
    results.push({width,hydrated:true,menuVisibleAndClickable:true,editLinkCorrect:true,escapeAndOutsideClick:true,stockAndArchiveDialogs:true,noMutationSubmitted:true});
  }
  assert.deepEqual(errors, []);
  const directory = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/latest-verification';fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(directory + '/admin-menu-browser.json', JSON.stringify(results, null, 2));
  console.log('Interactive admin menu checks passed at', results.map(result=>result.width).join(', '), 'px; no action submitted.');
} finally { ws.close();await fetch(endpoint + '/json/close/' + target.id); }
