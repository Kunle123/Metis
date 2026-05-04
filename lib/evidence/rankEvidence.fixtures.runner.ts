/**
 * Deterministic checks for evidence ranking helpers.
 * Run: `npm run test:rank-evidence`
 */
import assert from "node:assert/strict";

import type { Gap, InternalInput, Source } from "@prisma/client";
import {
  rankInternalInputsForIssue,
  rankOpenGapsForIssue,
  rankSourcesForIssue,
  sourceTierRank,
} from "./rankEvidence";

const baseDate = new Date("2026-03-01T12:00:00.000Z");

function src(o: Partial<Source> & Pick<Source, "id" | "sourceCode" | "title">): Source {
  return {
    issueId: "iss-1",
    tier: o.tier ?? "Internal",
    note: null,
    snippet: null,
    reliability: o.reliability ?? null,
    linkedSection: o.linkedSection ?? null,
    url: null,
    timestampLabel: null,
    createdAt: o.createdAt ?? baseDate,
    ...o,
  } as Source;
}

const newerInternal = src({
  id: "s-new",
  sourceCode: "SRC-B",
  title: "Newer internal",
  tier: "Internal",
  createdAt: new Date("2026-03-03T12:00:00.000Z"),
});

const olderOfficial = src({
  id: "s-old",
  sourceCode: "SRC-A",
  title: "Older official",
  tier: "Official",
  createdAt: new Date("2026-03-02T12:00:00.000Z"),
});

const rankedSources = rankSourcesForIssue([newerInternal, olderOfficial]);
assert.equal(rankedSources[0]?.sourceCode, "SRC-A", "Official outranks newer Internal when tiers differ");

const sameTierHigherReliability = rankSourcesForIssue([
  src({
    id: "s-lowrel",
    sourceCode: "X1",
    title: "A",
    tier: "Internal",
    reliability: "Low quality",
    createdAt: new Date("2026-03-09T12:00:00.000Z"),
  }),
  src({
    id: "s-hirel",
    sourceCode: "X2",
    title: "B",
    tier: "Internal",
    reliability: "High confidence",
    createdAt: new Date("2026-03-01T12:00:00.000Z"),
  }),
]);
assert.equal(sameTierHigherReliability[0]?.sourceCode, "X2", "higher reliability signal ranks earlier inside same tier");

const sectionRanked = rankSourcesForIssue(
  [
    src({ id: "a", sourceCode: "A", title: "No match", tier: "Internal", linkedSection: "Finance", createdAt: new Date("2099-01-01") }),
    src({ id: "b", sourceCode: "B", title: "Proc match", tier: "Internal", linkedSection: "Procurement", createdAt: new Date("2020-01-01") }),
  ],
  { linkedSectionTarget: "Procurement" },
);
assert.equal(sectionRanked[0]?.sourceCode, "B", "linkedSection target biases ordering between equal-tier sources");

function gap(o: Partial<Gap> & Pick<Gap, "id" | "prompt" | "title">): Gap {
  const now = baseDate;
  const base: Omit<Gap, "prompt" | "title"> & { prompt?: string; title?: string } = {
    id: o.id,
    issueId: "iss-1",
    prompt: "",
    title: "",
    whyItMatters: "",
    stakeholder: "",
    linkedSection: null,
    severity: "Important",
    status: "Open",
    resolvedByInternalInputId: null,
    createdAt: now,
    updatedAt: now,
  };
  return { ...base, ...o } as Gap;
}

const gapsRanked = rankOpenGapsForIssue([
  gap({
    id: "recent-watch",
    title: "",
    prompt: "Recent?",
    severity: "Watch",
    updatedAt: new Date("2026-04-02T12:00:00.000Z"),
  }),
  gap({
    id: "older-critical",
    title: "",
    prompt: "Critical?",
    severity: "Critical",
    updatedAt: new Date("2026-01-01T12:00:00.000Z"),
  }),
]);
assert.equal(gapsRanked[0]?.id, "older-critical", "Critical outranks more-recent Watch");

const mixedStatus = rankOpenGapsForIssue([
  gap({
    id: "closed-any",
    title: "",
    prompt: "Old closed",
    status: "Resolved",
    severity: "Critical",
    updatedAt: new Date("2099-01-01"),
  }),
  gap({ id: "open-watch", title: "", prompt: "Open item", severity: "Watch", status: "Open" }),
]);
assert.equal(mixedStatus[0]?.id, "open-watch", "open gaps rank ahead of resolved when not filtering onlyOpen");

const onlyOpenResolved = rankOpenGapsForIssue(
  [
    gap({ id: "x", title: "", prompt: "No", severity: "Critical", status: "Resolved", updatedAt: new Date("2099-01-01") }),
  ],
  { onlyOpen: true },
);
assert.deepEqual(
  onlyOpenResolved.map((g) => g.id),
  [],
  "onlyOpen drops non-open statuses",
);

const gapStableIds = rankOpenGapsForIssue([
  gap({ id: "b", title: "", prompt: "same", severity: "Important", updatedAt: new Date("2026-06-01") }),
  gap({ id: "a", title: "", prompt: "same", severity: "Important", updatedAt: new Date("2026-06-01") }),
]);
assert.deepEqual(
  gapStableIds.map((g) => g.id),
  ["a", "b"],
  "deterministic tie-break by id ascending",
);

const inputExcluded: InternalInput = {
  id: "ex-1",
  issueId: "iss",
  role: "R",
  name: "N",
  response: "x",
  confidence: "Likely",
  excludedFromBrief: true,
  linkedSection: null,
  visibility: null,
  timestampLabel: null,
  createdAt: baseDate,
} as InternalInput;

const rankedInputs = rankInternalInputsForIssue(
  [
    inputExcluded,
    {
      ...inputExcluded,
      id: "inc-2",
      excludedFromBrief: false,
      confidence: "Unclear",
    },
  ],
  { excludeFromBrief: true },
);
assert.deepEqual(
  rankedInputs.map((x) => x.id),
  ["inc-2"],
  "excludeFromBrief omits flagged rows",
);

const inputConfirmed: InternalInput = {
  ...inputExcluded,
  id: "high",
  excludedFromBrief: false,
  confidence: "Confirmed",
  createdAt: new Date("2010-01-01"),
};

const inputUnclearLater: InternalInput = {
  ...inputExcluded,
  id: "low",
  excludedFromBrief: false,
  confidence: "Unclear",
  createdAt: new Date("2030-01-01"),
};

const inpRank = rankInternalInputsForIssue([inputUnclearLater, inputConfirmed], { excludeFromBrief: true });
assert.equal(inpRank[0]?.confidence, "Confirmed", "confidence dominates over recency for observations");

/** Stable tier rank for unrelated strings shares same bucket beyond canonical list length. */
assert.ok(sourceTierRank("Official") < sourceTierRank("Internal"));
assert.ok(sourceTierRank("Internal") < sourceTierRank("Unknown-tier-xyz"));

console.log("rankEvidence fixtures: OK");
