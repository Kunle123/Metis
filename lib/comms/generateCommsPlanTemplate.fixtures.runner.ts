/**
 * Deterministic fixture checks for comms plan template suggestions.
 * Run: `npm run test:comms-plan-template`
 */
import assert from "node:assert/strict";

import { generateCommsPlanSuggestions } from "./generateCommsPlanTemplate";

const audienceGroups = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Board / Trustees" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Internal staff" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Students" },
  { id: "44444444-4444-4444-4444-444444444444", name: "Media / Press" },
] as const;

const operational = generateCommsPlanSuggestions({
  eventType: "operational_incident",
  selectedAudienceGroupIds: [],
  audienceGroups: [...audienceGroups],
  now: new Date("2026-05-06T10:00:00.000Z"),
});

assert.ok(operational.suggestions.length >= 4, "operational incident should produce a baseline plan");
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

console.log("generateCommsPlanTemplate fixtures: OK");

