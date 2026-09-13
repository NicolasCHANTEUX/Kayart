import fs from 'node:fs';
import pg from 'pg';

// Read only, one explicitly supplied account. Never print credentials or Auth tokens.
const email = process.argv[process.argv.indexOf('--email') + 1]?.trim().toLowerCase();
if (!process.argv.includes('--email') || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: node scripts/check-admin-access.mjs --email account@example.com');
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, query_timeout: 15000 });
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const accounts = await client.query('SELECT role, auth_user_id FROM public.customers WHERE lower(btrim(email))=$1', [email]);
  const canReadAuth = await client.query("SELECT has_schema_privilege(current_user,'auth','USAGE') AND has_table_privilege(current_user,'auth.users','SELECT') AS allowed");
  let identity = { checked: false };
  if (canReadAuth.rows[0].allowed) {
    const result = await client.query('SELECT u.email_confirmed_at IS NOT NULL AS confirmed, c.role AS effective_role, c.email IS NOT NULL AND lower(btrim(c.email))=$1 AS matching_customer_email FROM auth.users u LEFT JOIN public.customers c ON c.auth_user_id=u.id WHERE lower(btrim(u.email))=$1', [email]);
    identity = { checked: true, matches: result.rows };
  }
  if (!identity.checked && accounts.rows.length === 1 && accounts.rows[0].auth_user_id) {
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const origin = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (key && origin) {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) throw new Error('Unexpected Auth origin');
      url.pathname = `/auth/v1/admin/users/${accounts.rows[0].auth_user_id}`;url.search = '';url.hash = '';
      const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const user = await response.json();
        identity = { checked: true, boundUserExists: true, confirmed: Boolean(user.email_confirmed_at), matchingEmail: user.email?.trim().toLowerCase() === email };
      } else identity = { checked: response.status === 404, boundUserExists: response.status === 404 ? false : undefined, status: response.status };
    }
  }
  console.log(JSON.stringify({ mode: 'read-only', dataSource: process.env.KAYART_DATA_SOURCE ?? 'mock', customerRecords: accounts.rows.map(row => ({ role: row.role, authLinkPresent: Boolean(row.auth_user_id) })), authIdentity: identity }, null, 2));
  await client.query('ROLLBACK');
} catch (error) {
  console.error('Account inspection failed:', error.code ?? error.name);
  process.exitCode = 1;
} finally { await client.end(); }
