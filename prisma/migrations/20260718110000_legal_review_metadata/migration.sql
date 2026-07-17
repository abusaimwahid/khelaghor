CREATE TABLE "LegalPolicyReview" (
  "id" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "version" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "reviewDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'REQUIRES_REVIEW',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LegalPolicyReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LegalPolicyReview_policy_key" ON "LegalPolicyReview"("policy");
