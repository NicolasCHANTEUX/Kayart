import { pathToFileURL } from 'node:url';

export async function runReconciliation(env = process.env, request = fetch) {
  const site = new URL(env.KAYART_TEST_SITE_URL || 'https://invalid.invalid');
  if (!env.KAYART_TEST_SITE_URL || site.protocol !== 'https:' || site.username || site.password || site.search || site.hash || site.pathname !== '/') throw new Error('Configure the HTTPS test site origin only.');
  const secret = env.KAYART_TEST_CRON_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configure KAYART_TEST_CRON_SECRET (at least 32 characters).');
  const headers = { Authorization: `Bearer ${secret}` };
  // Only a user-configured Vercel automation credential may pass deployment protection.
  if (env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const response = await request(new URL('/api/cron/checkouts', site), { headers, redirect: 'error', signal: AbortSignal.timeout(55000) });
  if (!response.ok) throw new Error(`Cron returned HTTP ${response.status}.`);
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Unexpected cron response; deployment may require authentication.');
  const result = await response.json();
  const counters = Object.fromEntries(['reconciled', 'needsReview', 'failed'].map(key => [key, result[key]]));
  if (!Object.values(counters).every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid cron counters.');
  return { ...counters, healthy: counters.failed === 0 && counters.needsReview === 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runReconciliation();
    console.log(JSON.stringify(result));
    if (!result.healthy) process.exitCode = 1;
  } catch {
    // Never emit response bodies, request headers, URLs with secrets or provider errors.
    console.error('Checkout reconciliation failed. Check the test site, credentials and server logs.');
    process.exitCode = 1;
  }
}
