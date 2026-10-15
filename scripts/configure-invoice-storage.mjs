import fs from 'node:fs';
import { supabaseServiceHeaders } from './supabase-service-headers.mjs';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');

const apply = process.argv.includes('--apply');
if (!apply && !process.argv.includes('--check')) throw new Error('Use --check or --apply.');

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = (process.env.SUPABASE_INVOICE_BUCKET || '').trim();
if (!url.startsWith('https://') || !key || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(bucketName)) {
  throw new Error('Supabase invoice storage is not configured.');
}

const maxBytes = 10 * 1024 * 1024;
const headers = { ...supabaseServiceHeaders(key), 'Content-Type': 'application/json' };
const endpoint = `${url}/storage/v1/bucket`;
const listResponse = await fetch(endpoint, { headers, redirect: 'error', signal: AbortSignal.timeout(10_000) });
if (!listResponse.ok) throw new Error(`Bucket inspection failed: ${listResponse.status}`);
const buckets = await listResponse.json();
if (!Array.isArray(buckets)) throw new Error('Unexpected bucket response.');
const existing = buckets.find((bucket) => bucket.id === bucketName) ?? null;
if (existing?.public === true) {
  throw new Error('Existing invoice bucket is public; refuse to reuse an object namespace that exposed invoices.');
}

if (apply) {
  const response = await fetch(`${endpoint}${existing ? `/${encodeURIComponent(bucketName)}` : ''}`, {
    method: existing ? 'PUT' : 'POST',
    headers,
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: false,
      file_size_limit: maxBytes,
      allowed_mime_types: ['application/pdf']
    })
  });
  if (!response.ok) throw new Error(`Bucket configuration failed: ${response.status}`);
}

const details = await fetch(`${endpoint}/${encodeURIComponent(bucketName)}`, {
  headers,
  redirect: 'error',
  signal: AbortSignal.timeout(10_000)
});
if (!details.ok) throw new Error(`Invoice bucket is missing or unreadable: ${details.status}`);
const bucket = await details.json();
const allowedMimeTypes = Array.isArray(bucket.allowed_mime_types) ? bucket.allowed_mime_types : [];
if (bucket.public !== false) throw new Error('Invoice bucket must be private.');
if (!Number.isFinite(Number(bucket.file_size_limit)) || Number(bucket.file_size_limit) < maxBytes) {
  throw new Error('Invoice bucket must allow PDF files up to 10 MiB. Run --apply.');
}
if (!allowedMimeTypes.includes('application/pdf')) {
  throw new Error('Invoice bucket must allow application/pdf only. Run --apply.');
}

console.log(JSON.stringify({
  mode: apply ? 'apply' : 'read-only-check',
  bucket: bucketName,
  exists: true,
  private: true,
  fileSizeLimit: Number(bucket.file_size_limit),
  allowedMimeTypes
}, null, 2));

