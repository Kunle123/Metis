import assert from "node:assert";

import type { IssueActivityKind } from "@metis/shared/activity";

import { isStoredBriefModeStale } from "./briefFreshness";

const gen = new Date("2026-01-01T10:00:00.000Z");
const issueStamp = new Date("2026-01-01T11:00:00.000Z");

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`briefFreshness: OK — ${name}`);
  } catch (e) {
    console.error(`briefFreshness: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("aligned revision is never stale", () => {
  assert.equal(
    false,
    isStoredBriefModeStale({
      hasStoredBrief: true,
      generatedFromIssueUpdatedAt: issueStamp,
      issueUpdatedAt: issueStamp,
      activitiesStrictlyAfterRevision: [],
    }),
  );
});

run("export activity after revision is benign", () => {
  assert.equal(
    false,
    isStoredBriefModeStale({
      hasStoredBrief: true,
      generatedFromIssueUpdatedAt: gen,
      issueUpdatedAt: issueStamp,
      activitiesStrictlyAfterRevision: [{ kind: "export_created" as IssueActivityKind, createdAt: new Date("2026-01-01T10:30:00.000Z") }],
    }),
  );
});

run("source_created after revision is stale", () => {
  assert.equal(
    true,
    isStoredBriefModeStale({
      hasStoredBrief: true,
      generatedFromIssueUpdatedAt: gen,
      issueUpdatedAt: issueStamp,
      activitiesStrictlyAfterRevision: [{ kind: "source_created", createdAt: new Date("2026-01-01T10:30:00.000Z") }],
    }),
  );
});

run("issue stamp advanced with no substantive activity implies drift", () => {
  assert.equal(
    true,
    isStoredBriefModeStale({
      hasStoredBrief: true,
      generatedFromIssueUpdatedAt: gen,
      issueUpdatedAt: issueStamp,
      activitiesStrictlyAfterRevision: [],
    }),
  );
});

console.log("briefFreshness fixtures: OK");
