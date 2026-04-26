-- CreateTable
CREATE TABLE "StakeholderGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultSensitivity" TEXT,
    "defaultChannels" TEXT,
    "defaultToneGuidance" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakeholderGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueStakeholder" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "stakeholderGroupId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "needsToKnow" TEXT NOT NULL DEFAULT '',
    "issueRisk" TEXT NOT NULL DEFAULT '',
    "channelGuidance" TEXT NOT NULL DEFAULT '',
    "toneAdjustment" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueStakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StakeholderGroup_name_key" ON "StakeholderGroup"("name");

-- CreateIndex
CREATE INDEX "StakeholderGroup_displayOrder_idx" ON "StakeholderGroup"("displayOrder");

-- CreateIndex
CREATE INDEX "StakeholderGroup_isActive_displayOrder_idx" ON "StakeholderGroup"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "IssueStakeholder_issueId_createdAt_idx" ON "IssueStakeholder"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "IssueStakeholder_stakeholderGroupId_idx" ON "IssueStakeholder"("stakeholderGroupId");

-- CreateIndex
CREATE INDEX "IssueStakeholder_issueId_priority_idx" ON "IssueStakeholder"("issueId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "IssueStakeholder_issueId_stakeholderGroupId_key" ON "IssueStakeholder"("issueId", "stakeholderGroupId");

-- AddForeignKey
ALTER TABLE "IssueStakeholder" ADD CONSTRAINT "IssueStakeholder_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueStakeholder" ADD CONSTRAINT "IssueStakeholder_stakeholderGroupId_fkey" FOREIGN KEY ("stakeholderGroupId") REFERENCES "StakeholderGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
