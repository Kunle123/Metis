import type { Issue } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";

function nowLabel() {
  // Display-only label aligned with Manus examples (e.g., "16:52 CET").
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} CET`;
}

function confidenceFromStatus(status: string) {
  const s = status.toLowerCase();
  if (s.includes("validation")) return "Needs validation" as const;
  if (s.includes("open gap")) return "Unclear" as const;
  if (s.includes("ready")) return "Likely" as const;
  return "Likely" as const;
}

export function generateBriefFromIssue(issue: Issue, mode: BriefMode): BriefArtifact {
  const updatedAtLabel = nowLabel();
  const confidence = confidenceFromStatus(issue.status);

  const lede =
    issue.summary.length > 220 ? `${issue.summary.slice(0, 217).trimEnd()}…` : issue.summary;

  const artifact: BriefArtifact = {
    lede,
    metadata: {
      audience: issue.audience ?? null,
      circulation: "Internal",
      lastRevisionLabel: updatedAtLabel,
      openGapsLabel: String(issue.openGapsCount),
    },
    full: {
      sections: [
        {
          id: "executive-summary",
          title: "Executive summary",
          body: issue.summary,
          confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "chronology",
          title: "Chronology",
          body:
            "Timeline is not yet captured in Sprint 1. Record key timestamps and operational milestones as they are confirmed.",
          confidence: "Unclear",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "confirmed-vs-unclear",
          title: "Confirmed vs unclear",
          body:
            "Confirmed: the core issue is active.\nUnclear: exposure, notification thresholds, and final narrative framing remain under validation.",
          confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "narrative-map",
          title: "Stakeholder narratives",
          body:
            "Internal narrative remains anchored on verified facts. External narrative pressure may evolve; capture themes only after evidence is reviewed.",
          confidence: "Likely",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "implications",
          title: "Implications",
          body:
            "Implications will be refined as validation completes. Avoid circulating unverified exposure language.",
          confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "recommended-actions",
          title: "Recommended actions",
          body:
            "1) Confirm what is known vs unverified.\n2) Align leadership phrasing for internal circulation.\n3) Set the next update cadence and owner.",
          confidence: "Likely",
          updatedAtLabel,
          evidenceRefs: [],
        },
      ],
    },
    executive: {
      blocks: [
        { label: "Situation", body: issue.summary },
        {
          label: "Current line",
          body: `Current status: ${issue.status}. Maintain conservative language until validation completes.`,
        },
        {
          label: "Unresolved",
          body:
            "Key unknowns remain. Do not elevate uncertain claims into circulation without review.",
        },
        {
          label: "Circulation status",
          body: "Internal circulation only in Sprint 1.",
        },
        {
          label: "Immediate actions",
          body: "Confirm facts, align leadership phrasing, and set the next update cadence.",
        },
      ],
      immediateActions: [
        "Approve conservative leadership wording for the next internal send.",
        "Confirm which facts are confirmed vs under validation.",
        "Set the next update cadence and owner.",
      ],
    },
  };

  // Mode does not change stored shape; it selects which part is rendered.
  void mode;
  return artifact;
}

