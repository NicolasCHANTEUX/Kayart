import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('route loading reserves the viewport before the streamed footer', () => {
  const base = fs.readFileSync('src/styles/legacy/base-and-public.css', 'utf8');
  const responsive = fs.readFileSync('src/styles/atelier/responsive.css', 'utf8');

  assert.match(
    base,
    /\.route-loading-screen\s*\{[\s\S]*?min-height:\s*calc\(100svh - 64px\)/,
  );
  assert.match(
    responsive,
    /@media \(max-width:800px\)[\s\S]*?\.route-loading-screen\s*\{[^}]*min-height:calc\(100svh - 60px\)/,
  );
});

test('footer call-to-action arrow does not resize with the web font', () => {
  const footer = fs.readFileSync('src/styles/atelier/home-and-footer.css', 'utf8');

  assert.match(
    footer,
    /\.footer-cta h2 a>span\s*\{[^}]*inline-size:\.8em;[^}]*font-family:Arial,sans-serif;/,
  );
});
