-- Add intake note fields to Issue
ALTER TABLE "Issue"
ADD COLUMN "confirmedFacts" TEXT,
ADD COLUMN "openQuestions" TEXT,
ADD COLUMN "context" TEXT;

