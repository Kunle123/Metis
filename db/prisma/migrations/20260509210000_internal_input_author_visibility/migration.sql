-- Internal observation author + restricted visibility (minimal policy; not full RBAC).

ALTER TABLE "InternalInput" ADD COLUMN "createdByUserId" TEXT;

UPDATE "InternalInput"
SET "visibility" = 'Organisation'
WHERE "visibility" IS NULL
   OR trim("visibility") = ''
   OR "visibility" NOT IN ('Organisation', 'Restricted');

ALTER TABLE "InternalInput" ALTER COLUMN "visibility" SET DEFAULT 'Organisation';

ALTER TABLE "InternalInput" ALTER COLUMN "visibility" SET NOT NULL;

CREATE INDEX "InternalInput_createdByUserId_idx" ON "InternalInput"("createdByUserId");

ALTER TABLE "InternalInput"
ADD CONSTRAINT "InternalInput_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
