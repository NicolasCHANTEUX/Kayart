import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { load } from './helpers/load-module.mjs';

test('a selected image is physically rotated before storage', async () => {
  const { normalizeProductImage } = load('src/server/catalog/product-image-storage.ts');
  const pixels = await sharp({ create: { width: 12, height: 6, channels: 3, background: 'red' } }).png().toBuffer();
  const file = new File([pixels], 'image.png', { type: 'image/png' });
  const normal = await sharp(await normalizeProductImage(file)).metadata();
  const turned = await sharp(await normalizeProductImage(file, 4 * 1024 * 1024, 90)).metadata();
  assert.equal(`${normal.width}x${normal.height}`, '12x6');
  assert.equal(`${turned.width}x${turned.height}`, '6x12');

  const form = new FormData();
  form.append('images', file);
  form.append('imageRotation', '270');
  assert.equal(load('src/server/catalog/catalog.input.ts').parseProductImageFormData(form)[0].rotation, 270);
  form.set('imageRotation', '45');
  assert.throws(() => load('src/server/catalog/catalog.input.ts').parseProductImageFormData(form));
});

test('a stored product image is downloaded and reuploaded with rotated pixels', async () => {
  const source = await sharp({ create: { width: 14, height: 7, channels: 3, background: 'blue' } }).webp().toBuffer();
  const objectPath = 'products/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.webp';
  const calls = [];
  const storage = load('src/server/catalog/product-image-storage.ts', {
    fetch: async (url, options) => {
      calls.push({ url, options });
      return options?.method === 'POST' ? new Response('{}', { status: 200 }) : new Response(source, { status: 200 });
    }
  }, { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'secret', KAYART_IMAGE_STORAGE: 'supabase' });
  const result = await storage.rotateStoredProductImage({
    bucket: 'product-images',
    path: `https://project.supabase.co/storage/v1/object/public/product-images/${objectPath}`
  }, 'Produit');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `https://project.supabase.co/storage/v1/object/product-images/${objectPath}`);
  assert.equal(calls[0].options.headers.apikey, 'secret');
  assert.equal(calls[1].options.method, 'POST');
  const uploaded = await sharp(Buffer.from(calls[1].options.body)).metadata();
  assert.equal(`${uploaded.width}x${uploaded.height}`, '7x14');
  assert.equal(result.mimeType, 'image/webp');
  assert.notEqual(result.path, `https://project.supabase.co/storage/v1/object/public/product-images/${objectPath}`);
});

test('rotating an existing image replaces its asset and preserves a shared original', async () => {
  const current = {
    id: 'image', productId: 'product', mediaAssetId: 'old',
    mediaAsset: { id: 'old', bucket: 'product-images', path: 'old.webp', originalFilename: 'photo.png', altText: 'Photo' },
    product: { name: 'Produit', slug: 'produit' }
  };
  const calls = [];
  const tx = {
    mediaAsset: {
      create: async ({ data }) => { calls.push(['create', data]); return { id: 'new' }; },
      deleteMany: async ({ where }) => { calls.push(['delete', where]); return { count: 0 }; }
    },
    productImage: { updateMany: async ({ where, data }) => { calls.push(['update', where, data]); return { count: 1 }; } }
  };
  const service = load('src/server/catalog/product-image-rotation.ts', {
    '@/server/auth/session': { requireAdminSession: async () => ({ role: 'admin' }) },
    '@/server/db/prisma': { getPrismaClient: () => ({ productImage: { findFirst: async () => current }, $transaction: async fn => fn(tx) }) },
    './product-image-storage': {
      rotateStoredProductImage: async (image, name) => { assert.equal(image.path, 'old.webp'); assert.equal(name, 'Produit'); return { bucket: 'product-images', path: 'rotated.webp', mimeType: 'image/webp', sizeBytes: 123 }; },
      removeStoredProductImage: async () => { throw new Error('Shared original must not be removed'); }
    }
  });
  const result = await service.rotateExistingProductImage({ productId: 'product', imageId: 'image' });
  assert.equal(result.url, 'rotated.webp');
  assert.equal(result.slug, 'produit');
  assert.equal(calls[1][1].productId, 'product');
  assert.equal(calls[1][1].mediaAssetId, 'old');
  assert.equal(calls[1][2].mediaAssetId, 'new');
  assert.deepEqual(Object.keys(calls[2][1]).sort(), ['blogPosts', 'id', 'productImages', 'requestMedia']);
});

test('failed existing-image update removes the newly uploaded object', async () => {
  const removed = [];
  const service = load('src/server/catalog/product-image-rotation.ts', {
    '@/server/auth/session': { requireAdminSession: async () => ({ role: 'admin' }) },
    '@/server/db/prisma': { getPrismaClient: () => ({
      productImage: { findFirst: async () => ({ id: 'image', productId: 'product', mediaAssetId: 'old', mediaAsset: { path: 'old' }, product: { name: 'Produit' } }) },
      $transaction: async fn => fn({ mediaAsset: { create: async () => ({ id: 'new' }) }, productImage: { updateMany: async () => ({ count: 0 }) } })
    }) },
    './product-image-storage': {
      rotateStoredProductImage: async () => ({ path: 'new.webp' }),
      removeStoredProductImage: async image => { removed.push(image.path); return true; }
    }
  });
  await assert.rejects(service.rotateExistingProductImage({ productId: 'product', imageId: 'image' }));
  assert.equal(removed.join(','), 'new.webp');
});

test('rotation endpoint requires admin and accepts only scoped image identifiers', async () => {
  let role = 'customer', rotations = 0;
  const route = load('src/app/api/admin/product-images/rotate/route.ts', {
    'next/server': { NextResponse: Response },
    'next/cache': { revalidatePath: () => {} },
    '@/server/auth/session': { getCurrentAuthSession: async () => ({ role, user: { id: 'user' } }) },
    '@/server/security/request-guards': { requireSameOriginRequest: () => {}, enforceRateLimit: () => {}, RateLimitError: class extends Error {} },
    '@/server/catalog/product-image-rotation': { rotateExistingProductImage: async () => { rotations++; return { url: 'rotated.webp', slug: 'produit' }; } }
  });
  const productId = '11111111-1111-1111-1111-111111111111';
  const imageId = '22222222-2222-2222-2222-222222222222';
  const request = body => new Request('https://example.test/api/admin/product-images/rotate', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await route.POST(request({ productId, imageId }))).status, 401);
  role = 'admin';
  assert.equal((await route.POST(request({ productId, imageId: '../other' }))).status, 400);
  assert.equal(rotations, 0);
  const response = await route.POST(request({ productId, imageId }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).url, 'rotated.webp');
  assert.equal(rotations, 1);
});
