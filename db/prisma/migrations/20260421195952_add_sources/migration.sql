-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "snippet" TEXT,
    "reliability" TEXT,
    "linkedSection" TEXT,
    "url" TEXT,
    "timestampLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_issueId_tier_createdAt_idx" ON "Source"("issueId", "tier", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Source_issueId_sourceCode_key" ON "Source"("issueId", "sourceCode");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
