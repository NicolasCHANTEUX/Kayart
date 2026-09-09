-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "checkout_fingerprint" TEXT,
ADD COLUMN     "checkout_key" UUID,
ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "fulfillment_method" TEXT,
ADD COLUMN     "is_test" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shipping_zone_id" UUID;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "delivery_mode" TEXT NOT NULL DEFAULT 'quote';

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "country_codes" TEXT[],
    "postal_prefixes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_postal_prefixes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price_cents" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_holds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkout_holds_status_expires_at_idx" ON "checkout_holds"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_holds_order_id_product_id_key" ON "checkout_holds"("order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkout_key_key" ON "orders"("checkout_key");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "shipping_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_holds" ADD CONSTRAINT "checkout_holds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_holds" ADD CONSTRAINT "checkout_holds_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipping_zones, public.checkout_holds, public.stripe_events FROM anon, authenticated;
ALTER TABLE public.shipping_zones ADD CONSTRAINT shipping_zones_valid_price CHECK (price_cents IS NULL OR price_cents > 0);
ALTER TABLE public.shipping_zones ADD CONSTRAINT shipping_zones_active_price CHECK (NOT enabled OR price_cents IS NOT NULL);
ALTER TABLE public.shipping_zones ALTER COLUMN country_codes SET NOT NULL;
ALTER TABLE public.shipping_zones ALTER COLUMN postal_prefixes SET NOT NULL;
ALTER TABLE public.shipping_zones ALTER COLUMN excluded_postal_prefixes SET NOT NULL;
ALTER TABLE public.checkout_holds ADD CONSTRAINT checkout_holds_quantity CHECK (quantity > 0);
ALTER TABLE public.checkout_holds ADD CONSTRAINT checkout_holds_status CHECK (status IN ('active','committed','released'));
ALTER TABLE public.products ADD CONSTRAINT products_delivery_mode CHECK (delivery_mode IN ('quote','pickupOnly','shippable'));
-- A configured zone is not an invented rate: France starts disabled with no price.
INSERT INTO public.shipping_zones (name,country_codes,excluded_postal_prefixes,enabled)
VALUES ('France métropolitaine',ARRAY['FR'],ARRAY['20','97','98'],false);
