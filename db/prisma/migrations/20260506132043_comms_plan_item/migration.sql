-- CreateTable
CREATE TABLE "CommsPlanItem" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "stakeholderGroupId" TEXT,
    "title" TEXT NOT NULL,
    "outputType" TEXT NOT NULL,
    "messageTemplateId" TEXT,
    "briefMode" TEXT,
    "exportFormat" TEXT,
    "channel" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL,
    "cadenceMinutes" INTEGER,
    "triggerType" TEXT,
    "nextDueAt" TIMESTAMP(3),
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "lastPreparedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "lastSkippedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "preparedFromMessageVariantId" TEXT,
    "preparedFromBriefVersionId" TEXT,
    "preparedFromExportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommsPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommsPlanItem_issueId_createdAt_idx" ON "CommsPlanItem"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "CommsPlanItem_issueId_status_nextDueAt_idx" ON "CommsPlanItem"("issueId", "status", "nextDueAt");

-- CreateIndex
CREATE INDEX "CommsPlanItem_stakeholderGroupId_idx" ON "CommsPlanItem"("stakeholderGroupId");

-- CreateIndex
CREATE INDEX "CommsPlanItem_preparedFromMessageVariantId_idx" ON "CommsPlanItem"("preparedFromMessageVariantId");

-- CreateIndex
CREATE INDEX "CommsPlanItem_preparedFromBriefVersionId_idx" ON "CommsPlanItem"("preparedFromBriefVersionId");

-- CreateIndex
CREATE INDEX "CommsPlanItem_preparedFromExportId_idx" ON "CommsPlanItem"("preparedFromExportId");

-- AddForeignKey
ALTER TABLE "CommsPlanItem" ADD CONSTRAINT "CommsPlanItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommsPlanItem" ADD CONSTRAINT "CommsPlanItem_stakeholderGroupId_fkey" FOREIGN KEY ("stakeholderGroupId") REFERENCES "StakeholderGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommsPlanItem" ADD CONSTRAINT "CommsPlanItem_preparedFromMessageVariantId_fkey" FOREIGN KEY ("preparedFromMessageVariantId") REFERENCES "MessageVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommsPlanItem" ADD CONSTRAINT "CommsPlanItem_preparedFromBriefVersionId_fkey" FOREIGN KEY ("preparedFromBriefVersionId") REFERENCES "BriefVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommsPlanItem" ADD CONSTRAINT "CommsPlanItem_preparedFromExportId_fkey" FOREIGN KEY ("preparedFromExportId") REFERENCES "ArtifactExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
