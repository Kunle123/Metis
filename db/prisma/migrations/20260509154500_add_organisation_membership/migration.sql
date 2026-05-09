-- Hybrid tenancy groundwork: Organisation + Membership, org-scoped Issues and StakeholderGroups.
-- Default/demo org id must stay aligned with db/prisma/seed.ts + lib/organisations/demoOrganisation.ts.

CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clerkOrgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

CREATE UNIQUE INDEX "Organisation_clerkOrgId_key" ON "Organisation"("clerkOrgId");

INSERT INTO "Organisation" ("id", "name", "slug", "clerkOrgId", "status", "createdAt", "updatedAt")
VALUES (
    '00000000-0000-4000-a000-000000000001',
    'Demo Organisation',
    'demo',
    NULL,
    'Active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT;

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

ALTER TABLE "Issue" ADD COLUMN "organisationId" TEXT;

UPDATE "Issue" SET "organisationId" = '00000000-0000-4000-a000-000000000001' WHERE "organisationId" IS NULL;

ALTER TABLE "Issue" ALTER COLUMN "organisationId" SET NOT NULL;

CREATE INDEX "Issue_organisationId_idx" ON "Issue"("organisationId");

ALTER TABLE "Issue"
ADD CONSTRAINT "Issue_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StakeholderGroup" ADD COLUMN "organisationId" TEXT;

UPDATE "StakeholderGroup" SET "organisationId" = '00000000-0000-4000-a000-000000000001' WHERE "organisationId" IS NULL;

DROP INDEX "StakeholderGroup_name_key";

ALTER TABLE "StakeholderGroup" ALTER COLUMN "organisationId" SET NOT NULL;

CREATE UNIQUE INDEX "StakeholderGroup_organisationId_name_key" ON "StakeholderGroup"("organisationId", "name");

CREATE INDEX "StakeholderGroup_organisationId_idx" ON "StakeholderGroup"("organisationId");

ALTER TABLE "StakeholderGroup"
ADD CONSTRAINT "StakeholderGroup_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Membership_userId_organisationId_key" ON "Membership"("userId", "organisationId");

CREATE INDEX "Membership_organisationId_idx" ON "Membership"("organisationId");

CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_organisationId_fkey"
FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Membership" ("id", "userId", "organisationId", "role", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::TEXT,
    u."id",
    '00000000-0000-4000-a000-000000000001',
    CASE u."role"
        WHEN 'Admin' THEN 'Admin'
        WHEN 'Operator' THEN 'User'
        WHEN 'Viewer' THEN 'Viewer'
        ELSE 'Viewer'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" AS u;
