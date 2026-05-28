import assert from "node:assert";

import { formatIssueHistoryAxisTime } from "./issueHistoryTime";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueHistoryTime: OK — ${name}`);
  } catch (e) {
    console.error(`issueHistoryTime: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("formats ISO timestamp with day and time parts", () => {
  const r = formatIssueHistoryAxisTime("2026-05-11T04:54:00.000Z");
  assert.ok(r.day.length > 0);
  assert.match(r.time, /^\d{2}:\d{2}$/);
  assert.equal(r.displayTime, `${r.day} ${r.time}`);
});

run("handles invalid ISO gracefully", () => {
  const r = formatIssueHistoryAxisTime("not-a-date");
  assert.equal(r.day, "—");
});

console.log("issueHistoryTime: all tests passed");
