import assert from "node:assert/strict";

import type { IssueActivityKind } from "@metis/shared/activity";

import { isStoredMessageDraftStale } from "./messageFreshness";

const gen = new Date("2026-01-01T10:00:00.000Z");
const issueStamp = new Date("2026-01-01T11:00:00.000Z");

assert.equal(
  false,
  isStoredMessageDraftStale({
    hasStoredDraft: true,
    generatedFromIssueUpdatedAt: gen,
    issueUpdatedAt: issueStamp,
    activitiesStrictlyAfterRevision: [
      { kind: "message_variant_approval_updated" as IssueActivityKind, createdAt: new Date("2026-01-01T10:30:00.000Z") },
    ],
  }),
);

assert.equal(
  true,
  isStoredMessageDraftStale({
    hasStoredDraft: true,
    generatedFromIssueUpdatedAt: gen,
    issueUpdatedAt: issueStamp,
    activitiesStrictlyAfterRevision: [{ kind: "source_created" as IssueActivityKind, createdAt: new Date("2026-01-01T10:30:00.000Z") }],
  }),
);

console.log("ok messageFreshness.fixtures.runner");
