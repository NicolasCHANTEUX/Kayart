import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from './helpers/load-module.mjs';

const link = ({ children, ...props }) => React.createElement('a', props, children);
const redirect = path => { throw new Error(`REDIRECT:${path}`); };
const session = role => ({ role, user: { id: 'fixture-user', email: 'fixture@example.invalid' } });

test('connected customer requesting admin sees an explanation and logout instead of a silent home redirect', async () => {
  const { default: Page } = load('src/app/connexion/page.tsx', {
    'next/link': link, 'next/navigation': { redirect },
    '@/app/connexion/actions': { loginAction: async () => {}, logoutAction: async () => {} },
    '@/server/auth/session': { getCurrentAuthSession: async () => session('customer') }
  });
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ redirect: '/admin/produits' }) }));
  assert.ok(html.includes('Accès administrateur requis'));
  assert.ok(html.includes('fixture@example.invalid'));
  assert.ok(html.includes('Se déconnecter'));
  assert.equal(html.includes('name="password"'), false);
});

test('login preserves denied admin destination for explanation and keeps normal admin/customer redirects', async () => {
  for (const [role, target, expected] of [
    ['customer', '/admin/commandes', '/connexion?redirect=%2Fadmin%2Fcommandes'],
    ['customer', '/boutique', '/boutique'],
    ['admin', '/admin/commandes', '/admin/commandes'],
    ['admin', '', '/admin'],
    ['customer', '//evil.invalid', '/']
  ]) {
    let persisted = false;
    const { loginAction } = load('src/app/connexion/actions.ts', {
      'next/navigation': { redirect },
      '@/server/auth/session': { resolveAuthenticatedSession: async () => session(role), persistPasswordSession: async () => { persisted = true; } },
      '@/server/auth/supabase-auth': { signInWithPassword: async () => ({ user: session(role).user }) },
      '@/server/security/request-guards': { requireSameOriginAction: async () => {}, enforceRateLimit: () => {}, getActionClientKey: async () => 'fixture' }
    });
    const form = new FormData();form.set('email', 'fixture@example.invalid');form.set('password', 'fixture-only');form.set('redirect', target);
    await assert.rejects(loginAction(form), error => error.message === `REDIRECT:${expected}`);
    assert.equal(persisted, true);
  }
});

for (const role of [null, 'customer', 'admin']) {
  test(`dashboard entry is available only to admin sessions: ${role ?? 'anonymous'}`, async () => {
    const { SiteHeader } = load('src/components/layout/site-header.tsx', {
      'next/link': link, 'next/navigation': { usePathname: () => '/' },
      '@/app/connexion/actions': { logoutAction: async () => {} },
      '@/server/auth/session': { getCurrentAuthSession: async () => role ? session(role) : null }
    });
    const html = renderToStaticMarkup(await SiteHeader());
    assert.equal(html.includes('href="/admin"'), role === 'admin');
    assert.equal(html.includes('>Dashboard</a>'), role === 'admin');
    for (const path of ['/admin/produits', '/admin/commandes', '/admin/demandes', '/admin/livraison']) assert.equal(html.includes(`href="${path}"`), false);
    assert.equal(html.includes('admin-quick-access'), false);
  });
}
