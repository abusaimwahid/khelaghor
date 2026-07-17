CREATE TABLE "FileAsset" (
  "id" TEXT NOT NULL, "storageProvider" TEXT NOT NULL, "storageKey" TEXT NOT NULL,
  "publicUrl" TEXT, "originalFileName" TEXT NOT NULL, "safeFileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL, "purpose" TEXT NOT NULL,
  "ownerUserId" TEXT, "relatedResourceType" TEXT, "relatedResourceId" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'CUSTOMER_OWNED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3), CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");
CREATE INDEX "FileAsset_ownerUserId_createdAt_idx" ON "FileAsset"("ownerUserId", "createdAt");
CREATE INDEX "FileAsset_relatedResourceType_relatedResourceId_idx" ON "FileAsset"("relatedResourceType", "relatedResourceId");
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "provider" TEXT NOT NULL,
  "externalShipmentId" TEXT, "consignmentId" TEXT, "trackingCode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created', "trackingUrl" TEXT, "providerCharge" DECIMAL(65,30),
  "codAmount" DECIMAL(65,30) NOT NULL DEFAULT 0, "recipientName" TEXT NOT NULL,
  "recipientPhone" TEXT NOT NULL, "address" TEXT NOT NULL, "rawProviderReference" JSONB,
  "idempotencyKey" TEXT NOT NULL, "lastSyncedAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Shipment_idempotencyKey_key" ON "Shipment"("idempotencyKey");
CREATE UNIQUE INDEX "Shipment_orderId_provider_key" ON "Shipment"("orderId", "provider");
CREATE INDEX "Shipment_orderId_createdAt_idx" ON "Shipment"("orderId", "createdAt");
CREATE INDEX "Shipment_provider_externalShipmentId_idx" ON "Shipment"("provider", "externalShipmentId");
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ShipmentEvent" (
  "id" TEXT NOT NULL, "shipmentId" TEXT NOT NULL, "providerEventId" TEXT,
  "status" TEXT NOT NULL, "description" TEXT, "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShipmentEvent_shipmentId_providerEventId_key" ON "ShipmentEvent"("shipmentId", "providerEventId");
CREATE INDEX "ShipmentEvent_shipmentId_createdAt_idx" ON "ShipmentEvent"("shipmentId", "createdAt");
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CourierWebhookEvent" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerEventId" TEXT NOT NULL,
  "payload" JSONB, "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourierWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CourierWebhookEvent_provider_providerEventId_key" ON "CourierWebhookEvent"("provider", "providerEventId");
