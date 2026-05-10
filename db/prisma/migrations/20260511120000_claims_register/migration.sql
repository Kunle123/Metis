-- Claims register (issue-scoped facts and assumptions)

ALTER TABLE "Issue" ADD COLUMN "claimCodeSeq" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "claimNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NeedsValidation',
    "notes" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Claim_issueId_claimNumber_key" ON "Claim"("issueId", "claimNumber");
CREATE INDEX "Claim_issueId_updatedAt_idx" ON "Claim"("issueId", "updatedAt");
CREATE INDEX "Claim_issueId_status_idx" ON "Claim"("issueId", "status");
CREATE INDEX "Claim_createdByUserId_idx" ON "Claim"("createdByUserId");
CREATE INDEX "Claim_updatedByUserId_idx" ON "Claim"("updatedByUserId");

ALTER TABLE "Claim" ADD CONSTRAINT "Claim_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ClaimSource" (
    "claimId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "ClaimSource_pkey" PRIMARY KEY ("claimId","sourceId")
);

CREATE INDEX "ClaimSource_sourceId_idx" ON "ClaimSource"("sourceId");

ALTER TABLE "ClaimSource" ADD CONSTRAINT "ClaimSource_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimSource" ADD CONSTRAINT "ClaimSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClaimInternalInput" (
    "claimId" TEXT NOT NULL,
    "internalInputId" TEXT NOT NULL,

    CONSTRAINT "ClaimInternalInput_pkey" PRIMARY KEY ("claimId","internalInputId")
);

CREATE INDEX "ClaimInternalInput_internalInputId_idx" ON "ClaimInternalInput"("internalInputId");

ALTER TABLE "ClaimInternalInput" ADD CONSTRAINT "ClaimInternalInput_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimInternalInput" ADD CONSTRAINT "ClaimInternalInput_internalInputId_fkey" FOREIGN KEY ("internalInputId") REFERENCES "InternalInput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ClaimGap" (
    "claimId" TEXT NOT NULL,
    "gapId" TEXT NOT NULL,

    CONSTRAINT "ClaimGap_pkey" PRIMARY KEY ("claimId","gapId")
);

CREATE INDEX "ClaimGap_gapId_idx" ON "ClaimGap"("gapId");

ALTER TABLE "ClaimGap" ADD CONSTRAINT "ClaimGap_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimGap" ADD CONSTRAINT "ClaimGap_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "Gap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
