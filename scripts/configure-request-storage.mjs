import fs from 'node:fs';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const apply=process.argv.includes('--apply');
if(!apply&&!process.argv.includes('--check'))throw new Error('Use --check or --apply.');
const url=(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
const endpoint=url+'/storage/v1/bucket';
const response=await fetch(endpoint,{headers});
if(!response.ok)throw new Error('Bucket inspection failed: '+response.status);
const buckets=await response.json();
if(!Array.isArray(buckets))throw new Error('Unexpected bucket response.');
const existing=buckets.find(bucket=>bucket.id==='request-images')??null;
if(existing?.public===true)throw new Error('Existing bucket is public; refuse to use it for client photos.');
if(apply){
 const updated=await fetch(endpoint+(existing?'/request-images':''),{method:existing?'PUT':'POST',headers,body:JSON.stringify({id:'request-images',name:'request-images',public:false,file_size_limit:4194304,allowed_mime_types:['image/webp']})});
 if(!updated.ok)throw new Error('Bucket configuration failed: '+updated.status);
}
console.log(JSON.stringify({exists:!!existing||apply,private:apply||existing?.public===false,configured:apply,bucket:'request-images'},null,2));
