/*
  Warnings:

  - Added the required column `circulationState` to the `BriefVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BriefVersion" ADD COLUMN     "circulationNotes" TEXT,
ADD COLUMN     "circulationState" TEXT NOT NULL DEFAULT 'Ready for review',
ADD COLUMN     "derivedFromBriefVersionId" TEXT;

-- CreateTable
CREATE TABLE "BriefComparison" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "fromBriefVersionId" TEXT NOT NULL,
    "toBriefVersionId" TEXT NOT NULL,
    "changeCount" INTEGER NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefComparison_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BriefComparison_issueId_mode_createdAt_idx" ON "BriefComparison"("issueId", "mode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BriefComparison_fromBriefVersionId_toBriefVersionId_key" ON "BriefComparison"("fromBriefVersionId", "toBriefVersionId");

-- CreateIndex
CREATE INDEX "BriefVersion_derivedFromBriefVersionId_idx" ON "BriefVersion"("derivedFromBriefVersionId");

-- AddForeignKey
ALTER TABLE "BriefVersion" ADD CONSTRAINT "BriefVersion_derivedFromBriefVersionId_fkey" FOREIGN KEY ("derivedFromBriefVersionId") REFERENCES "BriefVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefComparison" ADD CONSTRAINT "BriefComparison_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefComparison" ADD CONSTRAINT "BriefComparison_fromBriefVersionId_fkey" FOREIGN KEY ("fromBriefVersionId") REFERENCES "BriefVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefComparison" ADD CONSTRAINT "BriefComparison_toBriefVersionId_fkey" FOREIGN KEY ("toBriefVersionId") REFERENCES "BriefVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
