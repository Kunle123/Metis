import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ISSUE_INPUT_DIR = join(process.cwd(), "app/issues/[issueId]/input");

const FORBIDDEN = [
  "setupPlaceholderAttachments",
  "setupPlaceholderTemplate",
  "setup-templates",
  "SetupPlaceholderSidebar",
  "Incident bridge summary — placeholder",
  "Cyber incident intake",
  "Crisis intake template (placeholder)",
] as const;

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueUpdateRecordRoute: OK — ${name}`);
  } catch (e) {
    console.error(`issueUpdateRecordRoute: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("issue input route does not import setup placeholder UI", () => {
  const files = readdirSync(ISSUE_INPUT_DIR).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  for (const file of files) {
    const content = readFileSync(join(ISSUE_INPUT_DIR, file), "utf8");
    for (const needle of FORBIDDEN) {
      assert.ok(!content.includes(needle), `${file} must not contain "${needle}"`);
    }
  }
});
