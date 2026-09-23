ALTER TABLE public.contact_requests ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.repair_requests ADD COLUMN deleted_at timestamptz;
ALTER TABLE public.custom_requests ADD COLUMN deleted_at timestamptz;

CREATE INDEX contact_requests_deleted_at_created_at_idx ON public.contact_requests (deleted_at, created_at DESC);
CREATE INDEX repair_requests_deleted_at_created_at_idx ON public.repair_requests (deleted_at, created_at DESC);
CREATE INDEX custom_requests_deleted_at_created_at_idx ON public.custom_requests (deleted_at, created_at DESC);
