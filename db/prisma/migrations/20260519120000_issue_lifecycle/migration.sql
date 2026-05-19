-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateIndex
CREATE INDEX "Issue_organisationId_archivedAt_idx" ON "Issue"("organisationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Issue_organisationId_deletedAt_idx" ON "Issue"("organisationId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
