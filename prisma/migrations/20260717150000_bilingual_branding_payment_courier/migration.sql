-- Optional Bangla content keeps existing English records valid and provides
-- an explicit, manually-managed fallback model.
ALTER TABLE "Category" ADD COLUMN "nameBn" TEXT, ADD COLUMN "descriptionBn" TEXT;
ALTER TABLE "Brand" ADD COLUMN "descriptionBn" TEXT;
ALTER TABLE "Product" ADD COLUMN "nameBn" TEXT, ADD COLUMN "shortDescriptionBn" TEXT, ADD COLUMN "fullDescriptionBn" TEXT;
ALTER TABLE "DeliveryZone" ADD COLUMN "nameBn" TEXT, ADD COLUMN "descriptionBn" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "titleBn" TEXT, ADD COLUMN "excerptBn" TEXT, ADD COLUMN "contentBn" TEXT;
ALTER TABLE "Banner" ADD COLUMN "titleBn" TEXT, ADD COLUMN "subtitleBn" TEXT;
ALTER TABLE "PageContent" ADD COLUMN "titleBn" TEXT, ADD COLUMN "contentBn" JSONB;

ALTER TABLE "Payment"
  ADD COLUMN "sessionKey" TEXT,
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN "validationStatus" TEXT,
  ADD COLUMN "callbackAt" TIMESTAMP(3),
  ADD COLUMN "ipnAt" TIMESTAMP(3),
  ADD COLUMN "failureReason" TEXT;

