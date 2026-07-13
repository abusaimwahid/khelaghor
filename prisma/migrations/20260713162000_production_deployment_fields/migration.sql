-- Production deployment support fields.
ALTER TABLE "User" ADD COLUMN "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order" ADD COLUMN "courierProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "courierOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE INDEX "Order_courierProvider_courierOrderId_idx" ON "Order"("courierProvider", "courierOrderId");
CREATE INDEX "Order_trackingId_idx" ON "Order"("trackingId");
