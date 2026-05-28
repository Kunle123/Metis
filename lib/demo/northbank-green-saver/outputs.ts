import {
  NORTHBANK_BRIEF_VERSION_IDS,
  NORTHBANK_CLAIM_IDS,
  NORTHBANK_MESSAGE_VARIANT_IDS,
  NORTHBANK_OUTPUT_IDS,
  NORTHBANK_SOURCE_IDS,
} from "./ids";
import { northbankOpenQuestions } from "./issue-record";
import type { NorthbankOutputExport } from "./types";
import { northbankAt, northbankIso } from "./timestamps";
import { notYetKnown, snapshotAt } from "./snapshot";

function openQuestionLabelsAt(iso: string): string[] {
  const snap = snapshotAt(iso);
  const at = northbankAt(iso);
  return northbankOpenQuestions
    .filter((q) => snap.openQuestionIdsStillOpen.includes(q.id))
    .map((q) => {
      if (
        q.partiallyAnsweredAt &&
        northbankAt(q.partiallyAnsweredAt) <= at &&
        q.resolvedAt &&
        northbankAt(q.resolvedAt) > at
      ) {
        return `${q.gapCode}: ${q.title} (partially answered)`;
      }
      return `${q.gapCode}: ${q.title}`;
    });
}

function baseOutput(
  partial: Omit<
    NorthbankOutputExport,
    | "basedOnSnapshotAt"
    | "includedRecordIds"
    | "notYetKnownRecordIds"
    | "openQuestionsAtGeneration"
    | "caveatsAtGeneration"
  > & { generatedAt: string; caveatsAtGeneration?: string[] },
): NorthbankOutputExport {
  const { caveatsAtGeneration: callerCaveats, ...rest } = partial;
  const snap = snapshotAt(partial.generatedAt);
  const full = snapshotAt("2026-06-20T23:59:59");
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

const STAFF_V1_BODY = [
  "Internal staff message — Green Saver (V1)",
  "",
  "If asked by customers / colleagues",
  "- Northbank is preparing a new savings product called Green Saver linked to greener home improvements.",
  "- It is intended for eligible savings customers — not all customers.",
  "- We cannot confirm the launch rate, final eligibility wording or app availability yet.",
  "- Direct customers to our published channels once the announcement is authorised.",
  "",
  "Assisted digital",
  "- Include telephone and branch support routes; do not describe this as app-only.",
  "",
  "Do not say",
  "- Quote a launch rate.",
  "- That customers can apply today.",
].join("\n");

const CUSTOMER_V1_BODY = [
  "We’re preparing a new savings product called Green Saver.",
  "It will be available to eligible customers — we’ll confirm details closer to launch.",
  "We’ll share more information once plans are finalised.",
].join(" ");

const PRESS_HOLDING_BODY = [
  "Northbank Building Society is always reviewing its savings range for customers.",
  "We do not comment on speculation about future products or pricing.",
  "When we have something to announce we will inform customers and media through our usual channels.",
].join("\n");

function executiveBriefV1Body(): string {
  return [
    "Executive brief — Green Saver launch readiness (V1)",
    "",
    "Current position",
    "- Green Saver launch is targeted for the week commencing 22 June 2026, subject to dependencies.",
    "- Corporate Affairs is maintaining a source-backed readiness record in Metis.",
    "- Product story is positive but several approvals remain outstanding.",
    "",
    "What is confirmed",
    "- Launch scope and intended eligible customer group (SRC-001).",
    "- Proposed rate submitted — not committee-approved (SRC-002).",
    "- Compliance and legal caveats on eligibility and environmental wording (SRC-003, SRC-004).",
    "- Customer operations and accessibility requirements captured (SRC-005, SRC-006).",
    "- App release still a dependency (SRC-007).",
    "",
    "What is not yet confirmed",
    "- Formal pricing committee approval.",
    "- Final app release approval.",
    "- Go/no-go for announcement.",
    "",
    "Open questions",
    "- Pricing, eligibility wording, app release, customer ops line, assisted digital support.",
    "",
    "Caveats",
    "- Do not quote rate or state product is available until approvals recorded.",
    "- Environmental claims must avoid overclaiming (CLM-005).",
    "",
    "Decisions needed",
    "- Confirm pricing committee and digital approval timeline.",
    "- Agree announcement timing after dependencies close.",
    "",
    "Comms recommendation",
    "- Maintain internal and cautious customer holding lines.",
    "- Prepare executive update immediately after digital and pricing approvals.",
  ].join("\n");
}

function executiveBriefV2Body(): string {
  return [
    "Executive brief — Green Saver launch readiness (V2)",
    "",
    "Current position",
    "- Pricing committee has approved launch rate (4.25% gross/AER) and eligibility wording.",
    "- App release approved; launch steering group go/no-go expected before public announcement.",
    "- Customer-facing V2 and press posture may reference approved rate and app readiness; announcement still subject to steering group sign-off.",
    "",
    "What changed since V1",
    "- Digital approval recorded (SRC-010).",
    "- Pricing committee approval recorded (SRC-011).",
    "",
    "Customer and media",
    "- Trade press enquiry handled with holding line; customer V2 may now reference approved rate where appropriate.",
    "",
    "Open questions",
    "- Post-launch 72-hour watchlist (Q-007) remains active.",
    "",
    "Caveats",
    "- Use approved eligibility text only.",
    "- Environmental wording per legal caveats — no overclaiming.",
    "",
    "Decisions needed",
    "- Launch steering group go/no-go before announcement.",
    "",
    "Next actions",
    "- Prepare stakeholder message and final export after go/no-go.",
    "- Draft post-launch watchlist for first 72 hours.",
  ].join("\n");
}

const CUSTOMER_V2_BODY = [
  "Green Saver is a new savings product from Northbank Building Society, designed for eligible customers who want to save towards energy-efficient home improvements.",
  "The launch rate is 4.25% gross/AER for eligible balances within product limits, subject to our terms.",
  "Full eligibility details will be available at launch. Customers can apply via our app, online banking, branch or telephone service when the product is available.",
  "If you need support, telephone and branch routes are available.",
].join(" ");

const STAKEHOLDER_BODY = [
  "Stakeholder message — Green Saver launch (post go/no-go)",
  "",
  "Northbank Building Society is launching Green Saver, a savings product for eligible customers linked to saving towards energy-efficient home improvements.",
  "The launch rate is 4.25% gross/AER for eligible balances within published limits.",
  "Launch proceeds in line with the agreed window following steering group go/no-go.",
  "We will use careful, factual wording on the ‘green’ proposition and avoid overclaiming outcomes.",
  "We will monitor customer, media and digital journey feedback during the first 72 hours after announcement.",
].join("\n");

const WATCHLIST_BODY = [
  "Post-launch watchlist — Green Saver (first 72 hours)",
  "",
  "Purpose",
  "Leadership watchlist following go/no-go approval and announcement.",
  "",
  "Watch items",
  "1. Trade and consumer media pickup — accuracy of rate and eligibility reporting.",
  "2. Customer confusion — eligibility, environmental claims, or availability.",
  "3. Vulnerable customers and assisted digital — contact volumes and complaint themes.",
  "4. Digital journey — defects, drop-outs or accessibility barriers on app and web.",
  "",
  "Governance",
  "- Update Metis issue record as items are confirmed or closed.",
  "- Escalate material conduct or reputational issues to steering group.",
].join("\n");

const EXPORTED_BRIEF_BODY = [
  "Exported executive brief — Green Saver launch readiness (V2)",
  "",
  "This record represents the packaged HTML export of Executive Brief V2 circulated to the leadership distribution list.",
  "",
  "Export includes",
  "- Current position after pricing, digital and go/no-go approvals.",
  "- Approved caveats on eligibility and environmental claims.",
  "- Reference to circulated message variants and audit trail.",
  "",
  "Filename (demo): northbank-green-saver-executive-brief-v2.html",
].join("\n");

const CIRCULATION_AUDIT_BODY = [
  "Circulation audit — Green Saver launch readiness (Fri 19 Jun)",
  "",
  "Circulated / coordinated",
  "- Mon 15 Jun — Executive Brief V1 to leadership distribution (readiness pre-approval).",
  "- Wed 17 Jun — Press holding message variant after trade enquiry.",
  "- Thu 18 Jun — Executive Brief V2 after pricing and digital approvals.",
  "- Thu 18 Jun — Customer message variant V2.",
  "- Fri 19 Jun — Stakeholder message variant after go/no-go.",
  "- Fri 19 Jun — Exported executive brief V2 (HTML).",
  "- Fri 19 Jun — Post-launch watchlist brief.",
  "",
  "Audit posture",
  "- All outputs tied to sources in Metis issue record.",
  "- V2 executive brief supersedes V1 for external-facing leadership position.",
].join("\n");

export const northbankOutputs: NorthbankOutputExport[] = [
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.staffV1,
    kind: "staff_holding_update",
    title: "Internal staff message V1",
    audience: "Internal staff and customer-facing colleagues",
    intendedUse: "Internal safe line for colleagues while eligibility, pricing and app readiness are not yet fully approved.",
    status: "Ready for review",
    versionNumber: 1,
    generatedAt: northbankIso("2026-06-11T15:00:00"),
    supersededBy: null,
    linkedSourceIds: [
      NORTHBANK_SOURCE_IDS.productScope,
      NORTHBANK_SOURCE_IDS.complianceNote,
      NORTHBANK_SOURCE_IDS.legalNote,
      NORTHBANK_SOURCE_IDS.customerOps,
    ],
    linkedClaimIds: [
      NORTHBANK_CLAIM_IDS.c1,
      NORTHBANK_CLAIM_IDS.c2,
      NORTHBANK_CLAIM_IDS.c4,
      NORTHBANK_CLAIM_IDS.c5,
      NORTHBANK_CLAIM_IDS.c6,
    ],
    body: STAFF_V1_BODY,
    doNotSay: ["Do not quote 4.25% or any launch rate.", "Do not say customers can apply via the app yet."],
    metisMessageVariantId: NORTHBANK_MESSAGE_VARIANT_IDS.staffV1,
    metisBriefVersionId: null,
    templateId: "internal_staff_update",
    caveatsAtGeneration: ["Pricing committee and app release approvals not yet in Metis."],
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.customerV1,
    kind: "passenger_message",
    title: "Customer message variant V1",
    audience: "Customers",
    intendedUse: "Cautious customer-facing holding line suitable for ‘coming soon’ use before approvals land.",
    status: "Approved",
    versionNumber: 1,
    generatedAt: northbankIso("2026-06-11T12:00:00"),
    supersededBy: NORTHBANK_OUTPUT_IDS.customerV2,
    linkedSourceIds: [NORTHBANK_SOURCE_IDS.productScope, NORTHBANK_SOURCE_IDS.complianceNote, NORTHBANK_SOURCE_IDS.legalNote],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c1, NORTHBANK_CLAIM_IDS.c2, NORTHBANK_CLAIM_IDS.c4, NORTHBANK_CLAIM_IDS.c5],
    body: CUSTOMER_V1_BODY,
    doNotSay: ["Do not quote the launch rate.", "Do not say the product is available now."],
    metisMessageVariantId: NORTHBANK_MESSAGE_VARIANT_IDS.customerV1,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  (() => {
    const o = baseOutput({
      id: NORTHBANK_OUTPUT_IDS.executiveV1,
      kind: "executive_brief",
      title: "Executive brief V1",
      audience: "Senior leadership",
      status: "Ready for review",
      versionNumber: 1,
      generatedAt: northbankIso("2026-06-15T11:45:00"),
      supersededBy: NORTHBANK_OUTPUT_IDS.executiveV2,
      linkedSourceIds: [
        NORTHBANK_SOURCE_IDS.productScope,
        NORTHBANK_SOURCE_IDS.pricingUpdate,
        NORTHBANK_SOURCE_IDS.complianceNote,
        NORTHBANK_SOURCE_IDS.legalNote,
        NORTHBANK_SOURCE_IDS.customerOps,
        NORTHBANK_SOURCE_IDS.accessibilityReview,
        NORTHBANK_SOURCE_IDS.digitalReadiness,
      ],
      linkedClaimIds: [
        NORTHBANK_CLAIM_IDS.c1,
        NORTHBANK_CLAIM_IDS.c2,
        NORTHBANK_CLAIM_IDS.c3,
        NORTHBANK_CLAIM_IDS.c4,
        NORTHBANK_CLAIM_IDS.c5,
        NORTHBANK_CLAIM_IDS.c6,
        NORTHBANK_CLAIM_IDS.c7,
        NORTHBANK_CLAIM_IDS.c8,
      ],
      body: executiveBriefV1Body(),
      doNotSay: [
        "Do not state pricing committee approval.",
        "Do not state app release approval.",
        "Do not state launch is approved.",
      ],
      metisMessageVariantId: null,
      metisBriefVersionId: NORTHBANK_BRIEF_VERSION_IDS.executiveV1,
      templateId: null,
      caveatsAtGeneration: [
        "Excludes pricing committee approval, digital approval and go/no-go (Thu–Fri week 2).",
      ],
    });
    o.notYetKnownRecordIds = [
      ...o.notYetKnownRecordIds,
      NORTHBANK_SOURCE_IDS.digitalApproval,
      NORTHBANK_SOURCE_IDS.pricingApproval,
      NORTHBANK_SOURCE_IDS.goNoGo,
      NORTHBANK_CLAIM_IDS.c9,
      NORTHBANK_CLAIM_IDS.c10,
    ].filter((id, i, arr) => arr.indexOf(id) === i);
    return o;
  })(),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.pressHolding,
    kind: "holding_press_line",
    title: "Press holding message variant",
    audience: "Media / press office",
    intendedUse: "Holding line for trade journalist enquiry; do not announce product, rate or launch approval.",
    status: "Ready for review",
    versionNumber: 1,
    generatedAt: northbankIso("2026-06-17T10:00:00"),
    supersededBy: null,
    linkedSourceIds: [NORTHBANK_SOURCE_IDS.mediaEnquiry, NORTHBANK_SOURCE_IDS.legalNote, NORTHBANK_SOURCE_IDS.complianceNote],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c4, NORTHBANK_CLAIM_IDS.c5],
    body: PRESS_HOLDING_BODY,
    doNotSay: ["Do not confirm Green Saver launch.", "Do not quote rate or eligibility."],
    metisMessageVariantId: NORTHBANK_MESSAGE_VARIANT_IDS.pressHolding,
    metisBriefVersionId: null,
    templateId: "media_holding_line",
    caveatsAtGeneration: ["Go/no-go not recorded in Metis at generation — holding line only."],
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.executiveV2,
    kind: "executive_brief",
    title: "Executive brief V2",
    audience: "Senior leadership",
    status: "Approved",
    versionNumber: 2,
    generatedAt: northbankIso("2026-06-18T12:15:00"),
    supersededBy: null,
    linkedSourceIds: [
      NORTHBANK_SOURCE_IDS.productScope,
      NORTHBANK_SOURCE_IDS.pricingApproval,
      NORTHBANK_SOURCE_IDS.digitalApproval,
      NORTHBANK_SOURCE_IDS.mediaEnquiry,
    ],
    linkedClaimIds: [
      NORTHBANK_CLAIM_IDS.c1,
      NORTHBANK_CLAIM_IDS.c9,
      NORTHBANK_CLAIM_IDS.c8,
      NORTHBANK_CLAIM_IDS.c5,
    ],
    caveatsAtGeneration: ["Go/no-go decision not yet recorded in Metis at generation — announcement posture still conditional."],
    body: executiveBriefV2Body(),
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: NORTHBANK_BRIEF_VERSION_IDS.executiveV2,
    templateId: null,
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.customerV2,
    kind: "passenger_message",
    title: "Customer message variant V2",
    audience: "Customers",
    intendedUse: "Updated customer line once pricing and app approvals are recorded; still controlled, not campaign copy.",
    status: "Approved",
    versionNumber: 2,
    generatedAt: northbankIso("2026-06-18T13:00:00"),
    supersededBy: null,
    linkedSourceIds: [
      NORTHBANK_SOURCE_IDS.pricingApproval,
      NORTHBANK_SOURCE_IDS.digitalApproval,
      NORTHBANK_SOURCE_IDS.productScope,
      NORTHBANK_SOURCE_IDS.accessibilityReview,
    ],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c9, NORTHBANK_CLAIM_IDS.c8, NORTHBANK_CLAIM_IDS.c1, NORTHBANK_CLAIM_IDS.c7],
    body: CUSTOMER_V2_BODY,
    doNotSay: ["Do not imply regulatory endorsement of green outcomes."],
    metisMessageVariantId: NORTHBANK_MESSAGE_VARIANT_IDS.customerV2,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.stakeholderMsg,
    kind: "stakeholder_note",
    title: "Stakeholder message variant",
    audience: "Internal leadership and selected external stakeholders",
    intendedUse: "Stakeholder-ready message after go/no-go; short and factual for controlled sharing.",
    status: "Approved",
    versionNumber: 1,
    generatedAt: northbankIso("2026-06-19T09:30:00"),
    supersededBy: null,
    linkedSourceIds: [NORTHBANK_SOURCE_IDS.goNoGo, NORTHBANK_SOURCE_IDS.pricingApproval, NORTHBANK_SOURCE_IDS.productScope],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c10, NORTHBANK_CLAIM_IDS.c9, NORTHBANK_CLAIM_IDS.c1],
    body: STAKEHOLDER_BODY,
    doNotSay: [
      "Do not imply endorsement of individual suppliers or partners.",
      "Do not overclaim environmental outcomes; keep wording factual and caveated.",
    ],
    metisMessageVariantId: NORTHBANK_MESSAGE_VARIANT_IDS.stakeholder,
    metisBriefVersionId: null,
    templateId: "external_customer_resident_student",
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.watchlistBrief,
    kind: "executive_brief",
    title: "Post-launch watchlist brief",
    audience: "Corporate Affairs and leadership",
    status: "Ready for review",
    versionNumber: 3,
    generatedAt: northbankIso("2026-06-19T10:30:00"),
    supersededBy: null,
    linkedSourceIds: [NORTHBANK_SOURCE_IDS.goNoGo],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c10],
    body: WATCHLIST_BODY,
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: NORTHBANK_BRIEF_VERSION_IDS.watchlist,
    templateId: null,
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.exportedBrief,
    kind: "executive_brief",
    title: "Exported executive brief",
    audience: "Leadership circulation",
    status: "Approved",
    versionNumber: null,
    generatedAt: northbankIso("2026-06-19T11:00:00"),
    supersededBy: null,
    linkedSourceIds: [NORTHBANK_SOURCE_IDS.goNoGo, NORTHBANK_SOURCE_IDS.pricingApproval],
    linkedClaimIds: [NORTHBANK_CLAIM_IDS.c10, NORTHBANK_CLAIM_IDS.c9],
    body: EXPORTED_BRIEF_BODY,
    doNotSay: [],
    metisMessageVariantId: null,
    metisBriefVersionId: NORTHBANK_BRIEF_VERSION_IDS.executiveV2,
    templateId: null,
  }),
  baseOutput({
    id: NORTHBANK_OUTPUT_IDS.circulationAudit,
    kind: "circulation_audit",
    title: "Circulation audit",
    audience: "Governance record",
    status: "Approved",
    versionNumber: null,
    generatedAt: northbankIso("2026-06-19T11:15:00"),
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
