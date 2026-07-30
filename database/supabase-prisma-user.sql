-- KayArt - Supabase Prisma setup
-- Run this in Supabase SQL Editor.
-- Important: replace this password with the same password used in .env.local.

create user "prisma" with password 'replace_with_a_strong_password' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;

-- If the user already exists but the password does not match .env.local, run:
-- alter user "prisma" with password 'replace_with_the_password_used_in_env_local';
