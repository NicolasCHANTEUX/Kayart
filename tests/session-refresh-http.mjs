import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Run against an isolated production build configured with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3108.
// This local double never contacts Supabase, reads a database, or creates an account.
const access = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role: 'admin' })).toString('base64url')}.fixture-only`;
const results = [];
let refreshCalls = 0;
let logoutCalls = 0;
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const send = (status, payload) => { res.statusCode = status; res.end(JSON.stringify(payload)); };
  if (req.url === '/auth/v1/token?grant_type=refresh_token' && req.method === 'POST') {
    refreshCalls++;
    let body = ''; for await (const chunk of req) body += chunk;
    const token = JSON.parse(body).refresh_token;
    if (token === 'fixture-outage') return send(503, {});
    if (token !== 'fixture-valid') return send(400, { error_code: 'refresh_token_not_found' });
    return send(200, { access_token: access, refresh_token: 'fixture-rotated', expires_in: 3600, user: { id: 'fixture-customer', email: 'fixture@example.invalid' } });
  }
  if (req.url === '/auth/v1/user' && req.headers.authorization === `Bearer ${access}`) return send(200, { id: 'fixture-customer', email: 'fixture@example.invalid' });
  if (req.url === '/auth/v1/logout?scope=local' && req.headers.authorization === `Bearer ${access}`) { logoutCalls++; return send(200, {}); }
  return send(401, {});
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(3108, '127.0.0.1', resolve); });
try {
  const base = 'http://localhost:3107';
  const response = await fetch(base + '/', { headers: { cookie: 'kayart_refresh_token=fixture-valid' } });
  const body = await response.text(), cookies = response.headers.getSetCookie();
  assert.equal(response.status, 200); assert.ok(body.includes('Déconnexion'));
  assert.ok(cookies.some(value => value.includes('kayart_access_token=') && value.includes('HttpOnly') && value.includes('Secure')));
  assert.ok(cookies.some(value => value.includes('kayart_refresh_token=fixture-rotated')));
  assert.equal(body.includes(access), false); assert.equal(body.includes('fixture-rotated'), false);
  assert.equal(response.headers.has('x-middleware-request-cookie'), false);
  assert.ok(response.headers.get('cache-control').includes('no-store'));
  results.push({ check: 'refreshed identity visible in same rendered request; credentials only in HttpOnly cookies', passed: true });

  const protectedResponse = await fetch(base + '/api/admin/request-images/11111111-1111-4111-8111-111111111111', { headers: { cookie: 'kayart_refresh_token=fixture-valid' } });
  assert.equal(protectedResponse.status, 401);
  results.push({ check: 'refreshed customer with admin claim still denied by admin service', passed: true });

  const deniedPage = await fetch(base + '/connexion?redirect=%2Fadmin', { headers: { cookie: `kayart_access_token=${access}` } });
  const deniedHtml = await deniedPage.text();
  assert.equal(deniedPage.status, 200);assert.ok(deniedHtml.includes('Accès administrateur requis'));assert.ok(deniedHtml.includes('Se déconnecter'));
  results.push({ check: 'customer requesting admin receives an explicit explanation without a home redirect', passed: true });

  const invalid = await fetch(base + '/', { headers: { cookie: 'kayart_refresh_token=fixture-invalid' } });
  assert.equal(invalid.headers.getSetCookie().filter(value => value.includes('Max-Age=0')).length, 2);
  results.push({ check: 'revoked refresh credentials cleared', passed: true });

  const outage = await fetch(base + '/', { headers: { cookie: 'kayart_refresh_token=fixture-outage' } });
  assert.equal(outage.status, 200); assert.equal(outage.headers.getSetCookie().length, 0);
  results.push({ check: 'outage leaves credentials for retry without authenticating', passed: true });
  const action = body.match(/name="(\$ACTION_ID_[^"]+)"/);
  assert.ok(action, 'logout server action is rendered for refreshed identity');
  const form = new FormData(); form.set(action[1], '');
  const logout = await fetch(base + '/', { method: 'POST', redirect: 'manual', headers: { origin: base, cookie: 'kayart_refresh_token=fixture-valid' }, body: form });
  assert.equal(logout.status, 303); assert.equal(logoutCalls, 1);
  // Browser applies the last Set-Cookie for a given name/path. Neither credential may be restored by middleware.
  for (const name of ['kayart_access_token', 'kayart_refresh_token']) {
    const last = logout.headers.getSetCookie().filter(cookie => cookie.startsWith(name + '=')).at(-1);
    assert.ok(last?.includes('Max-Age=0'));
  }
  results.push({ check: 'logout after renewal revokes refreshed session and leaves both browser cookies expired', passed: true });
  assert.equal(refreshCalls, 5);
  const reportDir = process.env.KAYART_HTTP_REPORT_DIR || 'outputs/latest-verification';
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportDir + '/session-refresh-http.json', JSON.stringify(results, null, 2));
  console.log('Session refresh production HTTP checks passed:', results.length, '(local Auth double only).');
} finally { await new Promise(resolve => server.close(resolve)); }
