-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "checkout_fingerprint" TEXT,
ADD COLUMN     "checkout_key" UUID,
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
