import type { Issue, Source, Gap, InternalInput, IssueStakeholder, StakeholderGroup } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";

const CAP_EX_SOURCES = 8;
const CAP_EX_OPEN_GAPS = 8;
const CAP_EX_OBS = 5;
const CAP_EX_AUDIENCE = 5;
const CAP_FULL_GAPS = 20;
const CAP_FULL_SOURCES_NARRATIVE = 12;
const CAP_FULL_OBS = 20;

function nowLabel() {
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

/**
 * Splits a single block of "open questions" into discrete items for readability.
 * Conservative: if nothing clearly separates items, the original string is kept as one.
 */
function splitIntakeOpenQuestions(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.includes("\n")) {
    return t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }
  if (t.includes(";")) {
    const parts = t.split(";").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  if (t.includes("? ")) {
    return t
      .split(/\?\s+/)
      .map((p, i, arr) => {
        const piece = p.trim();
        if (!piece.length) return "";
        if (i < arr.length - 1) return piece.endsWith("?") ? piece : `${piece}?`;
        return piece;
      })
      .filter(Boolean);
  }
  return [t];
}

function intakeOpenQuestionsAsBulletLines(text: string): string {
  const t = cleanText(text);
  if (!t) return "";
  const parts = splitIntakeOpenQuestions(t);
  if (parts.length <= 1) return parts[0] ?? "";
  return parts.map((l) => `- ${l.replace(/^-+\s*/, "")}`).join("\n");
}

function capLines(s: string, maxLines: number) {
  const lines = s.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length <= maxLines) return s.trim();
  const head = lines.slice(0, maxLines);
  return `${head.join("\n")}\n\n…${lines.length - maxLines} more line(s) in the record; see full issue fields for the complete list.`;
}

export type BriefGenerationInput = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
  issueStakeholders: (IssueStakeholder & { stakeholderGroup: StakeholderGroup })[];
};

function openGaps(gaps: Gap[]) {
  return gaps.filter((g) => g.status === "Open");
}

function formatSourceForExecutive(s: Source) {
  const bit = [s.tier, s.linkedSection ?? "—", s.reliability ?? "reliability not set"].filter(Boolean).join(" · ");
  return `• ${s.title} — ${s.sourceCode} (${bit})`;
}

function formatGapsForExecutive(open: Gap[], cap: number) {
  if (!open.length) return "No open clarification gaps recorded in the tracker yet.";
  const slice = open.slice(0, cap);
  const lines = slice.map(
    (g) => `• [${g.severity}] ${g.prompt.trim() || g.title}${g.linkedSection ? ` — ${g.linkedSection}` : ""}`,
  );
  if (open.length > cap) {
    return `${lines.join("\n")}\n\n…${open.length - cap} additional open gap(s). See the gap ledger for the full list.`;
  }
  return lines.join("\n");
}

function formatGapsForFull(gaps: Gap[], cap: number) {
  if (!gaps.length) return "No clarification gaps recorded yet.";
  const slice = gaps.slice(0, cap);
  const lines = slice.map(
    (g) =>
      `- [${g.status}] [${g.severity}] ${g.prompt.trim() || g.title}${g.linkedSection ? ` · ${g.linkedSection}` : ""}`,
  );
  if (gaps.length > cap) {
    return `${lines.join("\n")}\n\n…${gaps.length - cap} more gap(s) in the tracker.`;
  }
  return lines.join("\n");
}

function formatObsForExecutive(inputs: InternalInput[], cap: number) {
  if (!inputs.length) return "No internal observations recorded yet.";
  const slice = inputs.slice(0, cap);
  const lines = slice.map(
    (i) => `• ${i.role} · ${i.name} (${i.confidence}): ${i.response.slice(0, 200)}${i.response.length > 200 ? "…" : ""}`,
  );
  if (inputs.length > cap) {
    return `${lines.join("\n")}\n\n…${inputs.length - cap} more observation(s). See the observations list for the full set.`;
  }
  return lines.join("\n");
}

function formatObsForFull(inputs: InternalInput[], cap: number) {
  if (!inputs.length) return "No internal observations recorded yet.";
  const slice = inputs.slice(0, cap);
  const lines = slice.map(
    (i) =>
      `- ${i.role} · ${i.name} · ${i.confidence}\n  ${i.linkedSection ? `Section: ${i.linkedSection} · ` : ""}${i.response}`,
  );
  if (inputs.length > cap) {
    return `${lines.join("\n\n")}\n\n…${inputs.length - cap} more observation(s) not shown here.`;
  }
  return lines.join("\n\n");
}

function formatAudienceImplications(
  issueAudience: string | null,
  rows: (IssueStakeholder & { stakeholderGroup: StakeholderGroup })[],
  cap: number,
  options?: { issueAudienceInBriefHeader: boolean },
) {
  const fromIssue = cleanText(issueAudience ?? "");
  const headerAudience = options?.issueAudienceInBriefHeader ?? false;
  const parts: string[] = [];

  if (fromIssue && !headerAudience) {
    parts.push(`Issue-level audience note (intake): ${fromIssue}`);
  }

  if (rows.length) {
    if (fromIssue && headerAudience) {
      parts.push("Stakeholder lens (the issue audience is listed in the brief header; detail by group):");
    }
    const slice = rows.slice(0, cap);
    for (const r of slice) {
      const g = r.stakeholderGroup.name;
      const line = [r.priority !== "Normal" ? `Priority: ${r.priority}` : null, cleanText(r.needsToKnow) ? `Need to know: ${r.needsToKnow.trim()}` : null, cleanText(r.issueRisk) ? `Risk: ${r.issueRisk.trim()}` : null, cleanText(r.channelGuidance) ? `Channels: ${r.channelGuidance.trim()}` : null]
        .filter(Boolean)
        .join(" · ");
      parts.push(`• ${g}: ${line || "No issue-specific output notes yet."}`);
    }
    if (rows.length > cap) {
      parts.push(`…${rows.length - cap} additional audience group(s) on this issue.`);
    }
  } else if (fromIssue && headerAudience) {
    parts.push("The issue audience is in the record header. No per-group audience notes are added yet; use the audience tool when you have lens-specific risks or needs.");
  } else if (!fromIssue) {
    parts.push("No audience-lens group selections and no issue-level audience note recorded yet.");
  }

  return parts.join("\n");
}

function evidenceBaseExecutive(sources: Source[], total: number) {
  if (!total) {
    return "No sources linked in Metis yet. Add sources to establish an evidence base.";
  }
  const lines = sources.slice(0, CAP_EX_SOURCES).map((s) => formatSourceForExecutive(s));
  const out = [`${total} source(s) on file.`, "", ...lines];
  if (total > CAP_EX_SOURCES) {
    out.push("");
    out.push(`…and ${total - CAP_EX_SOURCES} more (see the full issue brief and sources).`);
  }
  return out.join("\n");
}

function sourcesNarrativeFull(sources: Source[], total: number) {
  if (!total) return "No sources linked in Metis yet. Evidence should be added before broad external lines are taken as settled.";
  const slice = sources.slice(0, CAP_FULL_SOURCES_NARRATIVE);
  const lines = slice.map(
    (s) => `- ${s.sourceCode} — ${s.title} (${s.tier}${s.linkedSection ? `, ${s.linkedSection}` : ""})`,
  );
  if (total > slice.length) {
    lines.push(`…${total - slice.length} more source(s) in the register.`);
  }
  return lines.join("\n");
}

export function generateBriefFromIssue(input: BriefGenerationInput, _mode: BriefMode): BriefArtifact {
  const { issue, sources, gaps, internalInputs, issueStakeholders } = input;
  void _mode;
  const updatedAtLabel = nowLabel();
  const confidence = confidenceFromStatus(issue.status);

  const ledeBase = cleanText(issue.summary);
  const lede =
    ledeBase.length > 220 ? `${ledeBase.slice(0, 217).trimEnd()}…` : paragraphOrFallback(ledeBase, "No working line recorded yet.");

  const summary = cleanText(issue.summary);
  const titleLine = cleanText(issue.title);
  const confirmedFacts = cleanText(issue.confirmedFacts ?? "");
  const openQuestions = cleanText(issue.openQuestions ?? "");
  const context = cleanText(issue.context ?? "");

  const confirmedBlock = paragraphOrFallback(
    bulletsFromMultiline(confirmedFacts),
    "No confirmed facts recorded yet.",
  );
  const unknownsFromIntake = paragraphOrFallback(intakeOpenQuestionsAsBulletLines(openQuestions), "");

  const openG = openGaps(gaps);
  const keyUnknownsCombined = (() => {
    const a = cleanText(unknownsFromIntake) ? `From intake (open questions)\n${capLines(unknownsFromIntake, 14)}` : "";
    const b = openG.length
      ? `From clarification gap tracker (open)\n${formatGapsForExecutive(openG, CAP_EX_OPEN_GAPS)}`
      : "From clarification gap tracker: no open gaps recorded.";
    return [a, b].filter(Boolean).join("\n\n");
  })();

  const recommendedActions: string[] = (() => {
    const out: string[] = [];
    const oqItems = splitIntakeOpenQuestions(openQuestions);
    for (const g of openG.slice(0, 2)) {
      const label = (g.prompt || g.title).trim();
      if (label) {
        out.push(
          `Address open gap [${g.severity}] “${label}”${g.stakeholder ? ` (stakeholder: ${g.stakeholder})` : ""}${g.linkedSection ? ` — section: ${g.linkedSection}` : ""}.`,
        );
      }
    }
    if (sources.length) {
      const top = sources.slice(0, 2).map((s) => `${s.title} (${s.tier})`);
      out.push(
        `Cite the evidence base (${sources.length} on file), starting with: ${top.join("; ")}${sources.length > 2 ? " …" : "."}`,
      );
    } else {
      out.push("Link at least one source in Metis so leadership lines can be traced to an evidence item.");
    }
    if (cleanText(issue.ownerName ?? "")) {
      out.push(`Route the next update through the named owner: ${issue.ownerName}.`);
    } else {
      out.push("Assign a named issue owner in the record for cadence and sign-off.");
    }
    if (cleanText(issue.audience ?? "") && out.length < 5) {
      out.push(`Calibrate the line for the recorded audience: ${issue.audience?.trim()}.`);
    }
    if (out.length < 3 && oqItems.length) {
      out.push("Work through the open intake questions listed under Key unknowns before making firm external commitments.");
    }
    if (out.length < 2) {
      out.push("Confirm what is still under validation before broad or external circulation.");
    }
    return out.slice(0, 5);
  })();

  const recommendedBody = recommendedActions.map((x, i) => `${i + 1}) ${x}`).join("\n");

  const guardrails = [
    "Do not state causes, scope, or customer impact that are not supported by the confirmed facts, linked sources, or agreed observations above.",
    openG.length
      ? `There are ${openG.length} open gap(s) in the tracker; treat them as open until closed with an attributable observation.`
      : "If new unknowns appear, log them as gaps or intake questions before treating them as settled.",
    "Avoid speculative or inflammatory exposure language; align any external line with the audience notes and validation status.",
  ].join("\n\n");

  const situationBody = (() => {
    if (context.length) {
      return `Context from intake (the title and working line are in the brief header above):\n${capLines(context, 8)}`;
    }
    return "Title and working line are in the header. Add background in the issue’s context field when you need a stable narrative that does not fit in the working line alone.";
  })();

  const currentAssessment = [
    `Status: ${issue.status}`,
    `Severity: ${issue.severity}`,
    `Urgency / priority: ${issue.priority}`,
    `Operator posture: ${issue.operatorPosture}`,
    `Clarification gaps (count): ${issue.openGapsCount} (${openG.length} open in tracker)`,
    cleanText(issue.ownerName ?? "") ? `Owner: ${issue.ownerName}` : "Owner: not recorded yet.",
  ].join("\n");

  const audienceBlock = formatAudienceImplications(issue.audience, issueStakeholders, CAP_EX_AUDIENCE, {
    issueAudienceInBriefHeader: true,
  });

  const executiveBlocks: { label: string; body: string }[] = [
    { label: "Situation", body: situationBody },
    { label: "Current assessment", body: currentAssessment },
    { label: "Confirmed facts", body: confirmedBlock },
    { label: "Key unknowns / open gaps", body: keyUnknownsCombined },
    { label: "Evidence base", body: evidenceBaseExecutive(sources, sources.length) },
    { label: "Observations", body: formatObsForExecutive(internalInputs, CAP_EX_OBS) },
    { label: "Audience implications", body: audienceBlock },
    { label: "Recommended decisions / next actions", body: recommendedBody },
    { label: "What not to say yet / uncertainty guardrails", body: guardrails },
  ];

  const immediateActions = [
    "Check that the lede in the header still matches the issue record’s working line after the latest edits (or regenerate the brief if the record moved on).",
    `Gap counts: ${issue.openGapsCount} in the issue, ${openG.length} open in the tracker—resolve any mismatch in the gap view before a hard send.`,
    sources.length
      ? "If this brief is used for external or board use, re-open the two highest-signal sources (by tier and recency) for conflicts with the lede."
      : "If you plan to use this for external or board use, the evidence register is empty at generation time; add and review sources first.",
    `Observations: ${internalInputs.length} on file; skim the latest 1–2 for contradictions to the lede if time allows.`,
  ];

  const timelineBody =
    context.toLowerCase().includes("timeline") || openQuestions.toLowerCase().includes("when")
      ? "No structured chronology is recorded in Metis. Pull key times from the issue context, open questions, and sources, and add a dated line when they are agreed."
      : "No separate chronology section is in the issue record. When timing matters for leadership, add key timestamps to context and sources as they are confirmed.";

  const confirmedVsBody = `Confirmed (from intake)\n${confirmedBlock}\n\nUnclear / needs confirmation (from intake)\n${
    unknownsFromIntake || "No open questions recorded yet."
  }\n\nClarification gaps (from tracker)\n${formatGapsForFull(gaps, CAP_FULL_GAPS)}`;

  const narrativeBody = (() => {
    const a = context.length
      ? `Intake context\n${context}\n\nNarrative discipline (Metis)\n- Anchor updates on confirmed facts and linked sources.\n- Name unknowns; do not imply closure where gaps are open.`
      : "No intake context paragraph recorded yet.\n\nNarrative discipline (Metis)\n- Anchor updates on confirmed facts and linked sources.\n- Name unknowns; do not imply closure where gaps are open.";
    const b = formatAudienceImplications(issue.audience, issueStakeholders, 12, { issueAudienceInBriefHeader: true });
    const obsExcerpt = formatObsForFull(internalInputs, CAP_FULL_OBS);
    return `${a}\n\nAudience & lens (from issue and audience tool)\n${b}\n\n---\nAttributable observations (excerpt; ${internalInputs.length} on file)\n${obsExcerpt}\n\n---\nSources register (summary)\n${sourcesNarrativeFull(sources, sources.length)}`;
  })();

  const implicationsBody = (() => {
    if (openG.length && !confirmedFacts.length) {
      return "Implications (commercial, regulatory, reputational) are not yet fully supportable: confirmed facts are thin and open gaps are present. Treat downstream impacts as contingent until evidence and owners catch up.";
    }
    if (openG.length) {
      return `There are open clarification gaps. Leadership should assume downstream impacts, notifications, and messaging may still move as gaps close. Revisit when the gap register is clear or explicitly accepted as residual risk.`;
    }
    return "Implications should be revisited as sources are reviewed and the gap register changes. If no gaps remain and facts are current, consider implications in line with the audience notes.";
  })();

  const fullExecutiveSummary = [titleLine ? `Issue: ${titleLine}` : null, summary || "No working line recorded yet."].filter(Boolean).join("\n\n");

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
          body: fullExecutiveSummary,
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
          body: confirmedVsBody,
          confidence: openQuestions.length || openG.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "narrative-map",
          title: "Stakeholder narratives",
          body: narrativeBody,
          confidence: context.length || issueStakeholders.length || internalInputs.length ? "Likely" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "implications",
          title: "Implications",
          body: implicationsBody,
          confidence: openG.length && !confirmedFacts.length ? "Unclear" : confidence,
          updatedAtLabel,
          evidenceRefs: [],
        },
        {
          id: "recommended-actions",
          title: "Recommended actions",
          body: recommendedBody,
          confidence: "Likely",
          updatedAtLabel,
          evidenceRefs: [],
        },
      ],
    },
    executive: {
      blocks: executiveBlocks,
      immediateActions,
    },
  };

  return artifact;
}
