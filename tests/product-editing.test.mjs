import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

const images = [{ id: 'a', position: 0, isPrimary: true }, { id: 'b', position: 3, isPrimary: false }];
const plan = (patch = {}) => load('src/server/catalog/product-image-plan.ts').planProductImages(images, { deletedImageIds: [], images: [], ...patch });

test('image editing reorders existing images, switches covers and normalizes positions', () => {
  const result = plan({ imageOrder: ['b', 'a'], coverImageId: 'b' });
  assert.equal(result.existing.map(image => image.id).join(','), 'b,a');
  assert.equal(result.existing.map(image => image.position).join(','), '0,1');
  assert.equal(result.existing.filter(image => image.isPrimary).map(image => image.id).join(','), 'b');
  const uploaded = plan({ coverImageId: 'new', images: [{ path: 'one', isPrimary: false }, { path: 'two', isPrimary: true }] });
  assert.ok(uploaded.existing.every(image => !image.isPrimary));
  assert.equal(uploaded.added.filter(image => image.isPrimary)[0].path, 'two');
  assert.equal(uploaded.added.map(image => image.position).join(','), '2,3');
  assert.equal(plan({ deletedImageIds: ['a'] }).existing[0].isPrimary, true);
});

test('image editing rejects foreign identifiers, stale lists, deleted covers and missing uploads', () => {
  for (const patch of [
    { imageOrder: ['a', 'foreign'] }, { imageOrder: ['a', 'a'] }, { imageOrder: ['a'] },
    { deletedImageIds: ['foreign'] }, { deletedImageIds: ['a'], coverImageId: 'a' },
    { coverImageId: 'new' }, { coverImageId: 'foreign' }
  ]) assert.throws(() => plan(patch));
});

const base = {
  id: 'product', name: 'Produit imparfait', sku: 'IMP', slug: 'imparfait', condition: 'imperfect',
  baseProductId: 'model', categoryId: 'category', category: null, availability: 'available',
  description: 'Description propre a cette piece.', defectDescription: 'Defaut visuel documente.',
  priceCents: 1234, compareAtPriceCents: 1999, stockQuantity: 1, publishedAt: new Date(),
  attributes: [], images, checkoutHolds: []
};
function repository(tx) {
  return load('src/server/catalog/catalog.repository.ts', { '@/server/db/prisma': { getPrismaClient: () => ({ $transaction: async (fn, options) => { assert.equal(options.isolationLevel, 'Serializable'); return fn(tx); } }) } }).prismaCatalogRepository;
}

test('form parsing preserves the submitted image order and rejects an empty imperfect defect description', () => {
  const parser = load('src/server/catalog/catalog.input.ts');
  const form = new FormData();
  for (const [key, value] of Object.entries({ id: 'product', name: base.name, slug: base.slug, sku: base.sku, categoryId: base.categoryId, condition: 'imperfect', availability: 'available', basePrice: '19.99', discountPercent: '15', stockQuantity: '1', description: base.description, defectDescription: base.defectDescription, dimensions: '20 cm', weight: '0.5', imageOrderPresent: '1', coverImageId: 'b' })) form.set(key, value);
  form.append('imageOrder', 'b'); form.append('imageOrder', 'a');
  const parsed = parser.parseProductUpdateFormData(form);
  assert.equal(parsed.imageOrder.join(','), 'b,a'); assert.equal(parsed.coverImageId, 'b');
  form.set('defectDescription', ' ');
  assert.throws(() => parser.parseProductUpdateFormData(form), error => Boolean(error.issues.defectDescription));
});

test('invalid imperfect edits fail before any write and retain model, documented defects, photos and a discount', async () => {
  let writes = 0;
  const tx = { product: { findUnique: async () => base, update: async () => { writes++; } }, productImage: { updateMany: async () => { writes++; }, deleteMany: async () => { writes++; } } };
  for (const patch of [
    { condition: 'new' }, { baseProductId: 'other-model' }, { defectDescription: '' },
    { deletedImageIds: ['a', 'b'] }, { compareAtPriceCents: null, preservePrices: false },
    { priceCents: 2000, preservePrices: false }
  ]) await assert.rejects(repository(tx).updateProduct({ ...base, images: [], deletedImageIds: [], preservePrices: true, ...patch }));
  assert.equal(writes, 0);
});

test('switching covers demotes first, scopes mutations to the product and keeps precise prices', async () => {
  let state = images.map(image => ({ ...image })), saved;
  const calls = [];
  const tx = {
    product: {
      findUnique: async () => ({ ...base, images: state }),
      update: async query => {
        saved = query.data;
        return { ...base, ...query.data, attributes: [], images: state.map(image => ({ ...image, mediaAsset: { path: image.id, altText: null } })) };
      }
    },
    productImage: {
      updateMany: async query => {
        assert.equal(query.where.productId, base.id); calls.push(query);
        state = state.map(image => !query.where.id || image.id === query.where.id ? { ...image, ...query.data } : image);
        assert.ok(state.filter(image => image.isPrimary).length <= 1, 'unique primary constraint must hold at every write');
        return { count: 1 };
      }
    }
  };
  const result = await repository(tx).updateProduct({ ...base, images: [], deletedImageIds: [], imageOrder: ['b', 'a'], coverImageId: 'b', preservePrices: true, priceCents: 1200 });
  assert.equal(calls[0].data.isPrimary, false); assert.equal(calls[0].where.id, undefined);
  assert.equal(saved.priceCents, 1234); assert.equal(saved.compareAtPriceCents, 1999);
  assert.equal(result.images[0].id, 'b'); assert.equal(result.images[0].isPrimary, true);
  assert.equal(saved.baseProductId, 'model'); assert.equal(saved.defectDescription, base.defectDescription);
});

test('imperfect public page displays its edited description and own images rather than replacing them with the base model', async () => {
  const ownImage = { id: 'own', url: '/own.webp', isPrimary: true, position: 0 };
  const product = { ...base, publishedAt: null, images: [ownImage], baseProduct: { name: 'Base model', slug: 'base-model', images: [{ id: 'base-image' }], description: 'Model description' } };
  const page = load('src/app/boutique/[slug]/page.tsx', { '@/server/catalog/catalog.service': { findProductBySlug: async () => product } });
  const tree = await page.default({ params: Promise.resolve({ slug: product.slug }) });
  const elements = [];
  function walk(value) {
    if (Array.isArray(value)) return value.forEach(walk);
    if (value?.props) { elements.push(value); walk(value.props.children); }
  }
  walk(tree);
  assert.ok(elements.some(element => element.props.images === product.images && element.props.title === product.name));
  assert.ok(elements.some(element => element.type === 'p' && element.props.children === product.description));
});
