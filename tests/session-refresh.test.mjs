import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './helpers/load-module.mjs';
const { NextRequest } = createRequire(import.meta.url)('next/server');
const jwt = exp => `e30.${Buffer.from(JSON.stringify({ exp, role: 'admin' })).toString('base64url')}.fixture`;
const request = cookie => new NextRequest('https://kayart.fixture.fr/admin', { headers: cookie ? { cookie } : {} });
const refreshEnv = { NODE_ENV: 'production', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture' };

test('expiry is only a refresh hint: missing, malformed and near-expired tokens trigger refresh', () => {
  const { needsSessionRefresh } = load('src/server/auth/refresh-middleware.ts');
  for (const token of [undefined, '', 'invalid', jwt(0), jwt(1059)]) assert.equal(needsSessionRefresh(token, 1000000), true);
  assert.equal(needsSessionRefresh(jwt(1061), 1000000), false);
});

test('anonymous and unexpired requests do not call the refresh server', async () => {
  const middleware = load('src/server/auth/refresh-middleware.ts', { './supabase-auth': { refreshPasswordSession: async () => { throw new Error('unexpected refresh'); } } });
  const anonymous = await middleware.refreshRequestSession(request());
  assert.equal(anonymous.cookies.getAll().length, 0); assert.equal(anonymous.headers.get('Cache-Control'), null);
  const current = await middleware.refreshRequestSession(request(`kayart_access_token=${jwt(Date.now() / 1000 + 3600)}; kayart_refresh_token=fixture`));
  assert.equal(current.cookies.getAll().length, 0); assert.equal(current.headers.get('Cache-Control'), 'private, no-store');
});

test('refresh rotates both cookies and forwards the new credentials to the same server request', async () => {
  let calls = 0;
  const middleware = load('src/server/auth/refresh-middleware.ts', { './supabase-auth': { refreshPasswordSession: async token => {
    assert.equal(token, 'old-refresh'); calls++; return { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 3600 };
  } } }, refreshEnv);
  const req = request('kayart_refresh_token=old-refresh; unrelated=retained');
  const result = await middleware.refreshRequestSession(req);
  assert.equal(calls, 1); assert.equal(req.cookies.get('kayart_access_token').value, 'new-access');
  const forwarded = result.headers.get('x-middleware-request-cookie');
  assert.ok(forwarded.includes('kayart_refresh_token=new-refresh')); assert.ok(forwarded.includes('unrelated=retained'));
  for (const cookie of result.cookies.getAll()) { assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true); assert.equal(cookie.sameSite, 'lax'); assert.equal(cookie.path, '/'); }
  assert.equal(result.cookies.get('kayart_access_token').maxAge, 3570);
  assert.equal(result.headers.get('Cache-Control'), 'private, no-store');
});

test('definitively rejected refresh credentials are removed from request and response; outages keep them retryable', async () => {
  for (const outage of [false, true]) {
    const middleware = load('src/server/auth/refresh-middleware.ts', { './supabase-auth': { refreshPasswordSession: async () => { if (outage) throw new Error('fixture outage'); return null; } } });
    const req = request('kayart_access_token=expired; kayart_refresh_token=refresh');
    const result = await middleware.refreshRequestSession(req);
    if (outage) { assert.equal(req.cookies.get('kayart_refresh_token').value, 'refresh'); assert.equal(result.cookies.getAll().length, 0); }
    else { assert.equal(req.cookies.has('kayart_refresh_token'), false); assert.equal(result.cookies.getAll().length, 2); for (const cookie of result.cookies.getAll()) assert.equal(cookie.maxAge, 0); }
  }
});

test('Supabase refresh uses a bounded POST without redirects and distinguishes invalid credentials from service errors', async () => {
  let response = new Response(JSON.stringify({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600, user: { id: 'user', email: 'user@example.invalid' } }));
  const auth = load('src/server/auth/supabase-auth.ts', { fetch: async (url, options) => {
    assert.equal(url, 'https://project.supabase.co/auth/v1/token?grant_type=refresh_token');
    assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    assert.equal(JSON.parse(options.body).refresh_token, 'fixture-refresh'); return response;
  } }, refreshEnv);
  assert.equal((await auth.refreshPasswordSession('fixture-refresh')).accessToken, 'new-access');
  response = new Response(JSON.stringify({ error_code: 'refresh_token_not_found' }), { status: 400 });
  assert.equal(await auth.refreshPasswordSession('fixture-refresh'), null);
  for (const [status, body] of [[429, {}], [503, {}], [400, { error_code: 'unexpected_failure' }], [200, { expires_in: -1 }]]) {
    response = new Response(JSON.stringify(body), { status }); await assert.rejects(auth.refreshPasswordSession('fixture-refresh'), /unavailable/);
  }
});

test('legal publication gate still returns a real 404 before any session refresh', async () => {
  const middleware = load('src/middleware.ts', { '@/config/legal': { getLegalConfig: () => ({ approved: false }) }, '@/server/auth/refresh-middleware': { refreshRequestSession: async () => { throw new Error('unexpected refresh'); } } });
  for (const path of ['/mentions-legales', '/cgv', '/confidentialite']) {
    const result = await middleware.middleware(new NextRequest('https://kayart.fixture.fr' + path));
    assert.equal(result.status, 404); assert.equal(result.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});
