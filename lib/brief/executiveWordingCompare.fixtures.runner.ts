/**
 * Run: `npm run test:brief-presentation` (includes this runner)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");
const LEGACY_SECTION_EYEBROW = "Optional · Wording polish";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`executiveWordingCompare: OK — ${name}`);
  } catch (e) {
    console.error(`executiveWordingCompare: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("full brief page no longer mounts legacy section compare panel", () => {
  const page = readFileSync(join(ROOT, "app/issues/[issueId]/brief/page.tsx"), "utf8");
  assert.ok(!page.includes("BriefExecutiveSummaryCompare"));
  assert.ok(page.includes("FullBriefPresentation"));
});

run("legacy section copy not used in full brief presentation", () => {
  const full = readFileSync(join(ROOT, "components/brief/FullBriefPresentation.tsx"), "utf8");
  assert.ok(!full.includes(LEGACY_SECTION_EYEBROW));
});
