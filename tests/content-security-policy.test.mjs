import assert from 'node:assert/strict';
import test from 'node:test';
import { load } from './helpers/load-module.mjs';

for (const environment of ['development', 'production', 'test', '']) {
  test(`CSP permits the development runtime only in development: ${environment || 'unset'}`, async () => {
    const { default: config } = load('next.config.ts', {}, { NODE_ENV: environment });
    const routes = await config.headers();
    const policy = routes[0].headers.find(header => header.key === 'Content-Security-Policy').value;
    const directives = new Map(policy.split('; ').map(directive => {
      const [name, ...sources] = directive.split(' ');
      return [name, sources];
    }));
    assert.equal(directives.get('script-src').includes("'unsafe-eval'"), environment === 'development');
    assert.deepEqual(Array.from(directives.get('object-src')), ["'none'"]);
    assert.deepEqual(Array.from(directives.get('frame-ancestors')), ["'none'"]);
    assert.deepEqual(Array.from(directives.get('form-action')), ["'self'"]);
    assert.equal(directives.get('connect-src').includes('*'), false);
  });
}
