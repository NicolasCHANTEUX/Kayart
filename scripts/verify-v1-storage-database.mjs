// Explicit integration check: metadata only, SQL fixtures always rolled back,
// one generated 2x2 WebP uploaded under a fresh UUID and removed in finally.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import sharp from 'sharp';
import { supabaseServiceHeaders } from './supabase-service-headers.mjs';
if (!process.argv.includes('--integration-check')) throw new Error('Use --integration-check.');
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const report = { database: {}, storage: {} };
const client = new pg.Client({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 10000, query_timeout: 10000 });
try {
  await client.connect();
  const tables = (await client.query("SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS anon_access,has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS authenticated_access FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname <> '_prisma_migrations' ORDER BY c.relname")).rows;
  assert.ok(tables.length >= 20);
  for (const table of tables) { assert.equal(table.relrowsecurity, true); assert.equal(table.anon_access, false); assert.equal(table.authenticated_access, false); }
  report.database.tables = tables;
  report.database.migrations = (await client.query('SELECT migration_name,finished_at IS NOT NULL AS applied FROM _prisma_migrations ORDER BY migration_name')).rows;
  await client.query('BEGIN');
  await client.query('SAVEPOINT invalid_rate');
  await assert.rejects(client.query("INSERT INTO shipping_zones(name,country_codes,enabled) VALUES('ROLLBACK FIXTURE',ARRAY['FR'],true)"), error => error.code === '23514');
  await client.query('ROLLBACK TO SAVEPOINT invalid_rate');
  const key = 'integration-fixture:' + randomUUID();
  const sql = 'INSERT INTO request_rate_limits(key,count,reset_at) VALUES($1,1,now()+interval \'1 minute\') ON CONFLICT(key) DO UPDATE SET count=request_rate_limits.count+1 WHERE request_rate_limits.count < 1 RETURNING count';
  assert.equal((await client.query(sql, [key])).rowCount, 1);
  assert.equal((await client.query(sql, [key])).rowCount, 0);
  await client.query('ROLLBACK');
  report.database.invalidEnabledRateRejected = true;
  report.database.atomicLimitVerified = true;
  report.database.fixtureWritesRolledBack = true;
} finally { await client.query('ROLLBACK').catch(() => {}); await client.end().catch(() => {}); }

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = supabaseServiceHeaders(secret);
const bucket = 'request-images', path = 'requests/' + randomUUID() + '.webp';
const metadata = await fetch(url + '/storage/v1/bucket/' + bucket, { headers });
assert.ok(metadata.ok); assert.equal((await metadata.json()).public, false);
const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#4488aa' } }).webp().toBuffer();
let uploaded = false;
try {
  const upload = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'image/webp', 'x-upsert': 'false' }, body: bytes });
  assert.ok(upload.ok); uploaded = true;
  const privateRead = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${path}`, { headers });
  assert.ok(privateRead.ok); assert.deepEqual(Buffer.from(await privateRead.arrayBuffer()), bytes);
  const publicRead = await fetch(`${url}/storage/v1/object/public/${bucket}/${path}`);
  assert.equal(publicRead.ok, false);
  const anonymousRead = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${path}`);
  assert.equal(anonymousRead.ok, false);
  report.storage = { privateBucket: true, syntheticImageRoundtrip: true, publicAccessDenied: true, anonymousAccessDenied: true };
} finally {
  if (uploaded) {
    const removed = await fetch(`${url}/storage/v1/object/${bucket}`, { method: 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) });
    assert.ok(removed.ok);
    const after = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${path}`, { headers });
    assert.equal(after.ok, false); report.storage.syntheticImageRemoved = true;
  }
}
fs.mkdirSync('outputs/suite-v1-2026-09-08', { recursive: true });
fs.writeFileSync('outputs/suite-v1-2026-09-08/integration-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
