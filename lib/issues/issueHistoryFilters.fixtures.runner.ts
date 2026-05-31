import assert from "node:assert";

import {
  classifyIssueHistoryEventType,
  filterIssueHistoryEvents,
  historyHasOnlyInputLane,
  sinceBriefFilterMatches,
} from "./issueHistoryFilters";
import type { IssueHistoryEventCard } from "./issueHistoryTypes";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueHistoryFilters: OK — ${name}`);
  } catch (e) {
    console.error(`issueHistoryFilters: FAIL — ${name}`, e);
    process.exit(1);
  }
}

function card(partial: Partial<IssueHistoryEventCard> & Pick<IssueHistoryEventCard, "id" | "modalType" | "lane">): IssueHistoryEventCard {
  return {
    timestamp: partial.timestamp ?? "2026-05-11T10:00:00.000Z",
    displayTime: partial.displayTime ?? "Mon 11 May · 10:00",
    day: partial.day ?? "Mon 11 May",
    time: partial.time ?? "10:00",
    title: partial.title ?? "Event",
    badge: partial.badge ?? "BADGE",
    linkedRecordType: partial.linkedRecordType ?? "Claim",
    linkedRecordId: partial.linkedRecordId ?? partial.id,
    ...partial,
  };
}

run("classifies modal types into event categories", () => {
  assert.equal(
    classifyIssueHistoryEventType(card({ id: "1", modalType: "incoming_update", lane: "incoming_update" })),
    "inputs",
  );
  assert.equal(
    classifyIssueHistoryEventType(card({ id: "2", modalType: "claim", lane: "issue_record" })),
    "claims_questions",
  );
  assert.equal(
    classifyIssueHistoryEventType(card({ id: "3", modalType: "brief", lane: "metis_output" })),
    "briefs_messages",
  );
  assert.equal(
    classifyIssueHistoryEventType(card({ id: "4", modalType: "export", lane: "metis_output" })),
    "circulation_export",
  );
});

run("filters by lane and type together", () => {
  const events = [
    card({ id: "a", modalType: "incoming_update", lane: "incoming_update" }),
    card({ id: "b", modalType: "claim", lane: "issue_record" }),
    card({ id: "c", modalType: "brief", lane: "metis_output" }),
  ];
  const filtered = filterIssueHistoryEvents(events, { lane: "issue", type: "claims_questions" });
  assert.deepEqual(filtered.map((e) => e.id), ["b"]);
});

run("since last brief keeps only strictly later events", () => {
  const events = [
    card({ id: "a", modalType: "claim", lane: "issue_record", timestamp: "2026-05-11T09:00:00.000Z" }),
    card({ id: "b", modalType: "message", lane: "metis_output", timestamp: "2026-05-11T11:00:00.000Z" }),
  ];
  const filtered = filterIssueHistoryEvents(events, {
    sinceLastBrief: true,
    latestBriefTimestamp: "2026-05-11T10:00:00.000Z",
  });
  assert.deepEqual(filtered.map((e) => e.id), ["b"]);
  assert.equal(
    sinceBriefFilterMatches(events[0]!, true, "2026-05-11T10:00:00.000Z"),
    false,
  );
});

run("detects input-only histories", () => {
  assert.equal(
    historyHasOnlyInputLane([
      card({ id: "a", modalType: "incoming_update", lane: "incoming_update" }),
    ]),
    true,
  );
  assert.equal(
    historyHasOnlyInputLane([
      card({ id: "a", modalType: "incoming_update", lane: "incoming_update" }),
      card({ id: "b", modalType: "claim", lane: "issue_record" }),
    ]),
    false,
  );
});

console.log("issueHistoryFilters: all tests passed");
