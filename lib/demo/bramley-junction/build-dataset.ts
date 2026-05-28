import { BRAMLEY_DEMO_SLUG, BRAMLEY_ISSUE_ID } from "./ids";
import { bramleyIncomingUpdates } from "./incoming-inputs";
import { bramleyClaims, bramleyObservations, bramleyOpenQuestions, bramleySources } from "./issue-record";
import { bramleyOutputs } from "./outputs";
import { bramleyCirculationEvents } from "./circulation";
import { buildBramleyTimelineProjection } from "./timeline-projection";
import type { BramleyDataset, BramleyIssueExport } from "./types";
import { bramleyIso } from "./timestamps";

const CURRENT_POSITION =
  "Main entrance reopened 08:12; side entrance remains available; trains running; passenger flow normalising; post-incident review in progress.";

const ISSUE_EXPORT_NOTE =
  "Final/current issue summary as of end of demo window. Not the point-in-time issue state for earlier timeline cards or outputs — use each output's snapshot fields and linked records for historical views.";

export const bramleyIssueExport: BramleyIssueExport = {
  id: BRAMLEY_ISSUE_ID,
  slug: BRAMLEY_DEMO_SLUG,
  exportKind: "final_current_state",
  asOf: bramleyIso("2026-05-11T09:00:00"),
  exportNote: ISSUE_EXPORT_NOTE,
  title: "Bramley Junction: main entrance reopening delay",
  summary:
    "Planned overnight works at Bramley Junction delayed main entrance reopening after contractor handback sign-off on ceiling panels. Station remained open via side entrance; trains continued to call; passenger and social confusion managed with coordinated lines. Main entrance reopened 08:12; post-incident review underway.",
  issueType: "Planned works handback delay",
  severity: "Important",
  status: "Ready for review",
  priority: "High",
  operatorPosture: "Active",
  ownerName: "Duty Station Support",
  audience: "Station operations, customer service, corporate affairs, regional leadership",
  currentControlledPosition: CURRENT_POSITION,
  confirmedFacts: [
    "- Planned overnight works scheduled with 05:30 handback target.",
    "- Main entrance opening delayed pending ceiling panel inspection.",
    "- Station remained open via side entrance with additional staffing.",
    "- Train services continued to call (NOC confirmed).",
    "- Main entrance reopened 08:12 after facilities clearance.",
  ].join("\n"),
  context: [
    "Fictional UK rail operator scenario for demonstration.",
    "Fixed timeline: Sunday planned works notice; Monday handback day (May 2026).",
    "Overnight operational events were handled by station, contractor, security and NOC channels first.",
    "Corporate affairs engaged from ~05:42 when duty management briefed comms; the duty overnight pack was logged in Metis at 05:50 as source-backed records.",
    "No real organisation, passenger, or journalist names.",
  ].join("\n\n"),
  statusMilestones: [
    { at: bramleyIso("2026-05-11T05:42:00"), label: "Comms engaged — issue opened in Metis" },
    { at: bramleyIso("2026-05-11T05:48:00"), label: "Managed operational disruption" },
    { at: bramleyIso("2026-05-11T07:12:00"), label: "Reopening expected shortly" },
    { at: bramleyIso("2026-05-11T08:12:00"), label: "Operational disruption closed" },
    { at: bramleyIso("2026-05-11T09:00:00"), label: "Review / audit stage" },
  ],
};

export function buildBramleyDataset(): BramleyDataset {
  return {
    issue: bramleyIssueExport,
    incomingUpdates: bramleyIncomingUpdates,
    sources: bramleySources,
    claims: bramleyClaims,
    openQuestions: bramleyOpenQuestions,
    observations: bramleyObservations,
    outputs: bramleyOutputs,
    circulationEvents: bramleyCirculationEvents,
    timelineProjection: buildBramleyTimelineProjection(),
  };
}
