ALTER TABLE "User" ADD COLUMN "staffNote" TEXT;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "UserPermissionOverride" (
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "effect" TEXT NOT NULL DEFAULT 'ALLOW',
  CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("userId", "permissionId")
);
CREATE INDEX "UserPermissionOverride_permissionId_idx" ON "UserPermissionOverride"("permissionId");
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPermissionOverride" ADD CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
