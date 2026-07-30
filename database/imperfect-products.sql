-- KayArt - support des produits imparfaits.
-- A lancer dans Supabase si la base existe deja avant `prisma db push`.

alter type product_condition add value if not exists 'imperfect';

alter table products
  add column if not exists base_product_id uuid references products(id) on delete set null,
  add column if not exists defect_description text;

create index if not exists products_base_product_id_idx
  on products(base_product_id);
