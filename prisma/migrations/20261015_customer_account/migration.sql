-- Permit the dedicated runtime role to maintain non-privileged customer profiles.
-- Some environments have not provisioned kayart_app yet; runtime-role.sql applies the same grants when it is created.
DO $account_role$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kayart_app') THEN
    GRANT SELECT (email, first_name, last_name, phone) ON public.customers TO kayart_app;
    GRANT INSERT (auth_user_id, email, first_name, last_name, phone) ON public.customers TO kayart_app;
    GRANT UPDATE (first_name, last_name, phone, updated_at) ON public.customers TO kayart_app;
    DROP POLICY IF EXISTS kayart_server_customer_insert ON public.customers;
    CREATE POLICY kayart_server_customer_insert ON public.customers FOR INSERT TO kayart_app WITH CHECK (role = 'customer');
    DROP POLICY IF EXISTS kayart_server_customer_profile_update ON public.customers;
    CREATE POLICY kayart_server_customer_profile_update ON public.customers FOR UPDATE TO kayart_app USING (true) WITH CHECK (true);
  END IF;
END;
$account_role$;
