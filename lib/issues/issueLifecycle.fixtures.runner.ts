import assert from "node:assert";

import {
  isIssueActive,
  isIssueArchived,
  isIssueDeleted,
  isIssueWritable,
  parseIssueLedger,
  prismaWhereIssuesForLedger,
} from "./issueLifecycle";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueLifecycle: OK — ${name}`);
  } catch (e) {
    console.error(`issueLifecycle: FAIL — ${name}`, e);
    process.exit(1);
  }
}

const active = { archivedAt: null, deletedAt: null };
const archived = { archivedAt: new Date("2026-01-01"), deletedAt: null };
const deleted = { archivedAt: null, deletedAt: new Date("2026-01-02") };

run("active issue flags", () => {
  assert.equal(isIssueActive(active), true);
  assert.equal(isIssueArchived(active), false);
  assert.equal(isIssueDeleted(active), false);
  assert.equal(isIssueWritable(active), true);
});

run("archived issue flags", () => {
  assert.equal(isIssueActive(archived), false);
  assert.equal(isIssueArchived(archived), true);
  assert.equal(isIssueWritable(archived), false);
});

run("deleted issue flags", () => {
  assert.equal(isIssueDeleted(deleted), true);
  assert.equal(isIssueArchived(deleted), false);
  assert.equal(isIssueWritable(deleted), false);
});

run("parseIssueLedger", () => {
  assert.equal(parseIssueLedger(undefined), "active");
  assert.equal(parseIssueLedger("archived"), "archived");
  assert.equal(parseIssueLedger("active"), "active");
});

run("dashboard where active excludes archived and deleted", () => {
  const w = prismaWhereIssuesForLedger("org-1", "active");
  assert.equal(w.organisationId, "org-1");
  assert.equal(w.deletedAt, null);
  assert.equal(w.archivedAt, null);
});

run("dashboard where archived includes only archived non-deleted", () => {
  const w = prismaWhereIssuesForLedger("org-1", "archived");
  assert.equal(w.deletedAt, null);
  assert.deepEqual(w.archivedAt, { not: null });
});

console.log("issueLifecycle fixtures: ok");
