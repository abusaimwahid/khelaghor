-- AlterTable
ALTER TABLE "Category" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "country" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN "movementType" TEXT NOT NULL DEFAULT 'CORRECTION',
ADD COLUMN "reservedBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reservedAfter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reference" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryNote" TEXT,
ADD COLUMN "internalNotes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InventoryMovement_movementType_createdAt_idx" ON "InventoryMovement"("movementType", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_reference_idx" ON "InventoryMovement"("reference");
