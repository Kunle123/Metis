import assert from "node:assert";

import { formatIssueHistoryAxisTime, formatIssueHistoryDetailTimestamp } from "./issueHistoryTime";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueHistoryTime: OK — ${name}`);
  } catch (e) {
    console.error(`issueHistoryTime: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("formats axis time with calendar date", () => {
  const r = formatIssueHistoryAxisTime("2026-05-11T04:42:00.000Z");
  assert.equal(r.day, "Mon 11 May");
  assert.equal(r.time, "05:42");
  assert.equal(r.displayTime, "Mon 11 May · 05:42");
});

run("formats detail timestamp with full date and zone", () => {
  const r = formatIssueHistoryDetailTimestamp("2026-05-11T04:42:00.000Z");
  assert.equal(r, "Monday 11 May 2026, 05:42 BST");
});

run("handles invalid ISO gracefully", () => {
  const axis = formatIssueHistoryAxisTime("not-a-date");
  assert.equal(axis.day, "—");
  assert.equal(formatIssueHistoryDetailTimestamp("not-a-date"), "—");
});

console.log("issueHistoryTime: all tests passed");
