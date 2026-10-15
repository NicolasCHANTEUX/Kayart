import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { load } from './helpers/load-module.mjs';

const owner = { id: randomUUID(), email: 'owner@example.invalid' };
const stranger = { id: randomUUID(), email: 'owner@example.invalid' };
const orderId = randomUUID();

function account(sessionUser = owner) {
  let reads = 0;
  const queries = [];
  const db = {
    customer: {
      findUnique: async query => { queries.push(['customer.findUnique', query]); return { firstName: 'Ada', lastName: 'Lovelace', phone: null }; },
      upsert: async query => { queries.push(['customer.upsert', query]); return { id: randomUUID() }; }
    },
    order: {
      findMany: async query => { reads++; queries.push(['order.findMany', query]); return []; },
      findFirst: async query => { reads++; queries.push(['order.findFirst', query]); return null; },
      count: async query => { queries.push(['order.count', query]); return 0; }
    }
  };
  const service = load('src/server/account/account-service.ts', {
    '@/server/auth/session': { requireAccountSession: async () => {
      if (!sessionUser) throw new Error('AUTH_REQUIRED');
      return { user: sessionUser, role: 'customer' };
    } },
    '@/server/db/prisma': { getPrismaClient: () => db }
  });
  return { service, queries, reads: () => reads };
}

test('account reads are scoped to the verified Auth ID, never to a matching email', async () => {
  const first = account(owner);
  await first.service.listAccountOrders(1);
  await first.service.getAccountOrder(orderId);
  await first.service.getAccountProfile();
  const orderQueries = first.queries.filter(([name]) => name.startsWith('order.'));
  assert.equal(orderQueries.length, 3);
  for (const [, query] of orderQueries) assert.equal(query.where.customer.is.authUserId, owner.id);
  assert.equal(first.queries.find(([name]) => name === 'customer.findUnique')[1].where.authUserId, owner.id);
  const second = account(stranger);
  await second.service.getAccountOrder(orderId);
  assert.equal(second.queries[0][1].where.customer.is.authUserId, stranger.id);
  assert.notEqual(second.queries[0][1].where.customer.is.authUserId, owner.id);
});

test('invalid order IDs and missing sessions do not query orders', async () => {
  const invalid = account();
  assert.equal(await invalid.service.getAccountOrder('not-a-uuid'), null);
  assert.equal(invalid.reads(), 0);
  const anonymous = account(null);
  await assert.rejects(anonymous.service.listAccountOrders(1), /AUTH_REQUIRED/);
  assert.equal(anonymous.reads(), 0);
});

test('profile writes only editable fields under the verified Auth ID', async () => {
  const { service, queries } = account();
  await service.updateAccountProfile({ firstName: 'Ada', lastName: 'Lovelace', phone: '+33 1 23 45 67 89' });
  const query = queries.find(([name]) => name === 'customer.upsert')[1];
  assert.equal(query.where.authUserId, owner.id);
  assert.equal(query.create.email, owner.email);
  assert.deepEqual(Object.keys(query.update).sort(), ['firstName', 'lastName', 'phone']);
  assert.equal(query.update.role, undefined);
  assert.equal(query.update.authUserId, undefined);
});

test('checkout account email comparison rejects alternate addresses', () => {
  const { service } = account();
  assert.equal(service.checkoutEmailMatchesAccount('OWNER@example.invalid', owner), true);
  assert.equal(service.checkoutEmailMatchesAccount('other@example.invalid', owner), false);
  assert.equal(service.checkoutEmailMatchesAccount('guest@example.invalid', null), true);
});

test('profile action validates fields before saving and keeps email server-owned', async () => {
  let saved;
  const { saveAccountProfile } = load('src/app/compte/profil/actions.ts', {
    'next/navigation': { redirect: path => { throw new Error(`REDIRECT:${path}`); } },
    '@/server/security/request-guards': { requireSameOriginAction: async () => {} },
    '@/server/account/account-service': { updateAccountProfile: async input => { saved = input; } }
  });
  const form = new FormData();
  form.set('firstName', ' Ada ');
  form.set('lastName', 'Lovelace');
  form.set('phone', '+33 1 23 45 67 89');
  form.set('email', 'attacker@example.invalid');
  await assert.rejects(saveAccountProfile(form), /REDIRECT:\/compte\/profil\?saved=1/);
  assert.equal(saved.firstName, 'Ada');
  assert.equal(saved.email, undefined);
  form.set('firstName', 'x'.repeat(81));
  saved = undefined;
  await assert.rejects(saveAccountProfile(form), /REDIRECT:\/compte\/profil\?error=1/);
  assert.equal(saved, undefined);
});

test('checkout route binds only a live session with its verified email', async () => {
  let sessionUser = owner;
  const calls = [];
  const route = load('src/app/api/checkout/route.ts', {
    '@/server/checkout/checkout-input': { parseCheckoutInput: value => value },
    '@/server/checkout/checkout-service': { startTestCheckout: async (...args) => { calls.push(args); return { url: 'https://checkout.stripe.com/test' }; } },
    '@/server/checkout/stripe': { isTestCheckoutEnabled: () => true },
    '@/server/security/bounded-body': { readBoundedBody: async request => Buffer.from(await request.text()) },
    '@/server/security/request-guards': { getRequestClientKey: () => 'checkout:192.0.2.1', requireSameOriginRequest: () => {} },
    '@/server/requests/request-rate-limit': { enforcePersistentRequestLimit: async () => {} },
    '@/server/auth/session': { getCurrentAuthSession: async () => sessionUser ? { user: sessionUser, role: 'customer' } : null },
    '@/server/account/account-service': { checkoutEmailMatchesAccount: (email, user) => !user || email === user.email },
    '@/server/auth/session-cookies': { accessTokenCookieName: 'kayart_access_token', refreshTokenCookieName: 'kayart_refresh_token' }
  });
  const request = (email, cookie = '') => new Request('https://shop.example.invalid/api/checkout', { method: 'POST', headers: { cookie }, body: JSON.stringify({ email }) });
  assert.equal((await route.POST(request('other@example.invalid'))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await route.POST(request(owner.email))).status, 200);
  assert.equal(calls[0][1].id, owner.id);
  sessionUser = null;
  assert.equal((await route.POST(request(owner.email, 'kayart_access_token=expired'))).status, 401);
  assert.equal(calls.length, 1);
  assert.equal((await route.POST(request('guest@example.invalid'))).status, 200);
  assert.equal(calls[1][1], null);
});
