-- AlterTable
ALTER TABLE "Address" ADD COLUMN "divisionId" TEXT,
ADD COLUMN "districtId" TEXT,
ADD COLUMN "areaId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryZoneId" TEXT,
ADD COLUMN "deliveryZoneName" TEXT,
ADD COLUMN "deliveryRuleId" TEXT,
ADD COLUMN "deliveryEstimateMinDays" INTEGER,
ADD COLUMN "deliveryEstimateMaxDays" INTEGER,
ADD COLUMN "codAvailableSnapshot" BOOLEAN;

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deliveryFee" DECIMAL(65,30) NOT NULL,
    "freeDeliveryThreshold" DECIMAL(65,30),
    "minDeliveryDays" INTEGER NOT NULL,
    "maxDeliveryDays" INTEGER NOT NULL,
    "codAvailable" BOOLEAN NOT NULL DEFAULT true,
    "expressAvailable" BOOLEAN NOT NULL DEFAULT false,
    "expressFee" DECIMAL(65,30),
    "fallback" BOOLEAN NOT NULL DEFAULT false,
    "pickup" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZoneRule" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "divisionId" TEXT,
    "districtId" TEXT,
    "areaId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "remoteOnly" BOOLEAN,

    CONSTRAINT "DeliveryZoneRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryZone_slug_key" ON "DeliveryZone"("slug");

-- CreateIndex
CREATE INDEX "DeliveryZone_active_archivedAt_idx" ON "DeliveryZone"("active", "archivedAt");

-- CreateIndex
CREATE INDEX "DeliveryZone_sortOrder_idx" ON "DeliveryZone"("sortOrder");

-- CreateIndex
CREATE INDEX "DeliveryZoneRule_divisionId_idx" ON "DeliveryZoneRule"("divisionId");

-- CreateIndex
CREATE INDEX "DeliveryZoneRule_districtId_idx" ON "DeliveryZoneRule"("districtId");

-- CreateIndex
CREATE INDEX "DeliveryZoneRule_areaId_idx" ON "DeliveryZoneRule"("areaId");

-- CreateIndex
CREATE INDEX "DeliveryZoneRule_priority_idx" ON "DeliveryZoneRule"("priority");

-- CreateIndex
CREATE INDEX "DeliveryZoneRule_zoneId_idx" ON "DeliveryZoneRule"("zoneId");

-- AddForeignKey
ALTER TABLE "DeliveryZoneRule" ADD CONSTRAINT "DeliveryZoneRule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "DeliveryZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
