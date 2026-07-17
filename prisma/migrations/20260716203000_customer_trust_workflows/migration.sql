-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'SUSPICIOUS');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "DiscountType" ADD VALUE 'PAYMENT_METHOD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReturnStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "ReturnStatus" ADD VALUE 'REPLACEMENT_APPROVED';
ALTER TYPE "ReturnStatus" ADD VALUE 'REFUND_APPROVED';
ALTER TYPE "ReturnStatus" ADD VALUE 'STORE_CREDIT_ISSUED';

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_FOR_INTERNAL_TEAM';

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "allowedPaymentMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "excludedSaleProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fixedValue" DECIMAL(65,30),
ADD COLUMN     "minimumEligibleSubtotal" DECIMAL(65,30),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "normalizedCode" TEXT,
ADD COLUMN     "percentageValue" DECIMAL(65,30),
ADD COLUMN     "stackable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "value" SET DEFAULT 0;
UPDATE "Coupon"
SET "normalizedCode" = UPPER("code"),
    "name" = COALESCE("name", "code"),
    "percentageValue" = CASE WHEN "type" IN ('PERCENT', 'PRODUCT', 'CATEGORY', 'BRAND', 'FIRST_ORDER', 'CUSTOMER') THEN "value" ELSE "percentageValue" END,
    "fixedValue" = CASE WHEN "type" = 'FIXED' THEN "value" ELSE "fixedValue" END,
    "minimumEligibleSubtotal" = COALESCE("minimumEligibleSubtotal", "minimumSpend");
ALTER TABLE "Coupon" ALTER COLUMN "normalizedCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "href" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deliveryFeeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "externalTransactionId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "returnRequestId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "statusNext" "RefundStatus" NOT NULL DEFAULT 'REQUESTED';
UPDATE "Refund"
SET "number" = 'RF-' || upper(substr(md5("id"), 1, 10)),
    "statusNext" = CASE "status"::text
      WHEN 'PAID' THEN 'COMPLETED'::"RefundStatus"
      WHEN 'REFUNDED' THEN 'COMPLETED'::"RefundStatus"
      WHEN 'FAILED' THEN 'FAILED'::"RefundStatus"
      ELSE 'REQUESTED'::"RefundStatus"
    END;
ALTER TABLE "Refund" DROP COLUMN "status";
ALTER TABLE "Refund" RENAME COLUMN "statusNext" TO "status";
ALTER TABLE "Refund" ALTER COLUMN "number" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReturnItem" ADD COLUMN     "damagedQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "replacementDispatched" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resellableQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "inspectedAt" TIMESTAMP(3),
ADD COLUMN     "inspectionResult" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "replacementSentAt" TIMESTAMP(3);
UPDATE "ReturnRequest" SET "number" = 'RET-' || upper(substr(md5("id"), 1, 10));
ALTER TABLE "ReturnRequest" ALTER COLUMN "number" SET NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "orderItemId" TEXT,
ADD COLUMN     "suspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "statusNext" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "Review"
SET "statusNext" = CASE UPPER("status"::text)
  WHEN 'APPROVED' THEN 'APPROVED'::"ReviewStatus"
  WHEN 'REJECTED' THEN 'REJECTED'::"ReviewStatus"
  WHEN 'HIDDEN' THEN 'HIDDEN'::"ReviewStatus"
  WHEN 'SUSPICIOUS' THEN 'SUSPICIOUS'::"ReviewStatus"
  ELSE 'PENDING'::"ReviewStatus"
END;
ALTER TABLE "Review" DROP COLUMN "status";
ALTER TABLE "Review" RENAME COLUMN "statusNext" TO "status";

-- AlterTable
ALTER TABLE "SupportMessage" ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SupportTicket" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL';
UPDATE "SupportTicket" SET "number" = 'SUP-' || upper(substr(md5("id"), 1, 10));
ALTER TABLE "SupportTicket" ALTER COLUMN "number" SET NOT NULL;

-- CreateTable
CREATE TABLE "CouponProduct" (
    "couponId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("couponId","productId")
);

-- CreateTable
CREATE TABLE "CouponCategory" (
    "couponId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CouponCategory_pkey" PRIMARY KEY ("couponId","categoryId")
);

-- CreateTable
CREATE TABLE "CouponBrand" (
    "couponId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "CouponBrand_pkey" PRIMARY KEY ("couponId","brandId")
);

-- CreateTable
CREATE TABLE "CouponCustomer" (
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CouponCustomer_pkey" PRIMARY KEY ("couponId","userId")
);

-- CreateTable
CREATE TABLE "ReviewReply" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT,
    "body" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnEvidence" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnStatusHistory" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "fromStatus" "ReturnStatus",
    "toStatus" "ReturnStatus" NOT NULL,
    "actorId" TEXT,
    "publicNote" TEXT,
    "privateAdminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "messageId" TEXT,
    "uploaderId" TEXT,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportInternalNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentEmailLog" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "preview" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevelopmentEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReturnStatusHistory_returnId_createdAt_idx" ON "ReturnStatusHistory"("returnId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportAttachment_ticketId_createdAt_idx" ON "SupportAttachment"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_normalizedCode_key" ON "Coupon"("normalizedCode");

-- CreateIndex
CREATE INDEX "Coupon_active_archivedAt_idx" ON "Coupon"("active", "archivedAt");

-- CreateIndex
CREATE INDEX "Coupon_type_idx" ON "Coupon"("type");

-- CreateIndex
CREATE INDEX "Coupon_startsAt_expiresAt_idx" ON "Coupon"("startsAt", "expiresAt");

-- CreateIndex
CREATE INDEX "CouponUsage_userId_createdAt_idx" ON "CouponUsage"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponUsage_couponId_orderId_key" ON "CouponUsage"("couponId", "orderId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_number_key" ON "Refund"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Refund_status_createdAt_idx" ON "Refund"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnItem_returnId_orderItemId_key" ON "ReturnItem"("returnId", "orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_number_key" ON "ReturnRequest"("number");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_createdAt_idx" ON "ReturnRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_userId_createdAt_idx" ON "ReturnRequest"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderItemId_key" ON "Review"("orderItemId");

-- CreateIndex
CREATE INDEX "Review_status_featured_idx" ON "Review"("status", "featured");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_number_key" ON "SupportTicket"("number");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponBrand" ADD CONSTRAINT "CouponBrand_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponBrand" ADD CONSTRAINT "CouponBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCustomer" ADD CONSTRAINT "CouponCustomer_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponCustomer" ADD CONSTRAINT "CouponCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnEvidence" ADD CONSTRAINT "ReturnEvidence_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnStatusHistory" ADD CONSTRAINT "ReturnStatusHistory_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnStatusHistory" ADD CONSTRAINT "ReturnStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportInternalNote" ADD CONSTRAINT "SupportInternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportInternalNote" ADD CONSTRAINT "SupportInternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentEmailLog" ADD CONSTRAINT "DevelopmentEmailLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
