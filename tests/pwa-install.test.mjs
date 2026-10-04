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
    const metadata = await sharp(`public/icons/kayart-${size}.png`).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
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
