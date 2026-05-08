-- Issue-scoped human-readable codes: expand → backfill → enforce NOT NULL → unique indexes

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "gapCodeSeq" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Issue" ADD COLUMN "observationCodeSeq" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Gap" ADD COLUMN "gapNumber" INTEGER;
ALTER TABLE "InternalInput" ADD COLUMN "observationNumber" INTEGER;

-- Backfill ordinals (stable per issue: oldest createdAt first)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "issueId" ORDER BY "createdAt" ASC) AS rn
  FROM "Gap"
)
UPDATE "Gap" AS g SET "gapNumber" = numbered.rn FROM numbered WHERE g.id = numbered.id;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "issueId" ORDER BY "createdAt" ASC) AS rn
  FROM "InternalInput"
)
UPDATE "InternalInput" AS i SET "observationNumber" = numbered.rn FROM numbered WHERE i.id = numbered.id;

-- Sync counters to max assigned ordinals (0 when no rows)
UPDATE "Issue" AS i
SET
  "gapCodeSeq" = COALESCE(sub.gmax, 0),
  "observationCodeSeq" = COALESCE(sub.omax, 0)
FROM (
  SELECT
    i2.id,
    (
      SELECT MAX(g."gapNumber")
      FROM "Gap" AS g
      WHERE g."issueId" = i2.id
    ) AS gmax,
    (
      SELECT MAX(io."observationNumber")
      FROM "InternalInput" AS io
      WHERE io."issueId" = i2.id
    ) AS omax
  FROM "Issue" AS i2
) AS sub
WHERE i.id = sub.id;

-- AlterTable (contract)
ALTER TABLE "Gap" ALTER COLUMN "gapNumber" SET NOT NULL;
ALTER TABLE "InternalInput" ALTER COLUMN "observationNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Gap_issueId_gapNumber_key" ON "Gap"("issueId", "gapNumber");
CREATE UNIQUE INDEX "InternalInput_issueId_observationNumber_key" ON "InternalInput"("issueId", "observationNumber");
