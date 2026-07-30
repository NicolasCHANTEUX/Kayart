-- KayArt admin auth role patch
-- Run this in Supabase SQL Editor if the database already exists and you do not use `prisma db push`.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_role') then
    create type customer_role as enum ('customer', 'admin');
  end if;
end
$$;

alter table customers
  add column if not exists role customer_role not null default 'customer';

-- After creating the admin user in Supabase Auth, promote it with:
--
-- insert into customers (auth_user_id, email, role)
-- values ('SUPABASE_AUTH_USER_ID', 'admin@example.com', 'admin')
-- on conflict (auth_user_id) do update
-- set role = 'admin',
--     email = excluded.email;
