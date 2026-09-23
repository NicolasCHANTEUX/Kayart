import fs from 'node:fs';
import { supabaseServiceHeaders } from './supabase-service-headers.mjs';
if(fs.existsSync('.env.local'))process.loadEnvFile('.env.local');
const apply=process.argv.includes('--apply');
if(!apply&&!process.argv.includes('--check'))throw new Error('Use --check or --apply.');
const url=(process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url.startsWith('https://')||!key)throw new Error('Supabase request storage is not configured.');
const headers={...supabaseServiceHeaders(key),'Content-Type':'application/json'};
const endpoint=url+'/storage/v1/bucket';
const maxRequestImageSizeBytes=5*1024*1024;
const response=await fetch(endpoint,{headers});
if(!response.ok)throw new Error('Bucket inspection failed: '+response.status);
const buckets=await response.json();
if(!Array.isArray(buckets))throw new Error('Unexpected bucket response.');
const existing=buckets.find(bucket=>bucket.id==='request-images')??null;
if(existing?.public===true)throw new Error('Existing bucket is public; refuse to use it for client photos.');
if(apply){
 const updated=await fetch(endpoint+(existing?'/request-images':''),{method:existing?'PUT':'POST',headers,body:JSON.stringify({id:'request-images',name:'request-images',public:false,file_size_limit:maxRequestImageSizeBytes,allowed_mime_types:['image/webp']})});
 if(!updated.ok)throw new Error('Bucket configuration failed: '+updated.status);
}
const details=await fetch(endpoint+'/request-images',{headers});
if(!details.ok)throw new Error('Request image bucket is missing or unreadable: '+details.status);
const bucket=await details.json();
if(bucket.public!==false)throw new Error('Request image bucket must be private.');
if(!Number.isFinite(Number(bucket.file_size_limit))||Number(bucket.file_size_limit)<maxRequestImageSizeBytes)throw new Error('Request image bucket must allow files of at least 5 Mo. Run --apply.');
if(Array.isArray(bucket.allowed_mime_types)&&!bucket.allowed_mime_types.includes('image/webp'))throw new Error('Request image bucket must allow WebP. Run --apply.');
console.log(JSON.stringify({exists:true,private:true,fileSizeLimit:bucket.file_size_limit,configured:apply,bucket:'request-images'},null,2));
