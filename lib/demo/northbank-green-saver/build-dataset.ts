import { NORTHBANK_DEMO_SLUG, NORTHBANK_ISSUE_ID } from "./ids";
import { northbankIncomingUpdates } from "./incoming-inputs";
import { northbankClaims, northbankObservations, northbankOpenQuestions, northbankSources } from "./issue-record";
import { northbankOutputs } from "./outputs";
import { northbankCirculationEvents } from "./circulation";
import { buildNorthbankTimelineProjection } from "./timeline-projection";
import type { NorthbankDataset, NorthbankIssueExport } from "./types";
import { northbankIso } from "./timestamps";

const ISSUE_EXPORT_NOTE =
  "This is the final/current issue summary as of the end of the launch readiness window. It is not the point-in-time issue state used by earlier timeline cards or outputs — use each output's snapshot fields for historical views.";

export const northbankIssueExport: NorthbankIssueExport = {
  id: NORTHBANK_ISSUE_ID,
  slug: NORTHBANK_DEMO_SLUG,
  exportKind: "final_current_state",
  asOf: northbankIso("2026-06-19T11:15:00"),
  exportNote: ISSUE_EXPORT_NOTE,
  title: "Northbank Green Saver: product launch readiness",
  summary:
    "Northbank Building Society is preparing to launch Green Saver, a savings product linked to funding energy-efficient home improvements. Corporate Affairs maintained a two-week source-backed readiness record: pricing and digital dependencies were closed, go/no-go approved announcement, and approved message variants circulated with audit trail.",
  issueType: "Product launch readiness",
  severity: "Normal",
  status: "Ready for review",
  priority: "High",
  operatorPosture: "Monitoring",
  ownerName: "Launch Readiness Lead",
  audience:
    "Corporate Affairs, Product, Compliance, Legal, Digital, Customer Operations, Accessibility, Executive Office, Press Office",
  currentControlledPosition:
    "Green Saver launch approved for announcement; 4.25% gross/AER and eligibility wording approved; app release approved; post-launch 72-hour watchlist active.",
  confirmedFacts: [
    "- Green Saver planned for launch week commencing 22 June 2026.",
    "- Pricing committee approved 4.25% gross/AER for eligible customers.",
    "- App release approved; go/no-go confirmed announcement may proceed.",
    "- Environmental and eligibility caveats apply to all external lines.",
    "- Post-launch watchlist covers media, customer confusion, vulnerable customers and digital journey.",
  ].join("\n"),
  context: [
    "Fictional UK building society scenario for Metis demonstration — financial services / regulated launch readiness.",
    "Two working weeks of cross-functional inputs (product, pricing, compliance, legal, digital, operations, accessibility, media, executive).",
    "Metis used for claims discipline, open questions, executive brief versions, message variants, comparison and circulation audit — not campaign planning.",
    "No real organisation, product, customer or journalist names.",
  ].join("\n\n"),
  statusMilestones: [
    { at: northbankIso("2026-06-08T11:00:00"), label: "Launch readiness issue opened" },
    { at: northbankIso("2026-06-15T11:15:00"), label: "Executive readiness brief requested" },
    { at: northbankIso("2026-06-18T11:45:00"), label: "Pricing and eligibility approved" },
    { at: northbankIso("2026-06-19T09:00:00"), label: "Launch approved for announcement" },
    { at: northbankIso("2026-06-19T11:15:00"), label: "Circulation audit recorded" },
  ],
};

export function buildNorthbankDataset(): NorthbankDataset {
  return {
    issue: northbankIssueExport,
    incomingUpdates: northbankIncomingUpdates,
    sources: northbankSources,
    claims: northbankClaims,
    openQuestions: northbankOpenQuestions,
    observations: northbankObservations,
    outputs: northbankOutputs,
    circulationEvents: northbankCirculationEvents,
    timelineProjection: buildNorthbankTimelineProjection(),
  };
}
