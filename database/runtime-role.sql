-- Dedicated server role only. Browser roles keep no direct application access.
GRANT USAGE ON SCHEMA public TO kayart_app;
GRANT SELECT, INSERT, UPDATE ON public.products, public.orders, public.contact_requests, public.repair_requests, public.custom_requests TO kayart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.product_attributes, public.product_images, public.request_rate_limits TO kayart_app;
GRANT SELECT, INSERT ON public.media_assets, public.order_items, public.request_media TO kayart_app;
GRANT SELECT (id, auth_user_id, role) ON public.customers TO kayart_app;

DO $policies$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['products','orders','contact_requests','repair_requests','custom_requests','categories','product_attributes','product_images','request_rate_limits','media_assets','order_items','request_media'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS kayart_server ON public.%I', table_name);
    EXECUTE format('CREATE POLICY kayart_server ON public.%I TO kayart_app USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END; $policies$;
DROP POLICY IF EXISTS kayart_server_role_lookup ON public.customers;
CREATE POLICY kayart_server_role_lookup ON public.customers FOR SELECT TO kayart_app USING (true);
-- No DELETE on products, orders, media or customer requests. No customer writes,
-- no access to auth/storage tables, no management roles or migration table grants.
