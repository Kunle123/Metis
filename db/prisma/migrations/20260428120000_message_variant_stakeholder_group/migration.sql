-- AlterTable
ALTER TABLE "MessageVariant" ADD COLUMN "stakeholderGroupId" TEXT;

-- Backfill from IssueStakeholder when present
UPDATE "MessageVariant" mv
SET "stakeholderGroupId" = is_row."stakeholderGroupId"
FROM "IssueStakeholder" is_row
WHERE mv."issueStakeholderId" IS NOT NULL
  AND is_row."id" = mv."issueStakeholderId";

-- setup-audience bucket stays null (already null where issueStakeholderId was null)

-- CreateIndex
CREATE INDEX "MessageVariant_issueId_templateId_stakeholderGroupId_idx" ON "MessageVariant"("issueId", "templateId", "stakeholderGroupId");

-- AddForeignKey
ALTER TABLE "MessageVariant" ADD CONSTRAINT "MessageVariant_stakeholderGroupId_fkey" FOREIGN KEY ("stakeholderGroupId") REFERENCES "StakeholderGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
