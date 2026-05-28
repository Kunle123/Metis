import {
  BRAMLEY_BRIEF_VERSION_IDS,
  BRAMLEY_CLAIM_IDS,
  BRAMLEY_GAP_IDS,
  BRAMLEY_MESSAGE_VARIANT_IDS,
  BRAMLEY_OUTPUT_IDS,
  BRAMLEY_SOURCE_IDS,
} from "./ids";
import { bramleyOpenQuestions } from "./issue-record";
import type { BramleyOutputExport } from "./types";
import { bramleyAt, bramleyIso } from "./timestamps";
import { notYetKnown, snapshotAt } from "./snapshot";

function openQuestionLabelsAt(iso: string): string[] {
  const snap = snapshotAt(iso);
  const at = bramleyAt(iso);
  return bramleyOpenQuestions
    .filter((q) => snap.openQuestionIdsStillOpen.includes(q.id))
    .map((q) => {
      if (
        q.partiallyAnsweredAt &&
        bramleyAt(q.partiallyAnsweredAt) <= at &&
        q.resolvedAt &&
        bramleyAt(q.resolvedAt) > at
      ) {
        return `${q.gapCode}: ${q.title} (partially answered)`;
      }
      return `${q.gapCode}: ${q.title}`;
    });
}

function baseOutput(
  partial: Omit<
    BramleyOutputExport,
    | "basedOnSnapshotAt"
    | "includedRecordIds"
    | "notYetKnownRecordIds"
    | "openQuestionsAtGeneration"
    | "caveatsAtGeneration"
  > & { generatedAt: string; caveatsAtGeneration?: string[] },
): BramleyOutputExport {
  const { caveatsAtGeneration: callerCaveats, ...rest } = partial;
  const snap = snapshotAt(partial.generatedAt);
  const full = snapshotAt("2026-05-11T23:59:59");
  return {
    ...rest,
    basedOnSnapshotAt: snap.at.toISOString(),
    includedRecordIds: [
      ...snap.incomingUpdateIds,
      ...snap.sourceIds,
      ...snap.claimIds,
      ...snap.openQuestionIds,
      ...snap.observationIds,
    ],
    notYetKnownRecordIds: notYetKnown(snap, full),
    openQuestionsAtGeneration: openQuestionLabelsAt(partial.generatedAt),
    caveatsAtGeneration: callerCaveats ?? [],
  };
}

const STAFF_HOLDING_BODY = [
  "Staff holding update — Bramley Junction (internal)",
  "",
  "Use this line with passengers",
  "- Bramley Junction is open via the side entrance. Trains are running as normal.",
  "- The main entrance is temporarily unavailable while final checks complete after overnight improvement works.",
  "",
  "Do not say",
  "- That the station is closed or trains are cancelled.",
  "- Anything about roof leaks/structural failure (not confirmed).",
  "- A reopening time until facilities confirms.",
  "",
  "Escalate",
  "- Direct press/social queries to corporate affairs duty.",
].join("\n");

const PASSENGER_V1_BODY =
  "Bramley Junction station is open via the side entrance. Trains are running as normal. The main entrance is temporarily unavailable while final checks are completed after overnight improvement works. Staff are on site to help direct passengers.";

const SOCIAL_LINE_BODY = [
  "Bramley Junction is open via the side entrance and trains are running as normal.",
  "The main entrance is temporarily closed while final checks are completed after overnight improvement works.",
  "We’ll share an update when the main entrance reopens.",
].join(" ");

const PRESS_LINE_BODY = [
  "Bramley Junction remains open via the side entrance and trains are running as normal.",
  "The main entrance is temporarily unavailable while final checks are completed after overnight improvement works.",
  "We will provide an update once inspections and clean-up are complete.",
].join("\n");

function executiveBriefV1Body(): string {
  return [
    "Executive brief — Bramley Junction main entrance delay (V1)",
    "",
    "Current position",
    "- Main entrance delayed after overnight planned works handback.",
    "- Station open via side entrance; trains running.",
    "- Comms engaged from 05:42 when duty manager briefed corporate affairs; duty overnight pack logged in Metis at 05:50.",
    "- Social monitoring (05:48) and press enquiry (06:08) drove external messaging; executive office requested this note at 06:35.",
    "",
    "What happened (from duty pack and subsequent updates logged in Metis)",
    "- Planned works scheduled with 05:30 handback (SRC-001).",
    "- Contractor withheld final ceiling panel sign-off at main entrance (SRC-003).",
    "- Station manager escalated likely miss of 05:30 target (SRC-004).",
    "",
    "Customer impact",
    "- Limited but visible at main entrance; help point queries (SRC-007).",
    "- Some social posts incorrectly describe station as shut (SRC-008).",
    "",
    "Operational position",
    "- Side entrance staffing and barriers deployed (SRC-005).",
    "- NOC confirms trains calling (SRC-006).",
    "",
    "Media / reputation",
    "- Local reporter deadline following 06:08 press call; holding line drafted after enquiry.",
    "",
    "Open questions",
    "- Ceiling area safety confirmation.",
    "- Expected main entrance reopening time.",
    "",
    "Next actions",
    "- Maintain side entrance flow; staff and passenger lines in use.",
    "- Respond to press within window using holding line.",
    "- Await facilities inspection outcome before committing reopening time.",
    "",
    "Confidence / caveats",
    "- Based only on records in Metis as of 06:48; facilities clearance and reopening not yet logged.",
    "- No confirmed safety failure reported; ceiling issue is precautionary pending inspection.",
    "- Do not state station is closed or trains affected.",
  ].join("\n");
}

const PASSENGER_V2_BODY = [
  "Bramley Junction station remains open via the side entrance. Trains are running as normal.",
  "The main entrance is temporarily unavailable while final checks are completed after overnight improvement works.",
  "We expect the main entrance to reopen around 08:00, subject to final confirmation.",
  "Staff are on site to help direct passengers.",
].join(" ");

const STAKEHOLDER_NOTE_BODY = [
  "Stakeholder note (draft)",
  "",
  "Bramley Junction remains open via the side entrance and trains are running as normal.",
  "The main entrance is temporarily unavailable following overnight improvement works. Facilities clearance has been recorded; reopening is expected around 08:00 subject to final checks.",
  "",
  "Mitigations",
  "- Additional staff/security at the side entrance and clear passenger lines in use.",
  "- Accessibility/wayfinding checks on temporary arrangements are in progress.",
].join("\n");

function executiveBriefV2Body(): string {
  return [
    "Executive brief — Bramley Junction update (V2)",
    "",
    "Current position",
    "- Main entrance reopened 08:12 after facilities clearance.",
    "- Side entrance remains available; passenger flow normalising.",
    "- Press/social position contained with corrective lines.",
    "",
    "What changed since V1",
    "- Facilities confirmed ceiling panels secure (SRC-011).",
    "- Main entrance reopened (SRC-013).",
    "- Passenger impact remained limited; queues manageable via side entrance.",
    "",
    "Customer impact",
    "- Morning peak confusion at main doors; no significant crowding reported after mitigations.",
    "",
    "Operational position",
    "- Remedial roof drain repair scheduled non-urgent.",
    "- Executive request for post-incident review received.",
    "",
    "Open questions",
    "- Accessibility signage improvements (action in progress).",
    "- Follow-up actions for future planned works handback (Q-007).",
    "",
    "Next actions",
    "- Complete post-incident review note.",
    "- Confirm circulation audit for governance record.",
  ].join("\n");
}

const POST_INCIDENT_BODY = [
  "Post-incident review note — Bramley Junction planned works handback (draft)",
  "",
  "Summary",
  "- Overnight planned works largely succeeded; main entrance handback delayed by ceiling panel sign-off and inspection.",
  "- Station remained open via side entrance; trains unaffected.",
  "- Reputation risk driven by ‘station shut’ confusion rather than service cancellation.",
  "",
  "Timeline",
  "- See linked incoming updates and outputs from 05:42 comms engagement through 08:12 reopening.",
  "",
  "What worked",
  "- Early NOC confirmation on trains.",
  "- Side entrance opening with security support.",
  "- Rapid passenger/social corrective lines.",
  "",
  "What caused confusion",
  "- Main entrance closure visible to passengers without clear alternate routing signage.",
  "- Social posts conflating entrance closure with whole-station closure.",
  "",
  "Recommended actions",
  "1. Pre-agree passenger messaging pack for planned works handback delays.",
  "2. Temporary signage standard for side-entrance-only access.",
  "3. Handback checklist requiring facilities sign-off before public reopening target.",
  "",
  "Owners",
  "- Station operations (handback criteria).",
  "- Corporate affairs (messaging pack).",
  "- Accessibility lead (signage standard).",
].join("\n");

const CIRCULATION_AUDIT_BODY = [
  "Circulation audit — governance record (Mon 09:00)",
  "",
  "Comms engagement",
  "- 05:42 Duty manager briefing to corporate affairs; Metis issue opened.",
  "- 05:50 Duty overnight pack logged in Metis (SRC-001–SRC-007 from duty handover).",
  "",
  "Outputs circulated / coordinated",
  "- 05:54 Staff holding update — station staff & customer service (after comms engagement).",
  "- 05:58 Passenger message — digital/PA (approved for use).",
  "- 05:52 Social response line — after social monitoring note (approved).",
  "- 06:18 Holding press line — after 06:08 press enquiry (approved for reporter window).",
  "- 06:48 Executive brief V1 — after 06:35 executive request.",
  "- 07:22 Updated passenger message — digital/PA.",
  "- 07:38 Stakeholder note — local authority & accessibility contacts.",
  "- 08:28 Executive brief V2 — senior leadership (supersedes V1 for position).",
  "- 08:45 Post-incident review note — operations & comms leadership (draft).",
  "",
  "Audit posture",
  "- All lines tied to sources recorded in Metis issue record.",
  "- V2 executive brief reflects reopening confirmation and facilities clearance.",
].join("\n");

export const bramleyOutputs: BramleyOutputExport[] = [
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.staffHolding,
    kind: "staff_holding_update",
    title: "Staff holding update",
    audience: "Station staff and customer service",
    intendedUse: "Internal holding line for colleagues while safety checks and reopening timing remain unconfirmed.",
    status: "Ready for review",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T05:54:00"),
    supersededBy: null,
    linkedSourceIds: [
      BRAMLEY_SOURCE_IDS.opsPlan,
      BRAMLEY_SOURCE_IDS.contractorNote,
      BRAMLEY_SOURCE_IDS.stationManagerEarly,
      BRAMLEY_SOURCE_IDS.networkOps,
    ],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c1, BRAMLEY_CLAIM_IDS.c3, BRAMLEY_CLAIM_IDS.c4, BRAMLEY_CLAIM_IDS.c5],
    body: STAFF_HOLDING_BODY,
    doNotSay: [
      "Do not say the station is closed.",
      "Do not confirm a structural failure or active roof leak.",
      "Do not give a main entrance reopening time yet.",
    ],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.staffHolding,
    metisBriefVersionId: null,
    templateId: "internal_staff_update",
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.passengerV1,
    kind: "passenger_message",
    title: "Passenger message draft",
    audience: "Passengers",
    intendedUse: "Short cautious passenger line for screens/PA/app while reopening time is not confirmed.",
    status: "Approved",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T05:58:00"),
    supersededBy: BRAMLEY_OUTPUT_IDS.passengerV2,
    linkedSourceIds: [BRAMLEY_SOURCE_IDS.stationManagerEarly, BRAMLEY_SOURCE_IDS.networkOps],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c4, BRAMLEY_CLAIM_IDS.c5],
    body: PASSENGER_V1_BODY,
    doNotSay: ["Do not say the station is shut.", "Do not imply train cancellations."],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.passengerV1,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.socialLine,
    kind: "social_response_line",
    title: "Social response line",
    audience: "Social media replies",
    intendedUse: "Reply line correcting ‘station shut’ claims without speculating on cause or timing.",
    status: "Approved",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T05:52:00"),
    supersededBy: null,
    linkedSourceIds: [BRAMLEY_SOURCE_IDS.socialSignal, BRAMLEY_SOURCE_IDS.networkOps, BRAMLEY_SOURCE_IDS.stationManagerEarly],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c7, BRAMLEY_CLAIM_IDS.c5, BRAMLEY_CLAIM_IDS.c4],
    body: SOCIAL_LINE_BODY,
    doNotSay: ["Do not engage with speculation about structural issues."],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.socialLine,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.pressLine,
    kind: "holding_press_line",
    title: "Holding press line",
    audience: "Local media",
    intendedUse: "Holding statement for press office response window; avoid committing a reopening time.",
    status: "Ready for review",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T06:18:00"),
    supersededBy: null,
    linkedSourceIds: [
      BRAMLEY_SOURCE_IDS.contractorNote,
      BRAMLEY_SOURCE_IDS.stationManagerEarly,
      BRAMLEY_SOURCE_IDS.networkOps,
      BRAMLEY_SOURCE_IDS.customerTeam,
      BRAMLEY_SOURCE_IDS.socialSignal,
      BRAMLEY_SOURCE_IDS.pressCall,
    ],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c3, BRAMLEY_CLAIM_IDS.c4, BRAMLEY_CLAIM_IDS.c5, BRAMLEY_CLAIM_IDS.c6, BRAMLEY_CLAIM_IDS.c7],
    body: PRESS_LINE_BODY,
    doNotSay: [
      "That the station is closed.",
      "That trains are cancelled or diverted.",
      "That there is a confirmed structural failure or active leak.",
      "A precise reopening time until station/facilities confirm.",
    ],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.pressLine,
    metisBriefVersionId: null,
    templateId: "media_holding_line",
    caveatsAtGeneration: [
      "Facilities inspection not yet complete — do not confirm ceiling safety or reopening time.",
      "Main entrance still closed at time of generation.",
    ],
  }),
  (() => {
    const o = baseOutput({
      id: BRAMLEY_OUTPUT_IDS.executiveV1,
      kind: "executive_brief",
      title: "Executive brief V1",
      audience: "Senior leadership",
      status: "Ready for review",
      versionNumber: 1,
      generatedAt: bramleyIso("2026-05-11T06:48:00"),
      supersededBy: BRAMLEY_OUTPUT_IDS.executiveV2,
      linkedSourceIds: [
        BRAMLEY_SOURCE_IDS.opsPlan,
        BRAMLEY_SOURCE_IDS.contractorNote,
        BRAMLEY_SOURCE_IDS.stationManagerEarly,
        BRAMLEY_SOURCE_IDS.networkOps,
        BRAMLEY_SOURCE_IDS.customerTeam,
        BRAMLEY_SOURCE_IDS.socialSignal,
        BRAMLEY_SOURCE_IDS.pressCall,
      ],
      linkedClaimIds: [
        BRAMLEY_CLAIM_IDS.c1,
        BRAMLEY_CLAIM_IDS.c2,
        BRAMLEY_CLAIM_IDS.c3,
        BRAMLEY_CLAIM_IDS.c4,
        BRAMLEY_CLAIM_IDS.c5,
        BRAMLEY_CLAIM_IDS.c6,
        BRAMLEY_CLAIM_IDS.c7,
      ],
      body: executiveBriefV1Body(),
      doNotSay: ["Do not state main entrance has reopened.", "Do not state facilities have cleared ceiling."],
      metisMessageVariantId: null,
      metisBriefVersionId: BRAMLEY_BRIEF_VERSION_IDS.executiveV1,
      templateId: null,
    });
    o.caveatsAtGeneration = [
      "Based on Metis records as of 06:48 only — excludes facilities clearance and reopening logged later.",
      "Overnight operational detail from duty pack logged in Metis after 05:42 comms engagement.",
      "Q-001 ceiling safety and Q-005 reopening time still open at generation.",
    ];
    o.notYetKnownRecordIds = [
      ...o.notYetKnownRecordIds,
      BRAMLEY_SOURCE_IDS.facilitiesNote,
      BRAMLEY_SOURCE_IDS.opsConfirmation,
      BRAMLEY_CLAIM_IDS.c8,
      BRAMLEY_CLAIM_IDS.c9,
    ].filter((id, i, arr) => arr.indexOf(id) === i);
    return o;
  })(),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.passengerV2,
    kind: "passenger_message",
    title: "Updated passenger message",
    audience: "Passengers",
    intendedUse: "Updated passenger line once facilities clearance is recorded; still caveated until reopening confirmed.",
    status: "Approved",
    versionNumber: 2,
    generatedAt: bramleyIso("2026-05-11T07:22:00"),
    supersededBy: null,
    linkedSourceIds: [BRAMLEY_SOURCE_IDS.facilitiesNote, BRAMLEY_SOURCE_IDS.stationManagerEarly, BRAMLEY_SOURCE_IDS.networkOps],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c8, BRAMLEY_CLAIM_IDS.c4, BRAMLEY_CLAIM_IDS.c5],
    body: PASSENGER_V2_BODY,
    doNotSay: ["Do not state the main entrance has already reopened (expected ~08:00, not confirmed open yet)."],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.passengerV2,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
    caveatsAtGeneration: ["Expected reopening around 08:00 — subject to final confirmation; not yet open at 07:22."],
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.stakeholderNote,
    kind: "stakeholder_note",
    title: "Councillor and stakeholder note",
    audience: "Local authority / accessibility / transport stakeholders",
    intendedUse: "Caveated stakeholder update for partners; avoid overclaiming accessibility assessment completion.",
    status: "Ready for review",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T07:38:00"),
    supersededBy: null,
    linkedSourceIds: [
      BRAMLEY_SOURCE_IDS.facilitiesNote,
      BRAMLEY_SOURCE_IDS.stationUpdateFlow,
      BRAMLEY_SOURCE_IDS.stationManagerEarly,
      BRAMLEY_SOURCE_IDS.pressCall,
    ],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c4, BRAMLEY_CLAIM_IDS.c8],
    caveatsAtGeneration: [
      "Accessibility formal assessment not yet in Metis at generation — wording treats accessibility as being checked.",
    ],
    body: STAKEHOLDER_NOTE_BODY,
    doNotSay: [
      "Do not state that an accessibility assessment is complete if temporary signage actions are still in progress.",
      "Do not speculate on causes beyond what facilities has confirmed.",
    ],
    metisMessageVariantId: BRAMLEY_MESSAGE_VARIANT_IDS.stakeholderNote,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.executiveV2,
    kind: "executive_brief",
    title: "Executive brief V2",
    audience: "Senior leadership",
    status: "Approved",
    versionNumber: 2,
    generatedAt: bramleyIso("2026-05-11T08:28:00"),
    supersededBy: null,
    linkedSourceIds: [
      BRAMLEY_SOURCE_IDS.facilitiesNote,
      BRAMLEY_SOURCE_IDS.opsConfirmation,
      BRAMLEY_SOURCE_IDS.stationUpdateFlow,
      BRAMLEY_SOURCE_IDS.socialSignal,
    ],
    linkedClaimIds: [BRAMLEY_CLAIM_IDS.c8, BRAMLEY_CLAIM_IDS.c9, BRAMLEY_CLAIM_IDS.c6, BRAMLEY_CLAIM_IDS.c7],
    body: executiveBriefV2Body(),
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: BRAMLEY_BRIEF_VERSION_IDS.executiveV2,
    templateId: null,
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.postIncident,
    kind: "post_incident_review",
    title: "Post-incident review note",
    audience: "Operations and comms leadership",
    status: "Draft",
    versionNumber: 1,
    generatedAt: bramleyIso("2026-05-11T08:45:00"),
    supersededBy: null,
    linkedSourceIds: [],
    linkedClaimIds: [],
    body: POST_INCIDENT_BODY,
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: BRAMLEY_BRIEF_VERSION_IDS.fullPostIncident,
    templateId: null,
  }),
  baseOutput({
    id: BRAMLEY_OUTPUT_IDS.circulationAudit,
    kind: "circulation_audit",
    title: "Circulation audit",
    audience: "Governance record",
    status: "Approved",
    versionNumber: null,
    generatedAt: bramleyIso("2026-05-11T09:00:00"),
    supersededBy: null,
    linkedSourceIds: [],
    linkedClaimIds: [],
    body: CIRCULATION_AUDIT_BODY,
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: null,
    templateId: null,
  }),
];
