/**
 * Deterministic fixture checks for comms plan template suggestions.
 * Run: `npm run test:comms-plan-template`
 */
import assert from "node:assert/strict";

import {
  commsPlanTemplateFingerprint,
  countDuplicateTemplateFingerprintsDropped,
  generateCommsPlanSuggestions,
} from "./generateCommsPlanTemplate";

/** RFC 4122 UUIDs (fixture-only) — Zod `stakeholderGroupId` rejects malformed UUID nibbles such as `-2222-2222—`. */
const audienceGroups = [
  { id: "a0000001-0001-4001-8001-000000000001", name: "Board / Trustees" },
  { id: "a0000001-0002-4002-8002-000000000002", name: "Internal staff" },
  { id: "a0000001-0003-4003-8003-000000000003", name: "Students" },
  { id: "a0000001-0004-4004-8004-000000000004", name: "Media / Press" },
  { id: "a0000001-0005-4005-8005-000000000005", name: "Community residents" },
] as const;

const operational = generateCommsPlanSuggestions({
  eventType: "operational_incident",
  selectedAudienceGroupIds: [],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});

assert.ok(operational.suggestions.length >= 4, "operational incident should produce a baseline plan");
assert.equal(operational.validationRejected.length, 0, "operational baseline should not emit schema validation rejects");
assert.equal(
  new Set(operational.suggestions.map((s) => commsPlanTemplateFingerprint(s.item))).size,
  operational.suggestions.length,
  "suggestion batch should not contain duplicate template fingerprints",
);
assert.ok(
  operational.duplicateShapesHiddenInSuggestionBatch >= 0,
  "duplicate hidden count should be exposed",
);
assert.ok(
  operational.suggestions.some((s) => s.item.outputType === "brief" && s.item.briefMode === "executive"),
  "should include executive brief cadence",
);
assert.ok(
  operational.suggestions.some((s) => s.item.outputType === "export" && s.item.exportFormat === "board-note"),
  "should include board note export",
);
assert.ok(
  operational.suggestions.some((s) => s.item.outputType === "message" && s.item.messageTemplateId === "internal_staff_update"),
  "should include internal staff update",
);
assert.ok(
  operational.suggestions.some((s) => s.item.outputType === "message" && s.item.messageTemplateId === "external_customer_resident_student"),
  "should include external update",
);
assert.ok(
  operational.suggestions.some((s) => s.item.outputType === "message" && s.item.messageTemplateId === "media_holding_line"),
  "should include media holding line",
);

const withBoard = generateCommsPlanSuggestions({
  eventType: "leadership_only",
  selectedAudienceGroupIds: [audienceGroups[0].id],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});
assert.ok(
  withBoard.suggestions.some((s) => s.item.outputType === "export" && s.item.exportFormat === "board-note"),
  "board audience selection should include board note",
);

const withStaff = generateCommsPlanSuggestions({
  eventType: "internal_change",
  selectedAudienceGroupIds: [audienceGroups[1].id],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});
assert.ok(
  withStaff.suggestions.some((s) => s.item.outputType === "message" && s.item.messageTemplateId === "internal_staff_update"),
  "staff audience selection should map to internal staff update template",
);

const withExternal = generateCommsPlanSuggestions({
  eventType: "operational_incident",
  selectedAudienceGroupIds: [audienceGroups[2].id],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});
assert.ok(
  withExternal.suggestions.some(
    (s) => s.item.outputType === "message" && s.item.messageTemplateId === "external_customer_resident_student",
  ),
  "student/customer/resident audience selection should map to external update template",
);

const staffAndCommunity = generateCommsPlanSuggestions({
  eventType: "operational_incident",
  selectedAudienceGroupIds: [audienceGroups[1].id, audienceGroups[4].id],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});
assert.equal(
  staffAndCommunity.validationRejected.length,
  0,
  "staff + community audiences should not produce misleading schema validation rejects",
);
assert.ok(staffAndCommunity.suggestions.length >= 4, "staff + community should still yield a workable suggestion set");

const sampleSuggestion = operational.suggestions[0];
assert.ok(sampleSuggestion, "operational should yield at least one valid row for duplicate helper test");
assert.equal(countDuplicateTemplateFingerprintsDropped([sampleSuggestion.item, sampleSuggestion.item]), 1);

console.log("generateCommsPlanTemplate fixtures: OK");

