import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { load } from './helpers/load-module.mjs';

test('PWA manifest exposes a stable identity and raster install icons', async () => {
  const { default: createManifest } = load('src/app/manifest.ts');
  const manifest = createManifest();

  assert.equal(manifest.id, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);

  for (const size of [192, 512]) {
    const icon = manifest.icons.find(candidate => candidate.sizes === `${size}x${size}`);
    assert.ok(icon, `missing ${size}px icon`);
    assert.equal(icon.type, 'image/png');
    assert.equal(icon.purpose, 'any');
    assert.equal(icon.src, `/icons/kayart-rounded-${size}.png`);

    const iconPath = `public${icon.src}`;
    const metadata = await sharp(iconPath).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    assert.equal(metadata.hasAlpha, true);

    const { data, info } = await sharp(iconPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];
    assert.equal(alphaAt(0, 0), 0, `${size}px icon must have a transparent corner`);
    assert.equal(alphaAt(size - 1, size - 1), 0, `${size}px icon must have a transparent corner`);
    assert.equal(alphaAt(Math.floor(size / 2), Math.floor(size / 2)), 255, `${size}px icon centre must stay opaque`);
  }

  assert.equal(manifest.icons.some(icon => icon.type === 'image/svg+xml'), false);
});

test('the Windows favicon contains rounded transparent PNG sizes', async () => {
  const favicon = fs.readFileSync('src/app/favicon.ico');
  const count = favicon.readUInt16LE(4);

  assert.deepEqual(
    Array.from({ length: count }, (_, index) => favicon[6 + index * 16] || 256),
    [16, 32, 48, 64, 128, 256],
  );

  for (let index = 0; index < count; index += 1) {
    const entryOffset = 6 + index * 16;
    const size = favicon[entryOffset] || 256;
    const byteLength = favicon.readUInt32LE(entryOffset + 8);
    const imageOffset = favicon.readUInt32LE(entryOffset + 12);
    const image = favicon.subarray(imageOffset, imageOffset + byteLength);
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x, y) => data[(y * info.width + x) * info.channels + 3];

    assert.equal(info.width, size);
    assert.equal(info.height, size);
    assert.ok(alphaAt(0, 0) <= 8, `${size}px favicon must have a transparent corner`);
    assert.ok(alphaAt(size - 1, size - 1) <= 8, `${size}px favicon must have a transparent corner`);
  }
});

test('the root install experience only appears when the native prompt is ready', () => {
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf8');
  const prompt = fs.readFileSync('src/components/pwa/pwa-install-prompt.tsx', 'utf8');

  assert.match(layout, /<PwaInstallPrompt \/>/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /window\.__kayartInstallPrompt = event/);
  assert.match(layout, /navigator\.serviceWorker\.register\("\/sw\.js"/);
  assert.match(prompt, /beforeinstallprompt/);
  assert.match(prompt, /kayart:pwa-install-ready/);
  assert.match(prompt, /revealSavedPrompt\(\)/);
  assert.match(prompt, /if \(!canInstall \|\| pathname !== "\/"\)/);
  assert.match(prompt, />\s*Installer l’application\s*</);
  assert.match(prompt, /await prompt\.prompt\(\)/);
  assert.match(prompt, /pathname !== "\/"/);
  assert.doesNotMatch(prompt, /Comment installer l’application/);
});

test('the service worker caches only the public offline shell', () => {
  const worker = fs.readFileSync('public/sw.js', 'utf8');

  assert.match(worker, /"\/offline\.html"/);
  assert.match(worker, /event\.request\.mode !== "navigate"/);
  assert.match(worker, /fetch\(event\.request\)\.catch/);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
  assert.ok(fs.existsSync('public/offline.html'));
});
