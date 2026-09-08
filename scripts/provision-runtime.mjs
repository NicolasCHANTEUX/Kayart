import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const apply=process.argv.includes('--apply');
if (!apply && !process.argv.includes('--check')) throw new Error('Use --check or --apply.');
const credentialFile='.env.runtime.local';
const adminUrl=process.env.DIRECT_URL;
if (!adminUrl) throw new Error('A separate DIRECT_URL is required.');
const client=new pg.Client({connectionString:adminUrl,connectionTimeoutMillis:10000,query_timeout:15000});
const report={mode:apply?'apply':'read-only',role:'kayart_app',localConnectionChanged:false};
let createdCredentialFile=false;
let committed=false;
try {
  await client.connect();
  const existing=(await client.query("SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolreplication FROM pg_roles WHERE rolname='kayart_app'")).rows[0];
  report.existingRole=existing??null;
  if (!apply) {
    report.creatorCanManageRoles=(await client.query('SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user')).rows[0].rolcreaterole;
  } else {
    if (existing && !fs.existsSync(credentialFile)) throw new Error('Existing role has no local credential; explicit recovery is required.');
    if (!existing && fs.existsSync(credentialFile)) throw new Error('Credential file already exists; inspect before provisioning.');
    let runtimeUrl;
    await client.query('BEGIN');
    if (!existing) {
      const password=randomBytes(36).toString('hex');
      await client.query("CREATE ROLE kayart_app LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '"+password+"'");
      await client.query("ALTER ROLE kayart_app SET statement_timeout='15s'");
      await client.query("ALTER ROLE kayart_app SET idle_in_transaction_session_timeout='15s'");
      const parsed=new URL(process.env.DATABASE_URL||adminUrl);
      const user=decodeURIComponent(parsed.username);
      parsed.username=parsed.hostname.endsWith('.pooler.supabase.com')?'kayart_app.'+user.substring(user.indexOf('.')+1):'kayart_app';
      if (parsed.hostname.endsWith('.pooler.supabase.com') && !user.includes('.')) throw new Error('Pooler project suffix missing.');
      parsed.password=password;
      runtimeUrl=parsed.toString();
      fs.writeFileSync(credentialFile,'# Server-only credential. Do not commit or paste into chat.\nDATABASE_URL='+runtimeUrl+'\n',{flag:'wx',mode:0o600});
      createdCredentialFile=true;
    } else {
      runtimeUrl=fs.readFileSync(credentialFile,'utf8').match(/^DATABASE_URL=(.+)$/m)?.[1];
      if (!runtimeUrl) throw new Error('Local runtime credential missing.');
    }
    await client.query(fs.readFileSync('database/runtime-role.sql','utf8'));
    await client.query('COMMIT');committed=true;
    const runtime=new pg.Client({connectionString:runtimeUrl,connectionTimeoutMillis:10000,query_timeout:15000});
    try {
      await runtime.connect();
      const role=(await runtime.query('SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolreplication FROM pg_roles WHERE rolname=current_user')).rows[0];
      if (role.rolname!=='kayart_app' || role.rolsuper || role.rolcreatedb || role.rolcreaterole || role.rolbypassrls || role.rolreplication) throw new Error('Unexpected runtime privileges.');
      report.verifiedRole=role;
      // Exercise access without reading any application rows.
      await runtime.query('SELECT id FROM public.products WHERE false');
      await runtime.query('SELECT role FROM public.customers WHERE false');
      await runtime.query('SELECT id FROM public.contact_requests WHERE false');
      const access=(await runtime.query("SELECT has_schema_privilege(current_user,'public','CREATE') AS can_create,has_table_privilege(current_user,'auth.users','SELECT') AS can_read_auth,has_column_privilege(current_user,'public.customers','role','UPDATE') AS can_change_roles,has_table_privilege(current_user,'public.orders','DELETE') AS can_delete_orders")).rows[0];
      if (Object.values(access).some(Boolean)) throw new Error('Runtime has excessive inherited privileges.');
      report.restrictedOperations=access;
    } finally { await runtime.end().catch(()=>{}); }
    // Switch local runtime only after successful real authentication and permission checks.
    const local=fs.readFileSync('.env.local','utf8');
    if (!/^DATABASE_URL=.*$/m.test(local)) throw new Error('DATABASE_URL entry not found.');
    fs.writeFileSync('.env.local',local.replace(/^DATABASE_URL=.*$/m,()=> 'DATABASE_URL='+runtimeUrl));
    report.localConnectionChanged=true;
    report.hostingStep='Set the hosting DATABASE_URL to the value in .env.runtime.local, keep DIRECT_URL separate, then redeploy.';
  }
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  await client.query('ROLLBACK').catch(()=>{});
  if (createdCredentialFile && !committed) fs.unlinkSync(credentialFile);
  console.error(JSON.stringify({...report,errorCode:error.code??error.name,roleTransactionCommitted:committed},null,2));
  process.exitCode=1;
} finally { await client.end().catch(()=>{}); }
