-- KayArt V1 database draft
-- Target: PostgreSQL / Supabase
-- This schema is an initial technical contract. It will be refined before production.

create extension if not exists "pgcrypto";

create type product_condition as enum ('new', 'used', 'service');
create type product_availability as enum ('draft', 'available', 'reserved', 'made_to_order', 'unavailable', 'archived');
create type order_status as enum ('pending', 'paid', 'preparing', 'ready', 'shipped', 'completed', 'cancelled', 'refunded');
create type payment_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
create type request_status as enum ('new', 'in_progress', 'answered', 'closed');
create type reservation_status as enum ('new', 'accepted', 'rejected', 'expired', 'converted', 'cancelled');
create type media_visibility as enum ('public', 'private');

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text unique,
  short_description text,
  description text,
  condition product_condition not null default 'new',
  availability product_availability not null default 'draft',
  price_cents integer,
  compare_at_price_cents integer,
  currency char(3) not null default 'EUR',
  stock_quantity integer,
  is_featured boolean not null default false,
  is_reservable boolean not null default false,
  is_customizable boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_positive check (price_cents is null or price_cents >= 0),
  constraint products_compare_price_positive check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  constraint products_stock_positive check (stock_quantity is null or stock_quantity >= 0)
);

create table product_attributes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  value text not null,
  unit text,
  position integer not null default 0
);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  original_filename text,
  alt_text text,
  mime_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  visibility media_visibility not null default 'public',
  created_at timestamptz not null default now(),
  constraint media_size_positive check (size_bytes > 0)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete restrict,
  is_primary boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index product_images_single_primary
  on product_images(product_id)
  where is_primary;

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_email_unique_lower
  on customers(lower(email));

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  guest_email text not null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  currency char(3) not null default 'EUR',
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  customer_note text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  billing_address jsonb,
  shipping_address jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_amounts_positive check (
    subtotal_cents >= 0 and shipping_cents >= 0 and total_cents >= 0
  )
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_sku text,
  quantity integer not null,
  unit_price_cents integer not null,
  total_cents integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_amounts_positive check (unit_price_cents >= 0 and total_cents >= 0)
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  customer_id uuid references customers(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  status reservation_status not null default 'new',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table repair_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  product_type text,
  damage_description text not null,
  status request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table custom_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  discipline text,
  practice_level text,
  project_description text not null,
  constraints text,
  budget_hint text,
  status request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table request_media (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  request_id uuid not null,
  media_asset_id uuid not null references media_assets(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint request_media_type_check check (request_type in ('contact', 'repair', 'custom'))
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_media_id uuid references media_assets(id) on delete set null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  notified_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);
create index products_availability_idx on products(availability);
create index products_condition_idx on products(condition);
create index product_attributes_product_id_idx on product_attributes(product_id);
create index product_images_product_id_idx on product_images(product_id);
create index orders_guest_email_idx on orders(guest_email);
create index orders_status_idx on orders(status);
create index reservations_product_id_idx on reservations(product_id);
create index repair_requests_status_idx on repair_requests(status);
create index custom_requests_status_idx on custom_requests(status);
create index contact_requests_status_idx on contact_requests(status);
create index blog_posts_published_idx on blog_posts(is_published, published_at);

