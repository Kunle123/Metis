-- CreateTable
CREATE TABLE "MessageVariant" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "generatedFromIssueUpdatedAt" TIMESTAMP(3) NOT NULL,
    "issueStakeholderId" TEXT,
    "audienceSnapshot" JSONB NOT NULL,
    "artifact" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageVariant_issueId_templateId_createdAt_idx" ON "MessageVariant"("issueId", "templateId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageVariant_issueStakeholderId_idx" ON "MessageVariant"("issueStakeholderId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageVariant_issueId_templateId_versionNumber_key" ON "MessageVariant"("issueId", "templateId", "versionNumber");

-- AddForeignKey
ALTER TABLE "MessageVariant" ADD CONSTRAINT "MessageVariant_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageVariant" ADD CONSTRAINT "MessageVariant_issueStakeholderId_fkey" FOREIGN KEY ("issueStakeholderId") REFERENCES "IssueStakeholder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
