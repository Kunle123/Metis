/**
 * Deterministic checks for consultation-hours message generation (no DB).
 * Run: `npm run test:message-generate`
 */
import assert from "node:assert/strict";

import type { Claim, Gap, Issue, StakeholderGroup } from "@prisma/client";

import { DEMO_ORGANISATION_ID } from "@/lib/organisations/demoOrganisation";

import { generateExternalCustomerResidentStudentArtifact } from "./generateExternalCustomerUpdate";
import { generateInternalStaffUpdateArtifact } from "./generateInternalStaffUpdate";
import { generateMediaHoldingLineArtifact } from "./generateMediaHoldingLine";
import { issueSignalsConsultationHours, resolveMessageAudienceProfile } from "./messageRecordGrounding";

const consultationHoursIssue: Issue = {
  id: "44444444-4444-4444-4444-444444444444",
  organisationId: DEMO_ORGANISATION_ID,
  title: "Consultation on Proposed Changes to Service Opening Hours",
  summary: "Consultation on opening hours; message discipline required.",
  confirmedFacts:
    "Consultation options for service opening hours are under review.\nNo final decision has been made on the proposed opening-hours change.",
  openQuestions: "",
  context: "Avoid implying a decision is made before equality assessment is complete.",
  issueType: "Consultation briefing",
  severity: "High",
  status: "Ready to brief",
  priority: "Normal",
  operatorPosture: "Active",
  ownerName: "Feasibility QA",
  audience: "Service users, councillors, staff",
  openGapsCount: 2,
  sourcesCount: 0,
  gapCodeSeq: 2,
  observationCodeSeq: 0,
  claimCodeSeq: 8,
  lastActivityAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function gap(p: Partial<Gap> & Pick<Gap, "prompt" | "title">): Gap {
  const now = new Date();
  return {
    id: p.id ?? "gap-1",
    issueId: p.issueId ?? consultationHoursIssue.id,
    gapNumber: p.gapNumber ?? 1,
    title: p.title,
    prompt: p.prompt,
    whyItMatters: p.whyItMatters ?? "",
    stakeholder: p.stakeholder ?? "",
    linkedSection: p.linkedSection ?? null,
    severity: p.severity ?? "Important",
    status: p.status ?? "Open",
    resolvedByInternalInputId: p.resolvedByInternalInputId ?? null,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

function sampleClaim(p: Partial<Claim> & Pick<Claim, "claimNumber" | "text" | "status">): Claim {
  const now = new Date();
  return {
    id: p.id ?? `claim-${p.claimNumber}`,
    issueId: p.issueId ?? consultationHoursIssue.id,
    claimNumber: p.claimNumber,
    text: p.text,
    status: p.status,
    notes: p.notes ?? null,
    createdByUserId: null,
    updatedByUserId: null,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

const consultationGaps = [
  gap({
    id: "g-hours",
    severity: "Critical",
    prompt: "What precise opening-hours option is being proposed for consultation?",
    title: "Proposed hours",
  }),
  gap({
    id: "g-eq",
    severity: "Important",
    prompt: "When will the equality impact assessment be available?",
    title: "Equality timing",
  }),
];

const consultationClaims = [
  sampleClaim({ claimNumber: 1, text: "Consultation options for service opening hours are under review.", status: "Confirmed" }),
  sampleClaim({ claimNumber: 2, text: "No final decision has been made on the proposed opening-hours change.", status: "Confirmed" }),
  sampleClaim({ claimNumber: 3, text: "A late-evening slot may offset some reduced weekday access.", status: "Assumption" }),
  sampleClaim({
    claimNumber: 4,
    text: "The proposed change will save money without reducing service quality.",
    status: "NeedsValidation",
  }),
  sampleClaim({
    claimNumber: 5,
    text: "The equality impact assessment will be complete before public consultation opens.",
    status: "NeedsValidation",
  }),
  sampleClaim({
    claimNumber: 6,
    text: "The service will close earlier from next month.",
    status: "Superseded",
  }),
  sampleClaim({
    claimNumber: 7,
    text: "Older residents and working families will not be adversely affected.",
    status: "NeedsValidation",
  }),
];

function stakeholderGroup(name: string): StakeholderGroup {
  const now = new Date();
  return {
    id: `sg-${name.replace(/\s+/g, "-").toLowerCase()}`,
    organisationId: DEMO_ORGANISATION_ID,
    name,
    description: null,
    defaultSensitivity: null,
    defaultChannels: null,
    defaultToneGuidance: null,
    displayOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

assert.equal(issueSignalsConsultationHours(consultationHoursIssue), true);
assert.equal(resolveMessageAudienceProfile("Service users", "external_customer_resident_student"), "service_users");
assert.equal(resolveMessageAudienceProfile("Councillors and community representatives", "external_customer_resident_student"), "councillors");
assert.equal(resolveMessageAudienceProfile("Staff", "internal_staff_update"), "staff");

const FORBIDDEN_AS_FACT = [
  /save money without reducing service quality/i,
  /will not be adversely affected/i,
  /no adverse equality impact/i,
  /equality impact assessment will be complete before public consultation opens/i,
  /the service will close earlier from next month/i,
  /final opening hours (are|is|will be)/i,
  /\balready decided\b/i,
  /\bdecision is final\b/i,
];

function assertConsultationMessageSafe(label: string, primaryBody: string, allBodies: string) {
  const combined = `${primaryBody}\n${allBodies}`;
  for (const re of FORBIDDEN_AS_FACT) {
    assert.ok(!re.test(primaryBody), `${label}: primary draft must not assert forbidden fact: ${re}`);
  }
  assert.match(primaryBody, /no final decision has been made/i, `${label}: must preserve no-final-decision`);
  assert.match(combined, /Do not/i, `${label}: should include do-not-say discipline in artifact`);
  assert.ok(!/Do not the change will save/i.test(combined), `${label}: do-not-say lines must be grammatical`);
}

const baseExternalInput = {
  issue: consultationHoursIssue,
  sources: [],
  gaps: consultationGaps,
  claims: consultationClaims,
};

const serviceUsers = generateExternalCustomerResidentStudentArtifact({
  ...baseExternalInput,
  audience: { kind: "group", group: stakeholderGroup("Service users"), issueLens: null },
});
const servicePrimary = serviceUsers.sections.find((s) => s.id === "draft-message")?.body ?? "";
assertConsultationMessageSafe("service users", servicePrimary, serviceUsers.sections.map((s) => s.body).join("\n"));
assert.match(servicePrimary, /feedback/i, "service users: mention feedback shaping recommendations");
assert.ok(!/NeedsValidation/i.test(servicePrimary), "service users: no internal claim status jargon");

const councillors = generateExternalCustomerResidentStudentArtifact({
  ...baseExternalInput,
  audience: { kind: "group", group: stakeholderGroup("Councillors and community representatives"), issueLens: null },
});
const councillorPrimary = councillors.sections.find((s) => s.id === "draft-message")?.body ?? "";
assertConsultationMessageSafe("councillors", councillorPrimary, councillors.sections.map((s) => s.body).join("\n"));
assert.match(councillorPrimary, /service cut/i, "councillors: include service-cut holding line prompt");
assert.match(councillorPrimary, /equality impact assessment/i, "councillors: equality assessment caveat");

const staff = generateInternalStaffUpdateArtifact({
  issue: consultationHoursIssue,
  sources: [],
  gaps: consultationGaps,
  internalInputs: [],
  claims: consultationClaims,
  audience: { kind: "group", group: stakeholderGroup("Staff"), issueLens: null },
});
const staffPrimary = staff.sections.find((s) => s.id === "draft-message")?.body ?? "";
assertConsultationMessageSafe("staff", staffPrimary, staff.sections.map((s) => s.body).join("\n"));
assert.match(staffPrimary, /front desk|front-desk/i, "staff: front-desk guidance");
assert.ok(staff.sections.some((s) => s.id === "do-not-say"), "staff: do-not-say section");
assert.ok(staff.sections.some((s) => s.id === "escalation"), "staff: escalation section");

const media = generateMediaHoldingLineArtifact({
  issue: consultationHoursIssue,
  gaps: consultationGaps,
  claims: consultationClaims,
  audience: { kind: "setup" },
});
const mediaPrimary = media.sections.find((s) => s.id === "draft-message")?.body ?? "";
assertConsultationMessageSafe("media", mediaPrimary, media.sections.map((s) => s.body).join("\n"));

console.log("messageGeneration.fixtures.runner: OK");
