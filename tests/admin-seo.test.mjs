import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

const authorized = { requireAdminSession: async () => ({ role: 'admin' }) };

test('product search and overview reject unauthorized users before any database access', async () => {
  let reads = 0;
  const mocks = {
    '@/server/auth/session': { requireAdminSession: async () => { throw new Error('denied'); } },
    '@/server/db/prisma': { getPrismaClient: () => { reads++; throw new Error('unexpected database access'); } }
  };
  await assert.rejects(load('src/server/catalog/search.ts', mocks).searchAdminProducts({}), /denied/);
  await assert.rejects(load('src/server/catalog/overview.ts', mocks).getAdminOverview(), /denied/);
  assert.equal(reads, 0);
});

test('admin product search paginates in the database and combines stock/type filters without overwriting either', async () => {
  let query, countWhere;
  const tx = { product: {
    count: async ({ where }) => { countWhere = where; return 23; },
    findMany: async input => { query = input; return []; }
  } };
  const service = load('src/server/catalog/search.ts', {
    '@/server/auth/session': authorized,
    '@/server/db/prisma': { getPrismaClient: () => ({ $transaction: async fn => fn(tx) }) }
  });
  const result = await service.searchAdminProducts({ search: 'CARB', category: 'cat', condition: 'used', stock: 'low', page: '3' });
  assert.equal(query.skip, 20); assert.equal(query.take, 10); assert.equal(result.total, 23);
  assert.deepEqual(query.where, countWhere);
  assert.equal(query.where.AND[0].OR[0].name.contains, 'CARB');
  assert.equal(query.where.AND[1].categoryId, 'cat');
  assert.equal(query.where.AND[2].condition, 'used');
  const stock = query.where.AND[3];
  assert.equal(stock.condition.not, 'service'); assert.equal(stock.availability.not, 'madeToOrder');
  assert.equal(stock.stockQuantity.gt, 0); assert.equal(stock.stockQuantity.lte, 5);
  await service.searchAdminProducts({ condition: 'service', stock: 'made-to-order', page: '9999' });
  assert.equal(query.skip, 20); assert.equal(query.where.AND[2].condition, 'service');
  assert.equal(query.where.AND[3].condition.not, 'service');
  assert.equal(query.where.AND[3].OR[1].stockQuantity, null);
});

test('stock classification keeps services and made-to-order products out of physical stock filters', async () => {
  const base = { id: 'a', name: 'A', sku: 'A', categoryId: 'cat', condition: 'new', availability: 'available', stockQuantity: 2 };
  const rows = [base, { ...base, id: 'b', condition: 'service' }, { ...base, id: 'c', availability: 'made-to-order' }, { ...base, id: 'd', stockQuantity: null }, { ...base, id: 'e', stockQuantity: 0 }, { ...base, id: 'f', stockQuantity: 6 }];
  const service = load('src/server/catalog/search.ts', {
    '@/server/auth/session': authorized,
    './catalog.repository': { getCatalogRepository: () => ({ listProducts: async () => rows }) }
  }, { KAYART_DATA_SOURCE: 'mock' });
  for (const [stock, ids] of [['low', 'a'], ['service', 'b'], ['made-to-order', 'c,d'], ['out', 'e'], ['available', 'f']]) {
    assert.equal((await service.searchAdminProducts({ stock })).products.map(p => p.id).join(','), ids);
  }
});

test('overview counts all orders and outstanding requests without loading private records', async () => {
  const pendingCount = count => ({ count: async ({ where }) => { assert.equal(where.status.in.join(','), 'new,inProgress'); assert.equal(where.deletedAt,null); return count; } });
  const tx = {
    product: { count: async () => 112 },
    order: { count: async query => { if (!query) return 87; assert.equal(query.where.isTest, true); return 80; } },
    contactRequest: pendingCount(4), repairRequest: pendingCount(2), customRequest: pendingCount(1)
  };
  const service = load('src/server/catalog/overview.ts', {
    '@/server/auth/session': authorized,
    '@/server/db/prisma': { getPrismaClient: () => ({ $transaction: async (fn, options) => { assert.equal(options.isolationLevel, 'RepeatableRead'); return fn(tx); } }) }
  });
  const result = await service.getAdminOverview();
  assert.equal(result.products, 112); assert.equal(result.orders, 87); assert.equal(result.testOrders, 80); assert.equal(result.openRequests, 7); assert.equal(result.openRepairRequests, 2);
});

const publicEnv = { KAYART_INDEXING_ENABLED: 'true', NEXT_PUBLIC_SITE_URL: 'https://catalogue.fixture.fr', VERCEL_ENV: 'production' };
test('indexing requires explicit activation, a real source, and a valid production origin', () => {
  assert.equal(load('src/config/seo.ts', {}, publicEnv).getIndexableOrigin(), 'https://catalogue.fixture.fr');
  for (const env of [
    { KAYART_INDEXING_ENABLED: 'false' }, { KAYART_DATA_SOURCE: 'mock' }, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' },
    ...['', 'http://catalogue.fixture.fr', 'https://localhost', 'https://127.0.0.1', 'https://example.invalid', 'https://user:password@catalogue.fixture.fr', 'https://catalogue.fixture.fr/path', 'https://catalogue.fixture.fr?key=fixture'].map(NEXT_PUBLIC_SITE_URL => ({ NEXT_PUBLIC_SITE_URL }))
  ]) assert.equal(load('src/config/seo.ts', {}, { ...publicEnv, ...env }).getIndexableOrigin(), null);
});

test('disabled sitemap never queries the database; enabled sitemap selects only visible product identifiers and approved legal pages', async () => {
  let reads = 0, query;
  const mocks = {
    '@/config/legal': { getLegalConfig: () => ({ approved: false }) },
    '@/server/db/prisma': { getPrismaClient: () => ({ product: { findMany: async input => { reads++; query = input; return [{ slug: 'carbone?fixture=1', updatedAt: new Date('2026-09-09') }]; } } }) }
  };
  assert.equal((await load('src/app/sitemap.ts', mocks).default()).length, 0); assert.equal(reads, 0);
  const sitemap = await load('src/app/sitemap.ts', mocks, publicEnv).default();
  assert.equal(query.where.publishedAt.not, null); assert.equal(query.where.availability.notIn.join(','), 'draft,archived,unavailable');
  assert.equal(Object.keys(query.select).sort().join(','), 'slug,updatedAt');
  assert.equal(sitemap.some(item => item.url.endsWith('/cgv')), false);
  assert.equal(sitemap.at(-1).url, 'https://catalogue.fixture.fr/boutique/carbone%3Ffixture%3D1');
  const approved = await load('src/app/sitemap.ts', { ...mocks, '@/config/legal': { getLegalConfig: () => ({ approved: true }) } }, publicEnv).default();
  assert.equal(approved.some(item => item.url.endsWith('/cgv')), true);
  assert.equal(approved.some(item => item.url.includes('/admin')), false);
});

test('robots blocks every route while indexing is disabled and advertises only the approved production origin', () => {
  assert.equal(load('src/app/robots.ts').default().rules.disallow, '/');
  const robots = load('src/app/robots.ts', {}, publicEnv).default();
  assert.equal(robots.sitemap, 'https://catalogue.fixture.fr/sitemap.xml');
  for (const path of ['/admin', '/api/', '/commande', '/panier']) assert.ok(robots.rules.disallow.includes(path));
});
