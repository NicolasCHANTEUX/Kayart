-- Invoice numbers are allocated by locking the single FA row inside the same
-- serializable transaction that inserts the immutable invoice snapshot.
CREATE TYPE "invoice_archive_status" AS ENUM ('pending', 'ready', 'failed');

CREATE TABLE "invoice_sequences" (
    "series" VARCHAR(16) NOT NULL,
    "current_year" INTEGER NOT NULL DEFAULT 0,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "last_issued_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("series"),
    CONSTRAINT "invoice_sequences_series_valid" CHECK (series = 'FA'),
    CONSTRAINT "invoice_sequences_state_valid" CHECK (
        (current_year = 0 AND last_number = 0 AND last_issued_at IS NULL)
        OR
        (current_year BETWEEN 2000 AND 9999 AND last_number > 0 AND last_issued_at IS NOT NULL)
    )
);

INSERT INTO "invoice_sequences" ("series", "current_year", "last_number")
VALUES ('FA', 0, 0);

CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "series" VARCHAR(16) NOT NULL,
    "sequence_year" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "sale_date" TIMESTAMPTZ(6) NOT NULL,
    "issued_by_user_id" UUID,
    "currency" CHAR(3) NOT NULL,
    "subtotal_excl_tax_cents" INTEGER NOT NULL,
    "shipping_excl_tax_cents" INTEGER NOT NULL,
    "total_excl_tax_cents" INTEGER NOT NULL,
    "tax_cents" INTEGER NOT NULL,
    "total_incl_tax_cents" INTEGER NOT NULL,
    "snapshot_version" INTEGER NOT NULL DEFAULT 1,
    "seller_snapshot" JSONB NOT NULL,
    "buyer_snapshot" JSONB NOT NULL,
    "lines_snapshot" JSONB NOT NULL,
    "tax_snapshot" JSONB NOT NULL,
    "payment_snapshot" JSONB NOT NULL,
    "archive_status" "invoice_archive_status" NOT NULL DEFAULT 'pending',
    "storage_bucket" TEXT,
    "storage_path" TEXT,
    "pdf_sha256" CHAR(64),
    "pdf_size_bytes" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_sequence_valid" CHECK (
        series = 'FA'
        AND sequence_year BETWEEN 2000 AND 9999
        AND sequence_number > 0
        AND invoice_number ~ '^FA-[0-9]{4}-[0-9]{6,}$'
        AND sequence_year = extract(year FROM issued_at AT TIME ZONE 'Europe/Paris')::integer
        AND invoice_number = series || '-' || sequence_year::text || '-'
            || repeat('0', greatest(6 - length(sequence_number::text), 0)) || sequence_number::text
    ),
    CONSTRAINT "invoices_amounts_valid" CHECK (
        subtotal_excl_tax_cents >= 0
        AND shipping_excl_tax_cents >= 0
        AND tax_cents >= 0
        AND total_excl_tax_cents::bigint = subtotal_excl_tax_cents::bigint + shipping_excl_tax_cents::bigint
        AND total_incl_tax_cents::bigint = total_excl_tax_cents::bigint + tax_cents::bigint
    ),
    CONSTRAINT "invoices_currency_valid" CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT "invoices_snapshot_valid" CHECK (
        snapshot_version > 0
        AND jsonb_typeof(seller_snapshot) = 'object'
        AND jsonb_typeof(buyer_snapshot) = 'object'
        AND jsonb_typeof(lines_snapshot) = 'array'
        AND jsonb_array_length(lines_snapshot) > 0
        AND jsonb_typeof(tax_snapshot) = 'object'
        AND jsonb_typeof(payment_snapshot) = 'object'
    ),
    CONSTRAINT "invoices_pdf_hash_valid" CHECK (pdf_sha256 IS NULL OR btrim(pdf_sha256) ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "invoices_pdf_size_valid" CHECK (pdf_size_bytes IS NULL OR pdf_size_bytes > 0),
    CONSTRAINT "invoices_archive_ready_valid" CHECK (
        archive_status <> 'ready'
        OR (
            storage_bucket IS NOT NULL AND btrim(storage_bucket) <> ''
            AND storage_path IS NOT NULL AND btrim(storage_path) <> ''
            AND pdf_sha256 IS NOT NULL
            AND pdf_size_bytes IS NOT NULL
            AND archived_at IS NOT NULL
        )
    )
);

CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE UNIQUE INDEX "invoices_storage_path_key" ON "invoices"("storage_path");
CREATE UNIQUE INDEX "invoices_series_sequence_year_sequence_number_key"
    ON "invoices"("series", "sequence_year", "sequence_number");
CREATE INDEX "invoices_issued_at_idx" ON "invoices"("issued_at");
CREATE INDEX "audit_logs_entity_created_at_idx"
    ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.kayart_prevent_invoice_mutation() RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $invoice_immutable$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Issued invoices cannot be deleted.' USING ERRCODE = '55000';
    END IF;

    IF OLD.archive_status = 'ready' AND NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'Archived invoice documents are immutable.' USING ERRCODE = '55000';
    END IF;

    IF (to_jsonb(NEW) - ARRAY[
        'archive_status',
        'storage_bucket',
        'storage_path',
        'pdf_sha256',
        'pdf_size_bytes',
        'archived_at',
        'updated_at'
    ]) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY[
        'archive_status',
        'storage_bucket',
        'storage_path',
        'pdf_sha256',
        'pdf_size_bytes',
        'archived_at',
        'updated_at'
    ]) THEN
        RAISE EXCEPTION 'Issued invoice contents are immutable.' USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
END;
$invoice_immutable$;

REVOKE ALL ON FUNCTION public.kayart_prevent_invoice_mutation() FROM PUBLIC;

CREATE TRIGGER kayart_invoice_immutable
BEFORE UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.kayart_prevent_invoice_mutation();

ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invoice_sequences, public.invoices, public.audit_logs FROM anon, authenticated;

-- The runtime role is provisioned separately on a fresh environment. Apply its
-- least-privilege grants now when it already exists; runtime-role.sql repeats
-- the same grants and policies during provisioning.
DO $runtime_role$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kayart_app') THEN
        EXECUTE 'REVOKE ALL ON public.invoice_sequences, public.invoices, public.audit_logs FROM kayart_app';
        EXECUTE 'GRANT SELECT, INSERT ON public.invoice_sequences TO kayart_app';
        EXECUTE 'GRANT UPDATE (current_year, last_number, last_issued_at, updated_at) ON public.invoice_sequences TO kayart_app';
        EXECUTE 'GRANT SELECT, INSERT ON public.invoices, public.audit_logs TO kayart_app';
        EXECUTE 'GRANT UPDATE (archive_status, storage_bucket, storage_path, pdf_sha256, pdf_size_bytes, archived_at, updated_at) ON public.invoices TO kayart_app';

        EXECUTE 'DROP POLICY IF EXISTS kayart_server ON public.invoice_sequences';
        EXECUTE 'CREATE POLICY kayart_server ON public.invoice_sequences TO kayart_app USING (true) WITH CHECK (true)';
        EXECUTE 'DROP POLICY IF EXISTS kayart_server ON public.invoices';
        EXECUTE 'CREATE POLICY kayart_server ON public.invoices TO kayart_app USING (true) WITH CHECK (true)';
        EXECUTE 'DROP POLICY IF EXISTS kayart_server ON public.audit_logs';
        EXECUTE 'CREATE POLICY kayart_server ON public.audit_logs TO kayart_app USING (true) WITH CHECK (true)';
    END IF;
END;
$runtime_role$;
