import fs from 'node:fs';
import pg from 'pg';
import { supabaseServiceHeaders } from './supabase-service-headers.mjs';
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const apply = process.argv.includes('--apply');
if (!apply && !process.argv.includes('--check')) throw new Error('Use --check (read only) or --apply.');
const client = new pg.Client({connectionString:process.env.DIRECT_URL || process.env.DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:65000});
const checks = {
  invalid_products: "SELECT count(*)::int AS count FROM public.products WHERE price_cents <= 0 OR stock_quantity < 0 OR (compare_at_price_cents IS NOT NULL AND (price_cents IS NULL OR compare_at_price_cents < price_cents)) OR (condition IN ('imperfect','used') AND stock_quantity > 1) OR base_product_id = id",
  invalid_orders: "SELECT count(*)::int AS count FROM public.orders WHERE subtotal_cents < 0 OR shipping_cents < 0 OR total_cents::bigint <> subtotal_cents::bigint + shipping_cents::bigint",
  invalid_order_items: "SELECT count(*)::int AS count FROM public.order_items WHERE quantity <= 0 OR unit_price_cents < 0 OR total_cents::bigint <> quantity::bigint * unit_price_cents::bigint",
  invalid_media: "SELECT count(*)::int AS count FROM public.media_assets WHERE size_bytes <= 0",
  invalid_image_positions: "SELECT count(*)::int AS count FROM public.product_images WHERE position < 0",
  duplicate_emails: "SELECT count(*)::int AS count FROM (SELECT 1 FROM public.customers GROUP BY lower(btrim(email)) HAVING count(*) > 1) AS conflicts",
  duplicate_covers: "SELECT count(*)::int AS count FROM (SELECT 1 FROM public.product_images WHERE is_primary GROUP BY product_id HAVING count(*) > 1) AS conflicts"
};
const report = {mode:apply?'apply':'read-only-check', conflicts:{}, databaseApplied:false, storageApplied:false};
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  for (const [name,sql] of Object.entries(checks)) report.conflicts[name]=(await client.query(sql)).rows[0].count;
  report.alreadyApplied=(await client.query("SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_positive' AND conrelid='public.products'::regclass) AS applied")).rows[0].applied;
  report.runtimeRole=(await client.query('SELECT rolbypassrls, rolcreatedb, rolsuper FROM pg_roles WHERE rolname=current_user')).rows[0];
  report.tables=(await client.query("SELECT c.relname AS name,c.relrowsecurity AS rls,has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS anon_access,has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS authenticated_access FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname")).rows;
  report.constraints=(await client.query("SELECT conname,convalidated,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace AND (contype='c' OR conname LIKE '%base_product%') ORDER BY conname")).rows;
  report.triggers=(await client.query("SELECT event_object_table,trigger_name FROM information_schema.triggers WHERE trigger_schema='public' AND trigger_name='kayart_updated_at' ORDER BY event_object_table")).rows;
  await client.query('ROLLBACK');
  if (apply && Object.values(report.conflicts).some(count=>count>0)) throw new Error('Conflicts must be resolved before applying; no data changed.');
  if (apply && !report.alreadyApplied) {
    await client.query('BEGIN');
    await client.query(fs.readFileSync('prisma/migrations/20260908_security_integrity/migration.sql','utf8'));
    await client.query('COMMIT');
    report.databaseApplied=true;
  }
  const url=(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
  const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket=process.env.SUPABASE_STORAGE_BUCKET||'product-images';
  const endpoint=url+'/storage/v1/bucket/'+encodeURIComponent(bucket);
  const headers={...supabaseServiceHeaders(key),'Content-Type':'application/json'};
  if (apply) {
    const response=await fetch(endpoint,{method:'PUT',headers,body:JSON.stringify({public:true,file_size_limit:4194304,allowed_mime_types:['image/webp']}),signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Storage configuration failed: HTTP '+response.status);
    report.storageApplied=true;
  }
  const response=await fetch(endpoint,{headers,signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Storage inspection failed: HTTP '+response.status);
  const metadata=await response.json();
  report.bucket={name:bucket,public:metadata.public,file_size_limit:metadata.file_size_limit,allowed_mime_types:metadata.allowed_mime_types};
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{});
  // Never print connection strings, DB detail fields, client rows or keys.
  console.error(JSON.stringify({...report,errorCode:error.code??error.name},null,2));
  process.exitCode=1;
} finally {await client.end().catch(()=>{});}
