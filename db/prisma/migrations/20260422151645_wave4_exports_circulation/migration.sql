-- CreateTable
CREATE TABLE "ArtifactExport" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "briefVersionId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtifactExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CirculationEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "briefVersionId" TEXT NOT NULL,
    "exportId" TEXT,
    "actorLabel" TEXT,
    "eventType" TEXT NOT NULL,
    "channel" TEXT,
    "audienceLabel" TEXT,
    "postureState" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CirculationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtifactExport_issueId_createdAt_idx" ON "ArtifactExport"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "ArtifactExport_briefVersionId_createdAt_idx" ON "ArtifactExport"("briefVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "CirculationEvent_issueId_createdAt_idx" ON "CirculationEvent"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "CirculationEvent_briefVersionId_createdAt_idx" ON "CirculationEvent"("briefVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "CirculationEvent_exportId_idx" ON "CirculationEvent"("exportId");

-- AddForeignKey
ALTER TABLE "ArtifactExport" ADD CONSTRAINT "ArtifactExport_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactExport" ADD CONSTRAINT "ArtifactExport_briefVersionId_fkey" FOREIGN KEY ("briefVersionId") REFERENCES "BriefVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirculationEvent" ADD CONSTRAINT "CirculationEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirculationEvent" ADD CONSTRAINT "CirculationEvent_briefVersionId_fkey" FOREIGN KEY ("briefVersionId") REFERENCES "BriefVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CirculationEvent" ADD CONSTRAINT "CirculationEvent_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "ArtifactExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
