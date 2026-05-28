import { BriefArtifactSchema, type BriefArtifact } from "@metis/shared/briefVersion";

const SECTION_IDS = [
  "executive-summary",
  "chronology",
  "confirmed-vs-unclear",
  "narrative-map",
  "implications",
  "recommended-actions",
] as const;

const SECTION_TITLES: Record<(typeof SECTION_IDS)[number], string> = {
  "executive-summary": "Executive summary",
  chronology: "Chronology",
  "confirmed-vs-unclear": "Confirmed vs unclear",
  "narrative-map": "Narrative map",
  implications: "Implications",
  "recommended-actions": "Recommended actions",
};

export function buildNorthbankBriefArtifact(params: {
  lede: string;
  executiveSummary: string;
  openGapsLabel: string;
  lastRevisionLabel: string;
  assessmentLines: string[];
  confirmedFactsBullets: string[];
  openQuestionsBullets: string[];
  claimsAndAssumptionsBullets: string[];
  evidenceBaseBullets: string[];
  observationsBullets: string[];
  audienceImplicationsBullets: string[];
  recommendedActionsBullets: string[];
  guardrailsBullets: string[];
  whatChangedBullets?: string[];
}): BriefArtifact {
  const executiveSummaryBlock = params.executiveSummary.trim() || "Executive summary not recorded.";
  const confirmedFacts = params.confirmedFactsBullets.length
    ? params.confirmedFactsBullets.map((b) => `- ${b}`).join("\n")
    : "No confirmed facts recorded yet.";
  const openQuestions = params.openQuestionsBullets.length
    ? params.openQuestionsBullets.map((b) => `- ${b}`).join("\n")
    : "No open questions recorded yet.";
  const claimsAndAssumptions = params.claimsAndAssumptionsBullets.length
    ? params.claimsAndAssumptionsBullets.map((b) => `- ${b}`).join("\n")
    : "No claims or assumptions recorded yet.";
  const evidenceBase = params.evidenceBaseBullets.length
    ? params.evidenceBaseBullets.map((b) => `- ${b}`).join("\n")
    : "No sources are linked yet.";
  const observations = params.observationsBullets.length
    ? params.observationsBullets.map((b) => `- ${b}`).join("\n")
    : "No observations recorded yet.";
  const audience = params.audienceImplicationsBullets.length
    ? params.audienceImplicationsBullets.map((b) => `- ${b}`).join("\n")
    : "No audience implications recorded yet.";
  const decisions = params.recommendedActionsBullets.length
    ? params.recommendedActionsBullets.map((b, i) => `${i + 1}) ${b}`).join("\n")
    : "1) Maintain controlled launch readiness line; update as approvals land.";
  const guardrails = params.guardrailsBullets.length
    ? params.guardrailsBullets.map((b) => `- ${b}`).join("\n")
    : "Avoid campaign-style copy; keep claims conditional until approved.";
  const whatChanged = (params.whatChangedBullets ?? []).filter(Boolean).map((b) => `- ${b}`).join("\n");

  const fullSectionsById: Record<(typeof SECTION_IDS)[number], string> = {
    "executive-summary": executiveSummaryBlock,
    chronology: [
      "Point-in-time record (Metis timeline reference)",
      `- Last revision label: ${params.lastRevisionLabel}`,
      `- Open gaps label: ${params.openGapsLabel}`,
    ].join("\n"),
    "confirmed-vs-unclear": [
      "Confirmed facts",
      confirmedFacts,
      "",
      "Open questions / unresolved needs",
      openQuestions,
    ].join("\n"),
    "narrative-map": [
      "Audience implications",
      audience,
      "",
      "Claims and assumptions (register excerpt)",
      claimsAndAssumptions,
    ].join("\n"),
    implications: [
      "Evidence base",
      evidenceBase,
      "",
      "Observations",
      observations,
      "",
      "Guardrails / wording constraints",
      guardrails,
    ].join("\n"),
    "recommended-actions": decisions,
  };

  const artifact: BriefArtifact = {
    lede: params.lede,
    metadata: {
      audience: "Senior leadership",
      circulation: "Internal",
      lastRevisionLabel: params.lastRevisionLabel,
      openGapsLabel: params.openGapsLabel,
    },
    full: {
      sections: SECTION_IDS.map((id) => ({
        id,
        title: SECTION_TITLES[id],
        body: fullSectionsById[id],
        confidence: "Likely" as const,
        updatedAtLabel: params.lastRevisionLabel,
        evidenceRefs: [],
      })),
    },
    executive: {
      blocks: [
        { label: "Executive summary", body: executiveSummaryBlock },
        { label: "Current assessment", body: params.assessmentLines.join("\n") },
        ...(whatChanged.trim() ? [{ label: "What changed", body: whatChanged }] : []),
        { label: "Confirmed facts", body: confirmedFacts },
        { label: "Claims and assumptions", body: claimsAndAssumptions },
        { label: "Open questions and unresolved needs", body: openQuestions },
        { label: "Evidence base", body: evidenceBase },
        { label: "Observations", body: observations },
        { label: "Audience implications", body: audience },
        { label: "Recommended decisions / next actions", body: decisions },
        { label: "What not to say yet / uncertainty guardrails", body: guardrails },
      ],
      immediateActions: [],
    },
  };

  return BriefArtifactSchema.parse(artifact);
}
