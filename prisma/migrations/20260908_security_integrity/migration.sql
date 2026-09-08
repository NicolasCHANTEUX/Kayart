-- Execute as the schema owner, inside a transaction (see scripts/harden-database.mjs).
-- No application records are deleted or rewritten. Conflicting data aborts the transaction.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $security$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['categories','products','product_attributes','media_assets','product_images','customers','orders','order_items','reservations','contact_requests','repair_requests','custom_requests','request_media','blog_posts','stock_alerts','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    -- All browser access goes through the application's authenticated server layer.
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END; $security$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER TABLE public.products ADD CONSTRAINT products_price_positive CHECK (price_cents IS NULL OR price_cents > 0);
ALTER TABLE public.products ADD CONSTRAINT products_compare_price CHECK (compare_at_price_cents IS NULL OR (price_cents IS NOT NULL AND compare_at_price_cents >= price_cents));
ALTER TABLE public.products ADD CONSTRAINT products_stock_nonnegative CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
ALTER TABLE public.products ADD CONSTRAINT products_unique_piece_stock CHECK (condition NOT IN ('imperfect','used') OR stock_quantity IS NULL OR stock_quantity <= 1);
ALTER TABLE public.products ADD CONSTRAINT products_not_own_base CHECK (base_product_id IS NULL OR base_product_id <> id);
ALTER TABLE public.orders ADD CONSTRAINT orders_amounts_consistent CHECK (subtotal_cents >= 0 AND shipping_cents >= 0 AND total_cents::bigint = subtotal_cents::bigint + shipping_cents::bigint);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_amounts_consistent CHECK (quantity > 0 AND unit_price_cents >= 0 AND total_cents::bigint = quantity::bigint * unit_price_cents::bigint);
ALTER TABLE public.media_assets ADD CONSTRAINT media_size_positive CHECK (size_bytes > 0);
ALTER TABLE public.product_images ADD CONSTRAINT product_images_position_nonnegative CHECK (position >= 0);
CREATE UNIQUE INDEX customers_email_normalized_unique ON public.customers (lower(btrim(email)));
CREATE UNIQUE INDEX product_images_one_primary ON public.product_images (product_id) WHERE is_primary;

CREATE OR REPLACE FUNCTION public.kayart_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $timestamp$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$timestamp$;
REVOKE ALL ON FUNCTION public.kayart_set_updated_at() FROM PUBLIC;
DO $triggers$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['categories','products','customers','orders','reservations','contact_requests','repair_requests','custom_requests','blog_posts'] LOOP
    EXECUTE format('CREATE TRIGGER kayart_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.kayart_set_updated_at()', table_name);
  END LOOP;
END; $triggers$;
