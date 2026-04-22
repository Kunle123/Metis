-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "operatorPosture" TEXT NOT NULL DEFAULT 'Monitoring',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Normal';

-- CreateTable
CREATE TABLE "IssueActivity" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "actorLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueActivity_issueId_createdAt_idx" ON "IssueActivity"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "IssueActivity_issueId_kind_createdAt_idx" ON "IssueActivity"("issueId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Issue_lastActivityAt_idx" ON "Issue"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
