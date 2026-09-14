import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd(), target = path.join(root, 'work/urgent-production-check');
const browserPath = process.env.KAYART_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
if (!fs.existsSync(path.join(target, '.next/BUILD_ID'))) throw new Error('Run test:production first to prepare the isolated build.');
if (!fs.existsSync(browserPath)) throw new Error('Set KAYART_BROWSER_PATH to a Chromium browser executable.');
for (const port of [3107, 9224]) {
  const probe = createServer();
  await new Promise((resolve, reject) => { probe.once('error', () => reject(new Error(`Port ${port} is occupied`))); probe.listen(port, '127.0.0.1', () => probe.close(resolve)); });
}
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|SYSTEMDRIVE|PATHEXT|LANG|LC_ALL)$/i.test(key)));
Object.assign(env, { KAYART_DATA_SOURCE: 'mock', KAYART_CHECKOUT_MODE: 'disabled', NEXT_TELEMETRY_DISABLED: '1', KAYART_HTTP_REPORT_DIR: 'outputs/latest-verification' });
const server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', '3107', '-H', '127.0.0.1'], { cwd: target, env, windowsHide: true, stdio: 'ignore' });
const browser = spawn(browserPath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9224', '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + path.join(root, 'work/cart-browser-profile'), 'about:blank'], { env, windowsHide: true, stdio: 'ignore' });
try {
  for (const url of ['http://localhost:3107', 'http://127.0.0.1:9224/json/version']) {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Local startup only. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Local verification process did not start: ' + url);
  }
  for (const file of process.argv.includes('--cart-only') ? ['tests/cart-browser.mjs'] : ['tests/ui-browser.mjs', 'tests/cart-browser.mjs']) {
    const child = spawn(process.execPath, [file], { cwd: root, env, windowsHide: true, stdio: 'inherit' });
    const [code] = await once(child, 'exit');
    if (code !== 0) throw new Error('Browser check failed: ' + file);
  }
} finally { browser.kill(); server.kill(); }
