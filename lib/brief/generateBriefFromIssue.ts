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

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function paragraphOrFallback(text: string, fallback: string) {
  return text.length ? text : fallback;
}

function bulletsFromMultiline(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  return lines.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
}

export function generateBriefFromIssue(issue: Issue, mode: BriefMode): BriefArtifact {
  const updatedAtLabel = nowLabel();
  const confidence = confidenceFromStatus(issue.status);

  const lede =
    issue.summary.length > 220 ? `${issue.summary.slice(0, 217).trimEnd()}…` : issue.summary;

  const summary = cleanText(issue.summary);
  const confirmedFacts = cleanText(issue.confirmedFacts ?? "");
  const openQuestions = cleanText(issue.openQuestions ?? "");
  const context = cleanText(issue.context ?? "");

  const confirmedBlock = paragraphOrFallback(
    bulletsFromMultiline(confirmedFacts),
    "No confirmed facts recorded yet.",
  );
  const unknownsBlock = paragraphOrFallback(
    bulletsFromMultiline(openQuestions),
    "No open questions recorded yet.",
  );

  const timelineBody = openQuestions.toLowerCase().includes("when") || openQuestions.toLowerCase().includes("timeline")
    ? "Timeline is not yet captured. Record key timestamps and milestones as they are confirmed.\n\nOpen questions indicate missing time anchors."
    : "Timeline is not yet captured. Record key timestamps and operational milestones as they are confirmed.";

  const recommendedActions = [
    "Confirm what is known vs under validation.",
    openQuestions.length ? "Resolve the open questions before broad circulation." : null,
    "Assign an owner and set the next update cadence.",
    "Link sources as evidence as they are reviewed.",
  ]
    .filter(Boolean)
    .map((x, i) => `${i + 1}) ${x}`)
    .join("\n");

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
          body: paragraphOrFallback(summary, "No working line recorded yet."),
          confidence: summary.length ? confidence : "Unclear",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "chronology",
          title: "Chronology",
          body: timelineBody,
          confidence: "Unclear",
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "confirmed-vs-unclear",
          title: "Confirmed vs unclear",
          body: `Confirmed\n${confirmedBlock}\n\nUnclear / needs confirmation\n${unknownsBlock}`,
          confidence: openQuestions.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "narrative-map",
          title: "Stakeholder narratives",
          body: paragraphOrFallback(
            context.length
              ? `Context (from intake)\n${context}\n\nNarrative discipline\n- Keep internal updates anchored on confirmed facts.\n- Treat unknowns as open questions until validated.\n- Avoid speculative exposure language in broad circulation.`
              : "Keep updates anchored on confirmed facts. Treat unknowns as open questions until validated. Avoid speculative exposure language in broad circulation.",
            "Keep updates anchored on confirmed facts.",
          ),
          confidence: context.length ? "Likely" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "implications",
          title: "Implications",
          body:
            openQuestions.length || !confirmedFacts.length
              ? "Implications are not yet fully supported by confirmed facts. Treat impacts, exposure, and notification thresholds as pending until validated."
              : "Implications should be revisited as evidence is reviewed and sources are linked.",
          confidence: openQuestions.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "recommended-actions",
          title: "Recommended actions",
          body: recommendedActions,
          confidence: "Likely",
          updatedAtLabel,
          evidenceRefs: [],
        },
      ],
    },
    executive: {
      blocks: [
        { label: "Situation", body: paragraphOrFallback(summary, "No working line recorded yet.") },
        {
          label: "Current line",
          body: `Current status: ${issue.status}. Severity: ${issue.severity}. Urgency: ${issue.priority}. Operator posture: ${issue.operatorPosture}.`,
        },
        {
          label: "Unresolved",
          body: unknownsBlock,
        },
        {
          label: "Circulation status",
          body: "Internal circulation only in Sprint 1.",
        },
        {
          label: "Immediate actions",
          body: recommendedActions,
        },
      ],
      immediateActions: [
        "Confirm what is known vs under validation.",
        openQuestions.length ? "Resolve the open questions before broad circulation." : "Link evidence sources as they are reviewed.",
        "Assign an owner and set the next update cadence.",
      ],
    },
  };

  // Mode does not change stored shape; it selects which part is rendered.
  void mode;
  return artifact;
}

