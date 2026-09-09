import test from 'node:test';
import assert from 'node:assert/strict';
import { runReconciliation } from '../scripts/run-checkout-reconciliation.mjs';
import { load } from './helpers/load-module.mjs';

const env = { KAYART_TEST_SITE_URL: 'https://test.example.invalid', KAYART_TEST_CRON_SECRET: 'x'.repeat(32) };
test('cron runner validates its destination and never follows redirects with credentials', async () => {
  for (const site of ['http://test.invalid','https://test.invalid/path','https://user:pass@test.invalid','https://test.invalid?key=secret']) {
    await assert.rejects(runReconciliation({ ...env, KAYART_TEST_SITE_URL: site }, () => { throw new Error('Network must not run'); }));
  }
  const result = await runReconciliation(env, async (url, options) => {
    assert.equal(url.toString(), 'https://test.example.invalid/api/cron/checkouts');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + env.KAYART_TEST_CRON_SECRET);
    return Response.json({ reconciled: 2, failed: 0, needsReview: 0 });
  });
  assert.equal(result.healthy, true);
});
test('cron monitoring fails for authentication pages, invalid counters and operational errors', async () => {
  await assert.rejects(runReconciliation(env, async () => new Response('<html>Login</html>')));
  await assert.rejects(runReconciliation(env, async () => Response.json({ reconciled: 1 })));
  for (const counters of [{ reconciled: 0, failed: 1, needsReview: 0 }, { reconciled: 0, failed: 0, needsReview: 1 }]) assert.equal((await runReconciliation(env, async () => Response.json(counters))).healthy, false);
});
test('missing, expired and customer sessions cannot access admin services or private photos', async () => {
  for (const scenario of ['missing', 'expired', 'customer']) {
    let sensitiveReads = 0, roleReads = 0;
    const mocks = {
      'next/headers': { cookies: async () => ({ get: () => scenario === 'missing' ? undefined : { value: 'fixture-token' } }) },
      'next/navigation': { redirect: () => { throw new Error('ADMIN_REQUIRED'); } },
      './supabase-auth': { getSupabaseAuthUser: async () => scenario === 'expired' ? null : { id: 'fixture-customer', email: 'fixture@example.invalid' } },
      '@/server/db/prisma': { getPrismaClient: () => ({ customer: { findUnique: async () => { roleReads++; return { role: 'customer' }; } }, mediaAsset: { findFirst: async () => { sensitiveReads++; } } }) },
      '@/server/catalog/catalog.repository': { getCatalogRepository: () => { sensitiveReads++; throw new Error('Unexpected private read'); } }
    };
    const auth = load('src/server/auth/session.ts', mocks);
    await assert.rejects(auth.requireAdminSession(), /ADMIN_REQUIRED/);
    const service = load('src/server/catalog/catalog.service.ts', { ...mocks, '@/server/auth/session': auth });
    await assert.rejects(service.listAdminOrders(), /ADMIN_REQUIRED/);
    const photos = load('src/app/api/admin/request-images/[id]/route.ts', { ...mocks, '@/server/auth/session': auth });
    const response = await photos.GET(new Request('https://test.invalid'), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) });
    assert.equal(response.status, 401); assert.equal(sensitiveReads, 0);
    assert.equal(roleReads > 0, scenario === 'customer');
  }
});
