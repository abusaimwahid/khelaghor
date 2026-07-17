-- DropIndex
DROP INDEX "Order_courierProvider_courierOrderId_idx";

-- DropIndex
DROP INDEX "Order_trackingId_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "careInstructions" TEXT,
ADD COLUMN     "deliveryClass" TEXT,
ADD COLUMN     "flashSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "length" DOUBLE PRECISION,
ADD COLUMN     "newArrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "safetyInfo" TEXT,
ADD COLUMN     "socialImage" TEXT,
ADD COLUMN     "specifications" JSONB,
ADD COLUMN     "stockStatus" TEXT NOT NULL DEFAULT 'IN_STOCK',
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "taxable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "width" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "costPriceOverride" DECIMAL(65,30),
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "reservedStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salePriceOverride" DECIMAL(65,30),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weightOverride" DOUBLE PRECISION;
