-- Normalize numeric Metis source codes to SRC-### (min 3 digits; ordinals > 999 stay unpadded).
-- Staging avoids unique ("issueId","sourceCode") violations while rewriting.
-- Aborts if two rows on the same issue would map to the same canonical code (e.g. SRC-01 + SRC-001).

DO $$
BEGIN
  IF EXISTS (
    WITH parsed AS (
      SELECT
        id,
        "issueId",
        'SRC-' || CASE
          WHEN length((regexp_match("sourceCode", '^SRC-([0-9]+)$'))[1]) > 3
            THEN (regexp_match("sourceCode", '^SRC-([0-9]+)$'))[1]
          ELSE lpad((regexp_match("sourceCode", '^SRC-([0-9]+)$'))[1], 3, '0')
        END AS norm
      FROM "Source"
      WHERE "sourceCode" ~ '^SRC-[0-9]+$'
    ),
    dup AS (
      SELECT "issueId", norm
      FROM parsed
      GROUP BY "issueId", norm
      HAVING COUNT(*) > 1
    )
    SELECT 1 FROM dup LIMIT 1
  ) THEN
    RAISE EXCEPTION 'normalize_numeric_source_codes: collision after normalize (same issueId + norm).';
  END IF;
END $$;

UPDATE "Source"
SET "sourceCode" = 'SRC_TMPNUM_' || (regexp_match("sourceCode", '^SRC-([0-9]+)$'))[1] || '__' || replace(id::text, '-', '')
WHERE "sourceCode" ~ '^SRC-[0-9]+$';

UPDATE "Source"
SET "sourceCode" = 'SRC-' || CASE
  WHEN length((regexp_match("sourceCode", '^SRC_TMPNUM_([0-9]+)__'))[1]) > 3
    THEN (regexp_match("sourceCode", '^SRC_TMPNUM_([0-9]+)__'))[1]
  ELSE lpad((regexp_match("sourceCode", '^SRC_TMPNUM_([0-9]+)__'))[1], 3, '0')
END
WHERE "sourceCode" ~ '^SRC_TMPNUM_[0-9]+__';
