import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('public product cards request responsive optimized images', () => {
  const config = fs.readFileSync('next.config.ts', 'utf8');
  const image = fs.readFileSync('src/components/catalog/product-image.tsx', 'utf8');
  const card = fs.readFileSync('src/components/catalog/product-card.tsx', 'utf8');
  const shop = fs.readFileSync('src/app/boutique/page.tsx', 'utf8');

  assert.match(config, /hostname: "\*\.supabase\.co"/);
  assert.match(config, /pathname: "\/storage\/v1\/object\/public\/product-images\/\*\*"/);
  assert.match(image, /import Image from "next\/image"/);
  assert.match(image, /sizes && isOptimizablePublicProductImage\(src\)/);
  assert.match(image, /quality=\{80\}/);
  assert.match(card, /sizes=\{productCardImageSizes\}/);
  assert.match(shop, /eager=\{index === 0\}/);
});

test('the product gallery keeps large delivery for visible and opened media only', () => {
  const gallery = fs.readFileSync('src/components/catalog/product-gallery.tsx', 'utf8');
  const css = fs.readFileSync('src/styles/legacy/product-detail.css', 'utf8');

  assert.match(gallery, /sizes="\(max-width: 900px\) calc\(100vw - 32px\), 640px"/);
  assert.match(gallery, /sizes="\(max-width: 900px\) 18vw, 120px"/);
  assert.match(gallery, /isOpen \? <ProductImageView eager[^>]+sizes="100vw"/);
  assert.match(css, /\.product-gallery__thumb \{\s*position: relative;/);
});
