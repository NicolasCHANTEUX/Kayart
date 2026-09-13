import { spawn } from 'node:child_process';
import path from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';

const root = process.cwd();
const target = path.join(root, 'work/urgent-production-check');
const next = path.join(root, 'node_modules/next/dist/bin/next');
// Do not pass real application configuration to the fixture server or its build.
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|SYSTEMDRIVE|PATHEXT|LANG|LC_ALL|CI|TERM|COLORTERM)$/i.test(key)));
Object.assign(env, {
  KAYART_DATA_SOURCE: 'mock', KAYART_CHECKOUT_MODE: 'disabled', NEXT_TELEMETRY_DISABLED: '1',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3108', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture-only',
  KAYART_HTTP_REPORT_DIR: process.env.KAYART_HTTP_REPORT_DIR || 'outputs/latest-verification'
});
async function run(args, cwd = root) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`Verification command failed: ${args[0]} (${code})`);
}
// Refuse occupied fixture ports rather than testing an unrelated running server.
for (const port of [3107, 3108]) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', () => reject(new Error(`Fixture port ${port} is already in use`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}
await run(['tests/prepare-production-check.mjs']);
await run([next, 'build'], target);
const server = spawn(process.execPath, [next, 'start', '-p', '3107', '-H', '127.0.0.1'], { cwd: target, env, stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
let exited = false;
let announcedReady = false;
server.stdout.on('data', chunk => { process.stdout.write(chunk); if (chunk.toString().includes('Ready in')) announcedReady = true; });
server.on('exit', () => { exited = true; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (exited) throw new Error('Fixture server exited before verification');
    try { if (announcedReady) ready = (await fetch('http://localhost:3107/', { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Startup only. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve,250));
  }
  if (!ready) throw new Error('Fixture server did not become ready');
  await run(['tests/production-http.mjs']);
  await run(['tests/session-refresh-http.mjs']);
} finally { server.kill(); }
