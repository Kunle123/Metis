import assert from "node:assert";

import {
  buildRecordsAddedGroupCard,
  formatGroupedRecordTypeCounts,
  groupIssueHistoryRecordAdditions,
  isRecordAdditionEvent,
} from "./groupIssueHistoryRecordAdditions";
import { formatIssueHistoryAxisTime } from "./issueHistoryTime";
import type { IssueHistoryEventCard } from "./issueHistoryTypes";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`groupIssueHistoryRecordAdditions: OK — ${name}`);
  } catch (e) {
    console.error(`groupIssueHistoryRecordAdditions: FAIL — ${name}`, e);
    process.exit(1);
  }
}

function row(
  timestamp: string,
  partial: Omit<IssueHistoryEventCard, "timestamp" | "displayTime" | "day" | "time">,
): IssueHistoryEventCard {
  const axis = formatIssueHistoryAxisTime(timestamp);
  return {
    timestamp,
    displayTime: axis.displayTime,
    day: axis.day,
    time: axis.time,
    ...partial,
  };
}

function sourceCard(id: string, title: string, timestamp: string): IssueHistoryEventCard {
  return row(timestamp, {
    id: `source:${id}`,
    lane: "issue_record",
    title,
    subtitle: "SRC-001 · Official",
    badge: "SOURCE LINKED",
    linkedRecordType: "Source",
    linkedRecordId: id,
    modalType: "source",
  });
}

function gapCard(id: string, title: string, timestamp: string): IssueHistoryEventCard {
  return row(timestamp, {
    id: `gap:${id}`,
    lane: "issue_record",
    title,
    subtitle: "Q-001 · Open",
    badge: "OPEN QUESTION",
    linkedRecordType: "Gap",
    linkedRecordId: id,
    modalType: "gap",
  });
}

function claimCard(id: string, title: string, timestamp: string): IssueHistoryEventCard {
  return row(timestamp, {
    id: `claim:${id}`,
    lane: "issue_record",
    title,
    subtitle: "CLM-001 · Confirmed",
    badge: "CLAIM ADDED",
    linkedRecordType: "Claim",
    linkedRecordId: id,
    modalType: "claim",
  });
}

run("isRecordAdditionEvent identifies source/claim/gap additions only", () => {
  assert.equal(isRecordAdditionEvent(sourceCard("s1", "A", "2026-05-11T10:00:00.000Z")), true);
  assert.equal(
    isRecordAdditionEvent(
      row("2026-05-11T10:00:00.000Z", {
        id: "brief:1",
        lane: "metis_output",
        title: "Brief",
        badge: "BRIEF",
        linkedRecordType: "BriefVersion",
        linkedRecordId: "1",
        modalType: "brief",
      }),
    ),
    false,
  );
});

run("formatGroupedRecordTypeCounts renders mixed type counts", () => {
  const text = formatGroupedRecordTypeCounts({
    sourcesLinked: 2,
    questionsOpened: 2,
  });
  assert.equal(text, "2 sources · 2 open questions");
});

run("groups mixed record types at the same timestamp", () => {
  const ts = "2026-05-11T10:00:00.000Z";
  const events = [
    sourceCard("s1", "Regulatory Compliance Report", ts),
    sourceCard("s2", "Budget Proposal for Fireproofing", ts),
    gapCard("g1", "Cost Estimate for Fireproofing", ts),
    gapCard("g2", "Timeline for Compliance Decisions", ts),
  ];

  const grouped = groupIssueHistoryRecordAdditions(events, { claimInputByClaimId: new Map() }, row);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0]!.modalType, "records_added_group");
  assert.equal(grouped[0]!.title, "Records added");
  assert.equal(grouped[0]!.subtitle, "2 sources · 2 open questions");
  assert.equal(grouped[0]!.groupedRecords?.length, 4);
  assert.deepEqual(
    grouped[0]!.groupedRecords?.map((r) => r.title),
    [
      "Regulatory Compliance Report",
      "Budget Proposal for Fireproofing",
      "Cost Estimate for Fireproofing",
      "Timeline for Compliance Decisions",
    ],
  );
});

run("leaves a single record addition ungrouped", () => {
  const ts = "2026-05-11T10:00:00.000Z";
  const events = [sourceCard("s1", "Only source", ts)];
  const grouped = groupIssueHistoryRecordAdditions(events, { claimInputByClaimId: new Map() }, row);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0]!.modalType, "source");
  assert.equal(grouped[0]!.title, "Only source");
});

run("does not group additions at different timestamps", () => {
  const events = [
    sourceCard("s1", "Source A", "2026-05-11T10:00:00.000Z"),
    sourceCard("s2", "Source B", "2026-05-11T10:01:00.000Z"),
  ];
  const grouped = groupIssueHistoryRecordAdditions(events, { claimInputByClaimId: new Map() }, row);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0]!.modalType, "source");
  assert.equal(grouped[1]!.modalType, "source");
});

run("groups under record-update action anchor at same timestamp", () => {
  const ts = "2026-05-11T10:00:00.000Z";
  const inputId = "input-1";
  const events = [
    row(ts, {
      id: `record-update:${inputId}`,
      lane: "issue_record",
      title: "Issue record updated from update",
      subtitle: "+2 claims",
      badge: "RECORD UPDATED",
      linkedRecordType: "issue_record_update",
      linkedRecordId: `${inputId}::issue_record_update`,
      modalType: "issue_record_update",
    }),
    claimCard("c1", "Claim one", ts),
    claimCard("c2", "Claim two", ts),
  ];

  const grouped = groupIssueHistoryRecordAdditions(
    events,
    { claimInputByClaimId: new Map([["c1", inputId], ["c2", inputId]]) },
    row,
  );

  assert.equal(grouped.length, 2);
  const groupCard = grouped.find((e) => e.modalType === "records_added_group");
  assert.ok(groupCard);
  assert.equal(groupCard!.groupedRecords?.length, 2);
});

run("respects explicit batchKey over timestamp-only grouping", () => {
  const ts = "2026-05-11T10:00:00.000Z";
  const a = sourceCard("s1", "Batch A source", ts);
  const b = gapCard("g1", "Batch A question", ts);
  a.batchKey = "import-1";
  b.batchKey = "import-1";

  const other = sourceCard("s2", "Other source", ts);

  const grouped = groupIssueHistoryRecordAdditions([a, b, other], { claimInputByClaimId: new Map() }, row);
  const batchGroup = grouped.find((e) => e.linkedRecordId === "batch:import-1");
  assert.ok(batchGroup);
  assert.equal(batchGroup!.groupedRecords?.length, 2);
  assert.equal(grouped.filter((e) => e.modalType === "source").length, 1);
});

run("buildRecordsAddedGroupCard preserves related record ids for detail fetch", () => {
  const ts = "2026-05-11T10:00:00.000Z";
  const members = [sourceCard("s1", "A", ts), gapCard("g1", "B", ts)];
  const card = buildRecordsAddedGroupCard(members, "ts:test", row);
  assert.deepEqual(card.relatedRecordIds, ["s1", "g1"]);
  assert.equal(card.linkedRecordType, "records_added_group");
});

console.log("groupIssueHistoryRecordAdditions: all tests passed");
