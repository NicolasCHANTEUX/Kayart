import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

test('product contact links preserve the product context and build a useful subject', () => {
  const { productContactHref, productContactSubject } = load('src/lib/contact.ts');
  const href = productContactHref({ name: "Pagaie d'essai & carbone", sku: 'PAG-ÉTÉ-1' });
  const url = new URL(href, 'https://kayart.example');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('produit'), "Pagaie d'essai & carbone");
  assert.equal(url.searchParams.get('reference'), 'PAG-ÉTÉ-1');
  assert.equal(
    productContactSubject("Pagaie d'essai & carbone", 'PAG-ÉTÉ-1'),
    "Question concernant : Pagaie d'essai & carbone (PAG-ÉTÉ-1)"
  );
});

test('an invalid imperfect product returns field errors without redirecting away from the form', async () => {
  let redirects = 0;
  const actions = load('src/app/admin/produits/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    'next/navigation': { redirect: () => { redirects += 1; throw new Error('unexpected redirect'); } },
    '@/server/auth/session': {
      requireAdminSession: async () => ({ user: { id: 'admin-user' } })
    },
    '@/server/security/request-guards': { requireSameOriginAction: async () => {} },
    '@/server/catalog/product-image-storage': { storeProductImages: async () => [] },
    '@/server/catalog/catalog.service': {
      createProduct: async () => { throw new Error('createProduct must not be called'); },
      findAdminProductById: async () => null
    }
  });
  const formData = new FormData();
  formData.set('availability', 'available');
  formData.set('basePrice', '150');
  formData.set('discountPercent', '15');
  formData.set('defectDescription', 'court');

  const state = await actions.createImperfectProductAction(
    { status: 'idle', message: '' },
    formData
  );

  assert.equal(redirects, 0);
  assert.equal(state.status, 'error');
  assert.match(state.errors.baseProductId, /obligatoire/i);
  assert.match(state.errors.defectDescription, /10 caractères/i);
});

test('a normal product validation error also returns to the current form', async () => {
  let redirects = 0;
  const actions = load('src/app/admin/produits/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    'next/navigation': { redirect: () => { redirects += 1; throw new Error('unexpected redirect'); } },
    '@/server/auth/session': {
      requireAdminSession: async () => ({ user: { id: 'admin-user' } })
    },
    '@/server/security/request-guards': { requireSameOriginAction: async () => {} },
    '@/server/catalog/product-image-storage': { storeProductImages: async () => [] },
    '@/server/catalog/catalog.service': {
      createProduct: async () => { throw new Error('createProduct must not be called'); }
    }
  });
  const formData = new FormData();
  formData.set('name', 'Pagaie renseignée');
  formData.set('sku', 'PAG-TEST');

  const state = await actions.createProductAction(
    { status: 'idle', message: '' },
    formData
  );

  assert.equal(redirects, 0);
  assert.equal(state.status, 'error');
  assert.match(state.errors.categoryId, /catégorie/i);
});

test('an imperfect product with valid text keeps the form open when a photo is missing', async () => {
  let creates = 0;
  const baseProduct = {
    id: 'base-1',
    name: 'Pagaie Horizon',
    slug: 'pagaie-horizon',
    sku: 'PAG-HOR',
    categoryId: 'category-1',
    condition: 'new',
    deliveryMode: 'quote',
    attributes: []
  };
  const actions = load('src/app/admin/produits/actions.ts', {
    'next/cache': { revalidatePath: () => {} },
    'next/navigation': { redirect: () => { throw new Error('unexpected redirect'); } },
    '@/server/auth/session': {
      requireAdminSession: async () => ({ user: { id: 'admin-user' } })
    },
    '@/server/security/request-guards': { requireSameOriginAction: async () => {} },
    '@/server/catalog/product-image-storage': { storeProductImages: async () => [] },
    '@/server/catalog/catalog.service': {
      createProduct: async () => { creates += 1; },
      findAdminProductById: async () => baseProduct
    }
  });
  const formData = new FormData();
  formData.set('baseProductId', baseProduct.id);
  formData.set('availability', 'available');
  formData.set('basePrice', '150');
  formData.set('discountPercent', '15');
  formData.set('defectDescription', 'Une petite bulle visible dans la résine.');

  const state = await actions.createImperfectProductAction(
    { status: 'idle', message: '' },
    formData
  );

  assert.equal(creates, 0);
  assert.equal(state.status, 'error');
  assert.match(state.errors.images, /photo/i);
});
