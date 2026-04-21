-- CreateTable
CREATE TABLE "BriefVersion" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "generatedFromIssueUpdatedAt" TIMESTAMP(3) NOT NULL,
    "artifact" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BriefVersion_issueId_mode_createdAt_idx" ON "BriefVersion"("issueId", "mode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BriefVersion_issueId_mode_versionNumber_key" ON "BriefVersion"("issueId", "mode", "versionNumber");

-- AddForeignKey
ALTER TABLE "BriefVersion" ADD CONSTRAINT "BriefVersion_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
