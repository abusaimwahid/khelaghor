-- CreateIndex
CREATE INDEX "Order_courierProvider_courierOrderId_idx" ON "Order"("courierProvider", "courierOrderId");

-- CreateIndex
CREATE INDEX "Order_trackingId_idx" ON "Order"("trackingId");
