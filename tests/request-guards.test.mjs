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
  guard.enforceRateLimit({ key, limit: 8, windowMs: 900000 });
  await assert.rejects(guard.getActionClientKey('login', 'a'.repeat(255)), guard.RateLimitError);
  assert.throws(() => guard.enforceRateLimit({ key: 'x'.repeat(513), limit: 1, windowMs: 900000 }), guard.RateLimitError);
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

test('all public auth actions check the shared limit before contacting the auth provider', async () => {
  const cases = [
    ['src/app/connexion/actions.ts', 'loginAction', 'signInWithPassword'],
    ['src/app/inscription/actions.ts', 'signupAction', 'signUpWithPassword'],
    ['src/app/mot-de-passe-oublie/actions.ts', 'passwordRecoveryAction', 'requestPasswordRecovery']
  ];
  for (const [file, action, provider] of cases) {
    let contacted = false;
    const guardsMock = {
      requireSameOriginAction: async () => {},
      getActionClientKey: async (scope) => `${scope}:192.0.2.1`,
      RateLimitError: class extends Error {}
    };
    const module = load(file, {
      'next/navigation': { redirect: (target) => { throw new Error(`REDIRECT:${target}`); } },
      '@/server/security/request-guards': guardsMock,
      '@/server/requests/request-rate-limit': { enforcePersistentAuthLimit: async () => { throw new guardsMock.RateLimitError(); } },
      '@/server/auth/supabase-auth': { [provider]: async () => { contacted = true; } },
      '@/server/auth/session': {},
      '@/lib/safe-redirect': { sanitizeRedirectPath: () => '' }
    });
    const form = new FormData();
    form.set('email', 'user@example.com');
    form.set('password', 'password123');
    form.set('passwordConfirmation', 'password123');
    await assert.rejects(module[action](form), /REDIRECT:/);
    assert.equal(contacted, false, action);
  }
});
