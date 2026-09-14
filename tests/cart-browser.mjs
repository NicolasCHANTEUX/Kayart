import assert from 'node:assert/strict';
import fs from 'node:fs';

// Local isolated build only. Quote/checkout doubles below never contact Stripe or a database.
const origin = 'http://localhost:3107', endpoint = 'http://127.0.0.1:9224';
const report = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/latest-verification';
fs.mkdirSync(report, { recursive: true });
const target = await (await fetch(endpoint + '/json/new?' + encodeURIComponent(origin), { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0, mode = 'disabled', failQuote = false;
const pending = new Map(), results = [], checkoutBodies = [], browserErrors = [];
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, [resolve, reject]); ws.send(JSON.stringify({ id, method, params })); });
async function intercept({ requestId, request }) {
  try {
    let responseCode = 200, payload;
    if (request.url.endsWith('/api/cart/quote')) {
      if (failQuote) { responseCode = 503; payload = { error: 'Indisponibilité temporaire de test.' }; }
      else {
        const input = JSON.parse(request.postData);
        payload = await (await fetch(request.url, { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: request.postData })).json();
        if (mode === 'test') {
          payload.testCheckoutEnabled = true;
          payload.shippable = payload.canCheckout;
          payload.countries = ['FR'];
          payload.shippingZones = payload.canCheckout && /^75\d{3}$/.test(input.postalCode) ? [{ id: 'fixture-zone', name: 'Livraison de test', priceCents: 900 }] : [];
        }
      }
    } else if (request.url.endsWith('/api/checkout/cancel')) payload = { status: 'absent' };
    else { checkoutBodies.push(JSON.parse(request.postData)); responseCode = 503; payload = { error: 'Interruption de test : réessayez la même tentative.' }; }
    await call('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
  } catch (error) { browserErrors.push(String(error)); await call('Fetch.failRequest', { requestId, errorReason: 'Failed' }); }
}
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (pending.has(message.id)) { const [resolve, reject] = pending.get(message.id); pending.delete(message.id); message.error ? reject(new Error(message.error.message)) : resolve(message.result); }
  if (message.method === 'Fetch.requestPaused') void intercept(message.params);
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
});
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + expression);
  return result.result.value;
};
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error('Timed out: ' + expression);
}
async function navigate(path) {
  await call('Page.navigate', { url: origin + path });
  await waitFor(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete' && !!document.querySelector('h1')`);
}
async function seed(items) {
  await evaluate(`localStorage.setItem('kayart-cart-v1',JSON.stringify(${JSON.stringify(items)}));window.dispatchEvent(new Event('kayart:cart-updated'))`);
}
async function input(selector, value) {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
}
async function layout(name) {
  for (const width of [320, 390, 768, 1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `${name} overflows at ${width}`);
    results.push({ name, width, noOverflow: true });
    if (width === 390 || width === 1440) {
      const { data } = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      fs.writeFileSync(`${report}/${name}-${width}.png`, Buffer.from(data, 'base64'));
    }
  }
}
try {
  await call('Page.enable'); await call('Runtime.enable');
  await call('Fetch.enable', { patterns: [{ urlPattern: origin + '/api/cart/quote' }, { urlPattern: origin + '/api/checkout*' }] });
  await navigate('/panier');
  await evaluate("localStorage.removeItem('kayart-checkout-attempt-v1');sessionStorage.clear()");
  await seed([{ productId: 'imperfect-paddle', quantity: 1 }]);
  await waitFor("document.querySelector('.cart-product__stock') && document.body.innerText.includes('Les commandes en ligne')");
  assert.equal(await evaluate("!!document.querySelector('input[name=email]')"), false);
  assert.equal(await evaluate("!!document.querySelector('.cart-product__info a[href^=\"/boutique/\"]')"), true);
  await layout('cart-disabled');
  await navigate('/commande');
  await waitFor("document.body.innerText.includes('Les commandes en ligne')");
  assert.equal(await evaluate("!!document.querySelector('input[name=email]')"), false);
  results.push({ name: 'disabled checkout never requests personal details', passed: true });

  await navigate('/panier');
  await seed([{ productId: 'imperfect-paddle', quantity: 2 }, { productId: 'regression-private-draft', quantity: 1 }]);
  await waitFor("document.querySelectorAll('.cart-product--issue').length === 2");
  assert.equal(await evaluate("document.body.innerText.includes('PRIVATE_DRAFT_7391')"), false);
  await layout('cart-issues');
  await evaluate("document.querySelector('.cart-adjust').click()");
  await waitFor("document.querySelectorAll('.cart-product--issue').length === 1");
  await evaluate("document.querySelector('.cart-product--issue .cart-remove').click()");
  await waitFor("document.querySelectorAll('.cart-product--issue').length === 0 && document.querySelector('.cart-product__stock')");
  results.push({ name: 'line-specific issues, safe private product and stock correction', passed: true });

  failQuote = true;
  await evaluate("window.dispatchEvent(new Event('focus'))");
  await waitFor("document.body.innerText.includes('Indisponibilité temporaire')");
  assert.equal(await evaluate("!!document.querySelector('.cart-product__info a')"), true);
  assert.equal(await evaluate("document.querySelector('.cart-continue').disabled"), true);
  failQuote = false; mode = 'test';
  await evaluate("window.dispatchEvent(new Event('focus'))");
  await waitFor("document.querySelector('.cart-continue').getAttribute('href') === '/commande'");
  await evaluate("document.querySelector('.cart-continue').click()");
  await waitFor("location.pathname === '/commande' && !!document.querySelector('input[name=email]')");
  await input('input[name=name]', 'Client test'); await input('input[name=email]', 'client@example.invalid');
  await evaluate("document.querySelectorAll('input[name=method]')[1].click()");
  await waitFor("!!document.querySelector('input[autocomplete=postal-code]')");
  await input('input[autocomplete=postal-code]', '75001');
  await waitFor("!!document.querySelector('input[name=shippingZone]')");
  assert.equal(await evaluate("document.querySelector('input[name=email]').value"), 'client@example.invalid');
  await evaluate("document.querySelector('input[name=shippingZone]').click()");
  await input('input[name=line1]', '1 rue de test'); await input('input[name=city]', 'Paris');
  await evaluate("document.querySelector('input[name=testAcknowledged]').click()");
  await waitFor("!document.querySelector('.cart-continue').disabled");
  await layout('checkout-test');
  await evaluate("document.querySelector('.cart-continue').click()");
  await waitFor("document.body.innerText.includes('Interruption de test') && !!document.querySelector('.cart-attempt')");
  assert.equal(checkoutBodies.length, 1);
  assert.equal(checkoutBodies[0].postalCode, '75001'); assert.equal(checkoutBodies[0].line1, '1 rue de test');
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Reprendre la même')).click()");
  await waitFor("!document.querySelector('.cart-layout>button').disabled");
  assert.equal(checkoutBodies.length, 2); assert.deepEqual(checkoutBodies[0], checkoutBodies[1]);
  results.push({ name: 'delivery recalculation retains form and retry uses identical request', passed: true });
  await evaluate("document.querySelector('.cart-attempt button').click()");
  await waitFor("!document.querySelector('.cart-attempt') && !localStorage.getItem('kayart-checkout-attempt-v1')");
  await navigate('/panier');
  await waitFor("!!document.querySelector('.cart-product__stock')");
  await evaluate("document.querySelector('.cart-remove').click()");
  await waitFor("!!document.querySelector('.cart-empty') && document.querySelector('.cart-count').textContent === '0'");
  assert.deepEqual(browserErrors, []);
  results.push({ name: 'cancel releases local attempt and removing last item updates header', passed: true });
  fs.writeFileSync(report + '/cart-browser.json', JSON.stringify(results, null, 2));
  console.log('Cart browser checks passed:', results.length);
} finally { ws.close(); await fetch(endpoint + '/json/close/' + target.id); }
