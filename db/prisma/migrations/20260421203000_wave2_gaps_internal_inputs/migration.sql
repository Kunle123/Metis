-- Wave 2: clarification gaps + internal inputs (issue-scoped)

-- Normalize legacy counters: open gap counts are derived from `Gap` rows.
UPDATE "Issue" SET "openGapsCount" = 0;

CREATE TABLE "InternalInput" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "linkedSection" TEXT,
    "visibility" TEXT,
    "timestampLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalInput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gap" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "stakeholder" TEXT NOT NULL,
    "linkedSection" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "resolvedByInternalInputId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gap_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalInput_issueId_createdAt_idx" ON "InternalInput"("issueId", "createdAt");

CREATE INDEX "Gap_issueId_status_createdAt_idx" ON "Gap"("issueId", "status", "createdAt");
CREATE INDEX "Gap_resolvedByInternalInputId_idx" ON "Gap"("resolvedByInternalInputId");

ALTER TABLE "InternalInput" ADD CONSTRAINT "InternalInput_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gap" ADD CONSTRAINT "Gap_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gap" ADD CONSTRAINT "Gap_resolvedByInternalInputId_fkey" FOREIGN KEY ("resolvedByInternalInputId") REFERENCES "InternalInput"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
