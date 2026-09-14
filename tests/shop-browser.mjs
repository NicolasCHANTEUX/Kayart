import assert from 'node:assert/strict';
import fs from 'node:fs';

// Run against the isolated mock application and the dedicated headless browser.
const endpoint = 'http://127.0.0.1:9224', origin = 'http://localhost:3107';
const reportDir = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/ui-shop-latest';
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
  for (let i = 0; i < 120; i++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('UI wait expired: ' + expression);
}
async function navigate(path) {
  // The same URL can still be present on the old document while navigation starts.
  await evaluate('window.__kayartShopPreviousDocument = true');
  await call('Page.navigate', { url: origin + path });
  await waitFor('!window.__kayartShopPreviousDocument && location.pathname + location.search === ' + JSON.stringify(path) + ' && document.readyState === "complete" && !!document.querySelector(".shop-filters")');
  await evaluate('document.fonts.ready');
}
async function toggle() {
  await waitFor('document.readyState === "complete"');
  const point = await evaluate('(() => { const button = document.querySelector(".shop-filters__toggle"); button.scrollIntoView({block:"center",behavior:"instant"}); const rect = button.getBoundingClientRect(); return {x:rect.x + rect.width/2,y:rect.y + rect.height/2}; })()');
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  await waitFor('document.querySelector(".shop-filters__toggle").getAttribute("aria-expanded") === "true"');
}
async function screenshot(name) {
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(`${reportDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
}
try {
  await call('Page.enable');
  await call('Runtime.enable');
  for (const width of [320, 390, 540, 768, 800, 801, 1024, 1280, 1440]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await navigate('/boutique');
    assert.ok(await evaluate('document.documentElement.scrollWidth') <= width, `Overflow at ${width}`);
    const mobile = width <= 800;
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".shop-filters__options")).display'), mobile ? 'none' : 'grid');
    assert.ok(await evaluate('[...document.querySelectorAll(".product-card__visual")].every(el => getComputedStyle(el,"::after").height === "4px")'));
    assert.ok(await evaluate('document.querySelector(".shop-filters input[name=q]").getBoundingClientRect().height >= 44'));
    if (mobile) {
      await toggle();
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".shop-filters__options")).display'), 'grid');
      assert.ok(await evaluate('document.documentElement.scrollWidth') <= width, `Expanded filters overflow at ${width}`);
      await evaluate('document.querySelector(".shop-filters__toggle").click()');
      await waitFor('getComputedStyle(document.querySelector(".shop-filters__options")).display === "none"');
    }
    results.push({ width, noOverflow: true, disclosure: mobile ? 'opens and closes' : 'always visible', stripes: true });
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/boutique');
  await toggle();
  await evaluate(`document.querySelector('[name=condition]').value = 'imperfect'; document.querySelector('[name=sort]').value = 'price-desc'; document.querySelector('[name=stock]').checked = true; document.querySelector('.shop-filters__options button').click()`);
  await waitFor('new URL(location.href).searchParams.get("condition") === "imperfect" && !!document.querySelector(".shop-filters__count")');
  assert.equal(await evaluate('document.querySelector(".shop-filters__count").firstChild.textContent'), '3');
  assert.equal(await evaluate('document.querySelectorAll(".product-card").length'), 1);
  assert.ok(await evaluate('!!document.querySelector(".shop-paths a[aria-current=page][href*=imperfect]")'));
  await screenshot('filters-active-mobile');
  await toggle();
  assert.equal(await evaluate('document.querySelector("[name=condition]").value'), 'imperfect');
  assert.equal(await evaluate('document.querySelector("[name=sort]").value'), 'price-desc');
  assert.ok(await evaluate('document.querySelector("[name=stock]").checked'));
  await screenshot('filters-expanded-mobile');
  // Search submission must preserve options even when the disclosure is closed.
  await evaluate('document.querySelector(".shop-filters__toggle").click(); document.querySelector("[name=q]").value = "signature"; document.querySelector(".shop-filters__search-field button").click()');
  await waitFor('new URL(location.href).searchParams.get("q") === "signature" && !!document.querySelector(".shop-active-filters")');
  const query = new URL(await evaluate('location.href')).searchParams;
  assert.equal(query.get('condition'), 'imperfect');
  assert.equal(query.get('sort'), 'price-desc');
  assert.equal(query.get('stock'), '1');
  await evaluate(`[...document.querySelectorAll('.shop-active-filters a')].find(a => a.getAttribute('aria-label') === 'Retirer le critère : Imparfait').click()`);
  await waitFor('!new URL(location.href).searchParams.has("condition") && document.querySelector("[name=condition]").value === ""');
  assert.equal(await evaluate('new URL(location.href).searchParams.get("q")'), 'signature');
  assert.equal(await evaluate('document.querySelector("[name=sort]").value'), 'price-desc');
  await evaluate('document.querySelector(".shop-active-filters__reset").click()');
  await waitFor('location.search === "" && document.querySelector("[name=q]").value === "" && !document.querySelector(".shop-active-filters")');
  results.push({ check: 'submit, active count, closed-panel search, remove one criterion and reset', passed: true });
  // Keyboard operation and breakpoint changes retain the same form values.
  await waitFor('document.readyState === "complete"');
  await call('Page.bringToFront');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await evaluate('document.querySelector(".shop-filters__toggle").focus()');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor('document.querySelector(".shop-filters__toggle").getAttribute("aria-expanded") === "true"');
  await evaluate('document.querySelector("[name=category]").value = "pagaies"');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".shop-filters__options")).display'), 'grid');
  assert.equal(await evaluate('document.querySelector("[name=category]").value'), 'pagaies');
  results.push({ check: 'keyboard focus, Enter disclosure and responsive form persistence', passed: true });
  // Native GET filters also remain usable without JavaScript.
  await call('Emulation.setScriptExecutionDisabled', { value: true });
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/boutique?condition=imperfect');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".shop-filters__options")).display'), 'grid');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".shop-filters__toggle")).display'), 'none');
  assert.equal(await evaluate('document.querySelector("[name=condition]").value'), 'imperfect');
  results.push({ check: 'filters accessible without JavaScript', passed: true });
  await call('Emulation.setScriptExecutionDisabled', { value: false });
  fs.writeFileSync(`${reportDir}/shop-checks.json`, JSON.stringify(results, null, 2));
  console.log('Shop browser checks passed:', results.length);
} catch (error) {
  console.error(await evaluate('({url:location.href,ready:document.readyState,width:innerWidth,expanded:document.querySelector(".shop-filters__toggle")?.outerHTML,options:document.querySelector(".shop-filters__options")?.getAttribute("data-expanded")})'));
  await screenshot('shop-check-failure');
  throw error;
} finally {
  ws.close();
  await fetch(endpoint + '/json/close/' + target.id);
}
