-- Lightweight coordination labels for message drafts and export packages (MVP).

ALTER TABLE "MessageVariant" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'Draft';
ALTER TABLE "MessageVariant" ADD COLUMN "approvalUpdatedAt" TIMESTAMP(3);
ALTER TABLE "MessageVariant" ADD COLUMN "approvalUpdatedByUserId" TEXT;

CREATE INDEX "MessageVariant_approvalUpdatedByUserId_idx" ON "MessageVariant"("approvalUpdatedByUserId");

ALTER TABLE "MessageVariant"
ADD CONSTRAINT "MessageVariant_approvalUpdatedByUserId_fkey"
FOREIGN KEY ("approvalUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ArtifactExport" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'Draft';
ALTER TABLE "ArtifactExport" ADD COLUMN "approvalUpdatedAt" TIMESTAMP(3);
ALTER TABLE "ArtifactExport" ADD COLUMN "approvalUpdatedByUserId" TEXT;

CREATE INDEX "ArtifactExport_approvalUpdatedByUserId_idx" ON "ArtifactExport"("approvalUpdatedByUserId");

ALTER TABLE "ArtifactExport"
ADD CONSTRAINT "ArtifactExport_approvalUpdatedByUserId_fkey"
FOREIGN KEY ("approvalUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
