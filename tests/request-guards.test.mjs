import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from './helpers/load-module.mjs';

function guards() {
  return load('src/server/security/request-guards.ts', {
    'next/headers': { headers: async () => new Headers({ 'x-forwarded-for': '192.0.2.1' }) }
  });
}

test('auth keys accept normal email and reject oversized identifiers before insertion', async () => {
  const guard = guards();
  const key = await guard.getActionClientKey('login', ' User@Example.com ');
  assert.equal(key, 'login:192.0.2.1:user@example.com');
  guard.enforceAuthRateLimit('auth:192.0.2.1', { key, limit: 8, windowMs: 900000 });
  await assert.rejects(guard.getActionClientKey('login', 'a'.repeat(255)), guard.RateLimitError);
  assert.throws(() => guard.enforceRateLimit({ key: 'x'.repeat(513), limit: 1, windowMs: 900000 }), guard.RateLimitError);
});

test('rotating emails from one client reaches its quota without blocking another client', async () => {
  const guard = guards();
  for (let i = 0; i < 60; i++) {
    guard.enforceAuthRateLimit('auth:192.0.2.1', { key: `login:192.0.2.1:user${i}@example.com`, limit: 8, windowMs: 900000 });
  }
  assert.throws(() => guard.enforceAuthRateLimit('auth:192.0.2.1', { key: 'login:192.0.2.1:next@example.com', limit: 8, windowMs: 900000 }), guard.RateLimitError);
  guard.enforceAuthRateLimit('auth:192.0.2.2', { key: 'login:192.0.2.2:other@example.com', limit: 8, windowMs: 900000 });
});

test('store saturation fails closed without evicting active counters', () => {
  const guard = guards();
  for (let i = 0; i < 5000; i++) {
    guard.enforceRateLimit({ key: `key-${i}`, limit: 2, windowMs: 60000 });
  }
  assert.throws(() => guard.enforceRateLimit({ key: 'fresh', limit: 2, windowMs: 60000 }), guard.RateLimitError);
  guard.enforceRateLimit({ key: 'key-0', limit: 2, windowMs: 60000 });
  assert.throws(() => guard.enforceRateLimit({ key: 'key-0', limit: 2, windowMs: 60000 }), guard.RateLimitError);
});

test('expired entries make room for new keys', async () => {
  const guard = guards();
  guard.enforceRateLimit({ key: 'old', limit: 1, windowMs: 1 });
  await new Promise((resolve) => setTimeout(resolve, 5));
  guard.enforceRateLimit({ key: 'new', limit: 1, windowMs: 60000 });
  guard.enforceRateLimit({ key: 'old', limit: 1, windowMs: 60000 });
});
