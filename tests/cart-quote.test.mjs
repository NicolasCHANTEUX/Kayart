import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

const product = (id, changes = {}) => ({ id, name: `Pièce ${id}`, slug: id, sku: `SKU-${id}`, condition: 'new', availability: 'available', priceCents: 2500, stockQuantity: 3, isCustomizable: false, deliveryMode: 'shippable', images: [], ...changes });
function quoteFor(products, zones = []) {
  return load('src/server/checkout/quote.ts', {
    '@/server/catalog/catalog.service': { listPublishedProducts: async () => products },
    '@/server/db/prisma': { getPrismaClient: () => ({ shippingZone: { findMany: async () => zones } }) },
    '@/server/checkout/stripe': { isTestCheckoutEnabled: () => false }
  }).quoteCart;
}

test('a removed product stays anonymous and does not discard other cart lines', async () => {
  const quote = await quoteFor([product('valid')])([{ productId: 'private-or-deleted', quantity: 1 }, { productId: 'valid', quantity: 2 }]);
  const missing = quote.lines.find(line => line.productId === 'private-or-deleted');
  assert.equal(missing.issue, 'unavailable');
  for (const field of ['slug', 'sku', 'imageUrl', 'unitPriceCents', 'condition']) assert.equal(missing[field], null);
  assert.equal(quote.lines.find(line => line.productId === 'valid').totalCents, 5000);
  assert.equal(quote.subtotalCents, 5000);
  assert.equal(quote.canCheckout, false);
  assert.equal(quote.shippable, false);
});

test('insufficient stock identifies the affected line and adjustment restores eligibility', async () => {
  const quoteCart = quoteFor([product('limited', { stockQuantity: 1 }), product('valid')]);
  const items = [{ productId: 'limited', quantity: 2 }, { productId: 'valid', quantity: 1 }];
  const quote = await quoteCart(items);
  assert.equal(quote.lines[0].issue, 'stock');
  assert.equal(quote.lines[0].maxQuantity, 1);
  assert.equal(quote.lines[1].issue, null);
  assert.equal(quote.canCheckout, false);
  const corrected = await quoteCart([{ ...items[0], quantity: 1 }, items[1]]);
  assert.equal(corrected.canCheckout, true);
  assert.equal(corrected.subtotalCents, 5000);
  assert.equal(corrected.testCheckoutEnabled, false);
});

test('custom items, services, zero prices and ruptures remain visible but cannot be ordered', async () => {
  const variants = [{ isCustomizable: true }, { condition: 'service' }, { priceCents: null }, { priceCents: 0 }, { stockQuantity: 0 }, { availability: 'reserved' }];
  for (const change of variants) {
    const quote = await quoteFor([product('piece', change)])([{ productId: 'piece', quantity: 1 }]);
    assert.equal(quote.lines[0].name, 'Pièce piece');
    assert.ok(quote.lines[0].issue);
    assert.equal(quote.canCheckout, false);
  }
});

test('quote ignores client prices and uses the imperfect product own cover image', async () => {
  const quote = await quoteFor([product('piece', { condition: 'imperfect', images: [{ url: '/own-cover.webp', isPrimary: true }], baseProduct: { primaryImageUrl: '/base.webp' } })])([{ productId: 'piece', quantity: 2, priceCents: 1, name: 'Injected' }]);
  assert.equal(quote.lines[0].unitPriceCents, 2500);
  assert.equal(quote.lines[0].imageUrl, '/own-cover.webp');
  assert.equal(quote.lines[0].condition, 'imperfect');
  assert.equal(quote.lines[0].name, 'Pièce piece');
  assert.equal(quote.subtotalCents, 5000);
});

test('shipping appears only for eligible carts and configured destinations', async () => {
  const zones = [{ id: 'fr', name: 'France', priceCents: 900, countryCodes: ['FR'], postalPrefixes: [], excludedPostalPrefixes: ['20'], enabled: true }];
  const quoteCart = quoteFor([product('piece')], zones);
  const items = [{ productId: 'piece', quantity: 1 }];
  assert.equal((await quoteCart(items, 'FR', '75001')).shippingZones[0].priceCents, 900);
  assert.equal((await quoteCart(items, 'FR', '20000')).shippingZones.length, 0);
  assert.equal((await quoteCart([...items, { productId: 'removed', quantity: 1 }], 'FR', '75001')).shippingZones.length, 0);
  assert.equal((await quoteCart([])).canCheckout, false);
});
