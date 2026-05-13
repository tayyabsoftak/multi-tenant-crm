-- Drop unused Assignment model (assignments use Customer.assigneeId only)
DROP TABLE IF EXISTS "Assignment";

-- Global unique email for login disambiguation
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Replace UserRole enum with ADMIN | USER
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'USER');

ALTER TABLE "User" ADD COLUMN "role_new" "UserRole_new";

UPDATE "User" SET "role_new" = CASE
  WHEN "role"::text IN ('OWNER', 'ADMIN') THEN 'ADMIN'::"UserRole_new"
  WHEN "role"::text = 'PLATFORM_ADMIN' THEN 'USER'::"UserRole_new"
  ELSE 'USER'::"UserRole_new"
END;

ALTER TABLE "User" ALTER COLUMN "role_new" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";

-- Customer list/search indexes for large orgs
CREATE INDEX IF NOT EXISTS "Customer_organizationId_name_idx" ON "Customer"("organizationId", "name");
CREATE INDEX IF NOT EXISTS "Customer_organizationId_email_idx" ON "Customer"("organizationId", "email");
