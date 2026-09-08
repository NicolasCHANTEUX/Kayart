// Lecture seule : métadonnées de sécurité, aucun contenu client, aucun DDL/DML.
import fs from 'node:fs';
import pg from 'pg';
if(fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const out = 'outputs/audit-2026-09-07/preuves-base.json';
const config = {dataSource:process.env.KAYART_DATA_SOURCE,imageStorage:process.env.KAYART_IMAGE_STORAGE ?? 'auto',hasDatabaseUrl:!!process.env.DATABASE_URL,hasSupabaseUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasStorageKey:!!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)};
const client = new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:10000});
const report={config};
try {
 await client.connect();
 await client.query('BEGIN READ ONLY');
 report.tables=(await client.query("select c.relname as table_name,c.relrowsecurity as rls,c.relforcerowsecurity as force_rls,has_table_privilege('anon',c.oid,'SELECT') as anon_select,has_table_privilege('anon',c.oid,'INSERT') as anon_insert,has_table_privilege('anon',c.oid,'UPDATE') as anon_update,has_table_privilege('anon',c.oid,'DELETE') as anon_delete,has_table_privilege('authenticated',c.oid,'UPDATE') as authenticated_update from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname")).rows;
 report.policies=(await client.query("select tablename,policyname,roles,cmd from pg_policies where schemaname='public' order by tablename,policyname")).rows;
 report.authenticatedGrants=(await client.query("select c.relname as table_name,has_table_privilege('authenticated',c.oid,'SELECT') as can_select,has_table_privilege('authenticated',c.oid,'INSERT') as can_insert,has_table_privilege('authenticated',c.oid,'UPDATE') as can_update,has_table_privilege('authenticated',c.oid,'DELETE') as can_delete from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by c.relname")).rows;
 report.indexes=(await client.query("select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename in ('customers','product_images')")).rows;
 report.constraints=(await client.query("select c.relname as table_name,con.conname,pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and con.contype='c'")).rows;
 report.runtimeRole=(await client.query('select rolbypassrls,rolcreatedb,rolsuper from pg_roles where rolname=current_user')).rows;
 report.triggers=(await client.query("select event_object_table,trigger_name from information_schema.triggers where trigger_schema='public'")).rows;
 await client.query('ROLLBACK');
 report.status='read-only inspection successful';
} catch(e) {report.status='inspection failed';report.errorCode=e.code ?? e.name;} finally {await client.end().catch(()=>{});}
try {
 const url=(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
 const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 const response=await fetch(url+'/storage/v1/bucket',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
 report.storageStatus=response.status;
 if(response.ok) report.storageBuckets=(await response.json()).map(({id,public:isPublic,file_size_limit,allowed_mime_types})=>({id,public:isPublic,file_size_limit,allowed_mime_types}));
} catch(e) {report.storageStatus=e.name;}
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
