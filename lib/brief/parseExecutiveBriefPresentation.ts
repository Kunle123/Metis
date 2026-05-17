import type { BriefArtifact } from "@metis/shared/briefVersion";

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export type ExecutiveBriefDecision = {
  text: string;
  owner: string | null;
};

export type ExecutiveBriefLineItem = {
  code: string | null;
  text: string;
};

export type ExecutiveBriefClaimGroup = {
  id: "confirmed" | "assumptions" | "needsValidation";
  title: string;
  caveat?: string;
  items: ExecutiveBriefLineItem[];
};

export type ExecutiveBriefPresentationModel = {
  header: {
    title: string;
    status: string;
    severity: string;
    urgency: string;
    owner: string;
    briefingPosture: string;
    openQuestionsLabel: string;
    circulation: string;
    lastRevisionLabel: string;
    openGapsLabel: string;
  };
  position: {
    lede: string;
    executiveSummary: string;
    assessmentLines: string[];
    recordSufficiency: string | null;
  };
  claimsPositionSummary: string | null;
  decisions: ExecutiveBriefDecision[];
  whatChanged: string[];
  confirmedFacts: string[];
  claimGroups: ExecutiveBriefClaimGroup[];
  openQuestions: string[];
  safeToSay: string[];
  doNotSayYet: string[];
  evidenceSummary: string;
  observationsSummary: string;
  audienceImplications: string | null;
  /** Full block bodies for “View generated text” fallback */
  rawBlocks: { label: string; body: string }[];
  provenance: {
    sourcesCount: number | null;
    openQuestionsCount: number | null;
    observationsIncluded: number | null;
    observationsExcluded: number | null;
  };
};

function sanitizeDisplayText(input: string): string {
  return input.replace(UUID_RE, "…").replace(/\s+/g, " ").trim();
}

const CLAIM_CODE_RE = /^(CLM-\d+):\s*(.+)$/i;

export function parseExecutiveLineItem(raw: string): ExecutiveBriefLineItem {
  const cleaned = sanitizeDisplayText(raw);
  const m = cleaned.match(CLAIM_CODE_RE);
  if (m) return { code: m[1]!.toUpperCase(), text: sanitizeDisplayText(m[2]!) };
  return { code: null, text: cleaned };
}

function lineItemKey(item: ExecutiveBriefLineItem): string {
  return item.code ? item.code.toUpperCase() : item.text.toLowerCase();
}

function dedupeLineItems(items: ExecutiveBriefLineItem[]): ExecutiveBriefLineItem[] {
  const seen = new Set<string>();
  const out: ExecutiveBriefLineItem[] = [];
  for (const it of items) {
    const k = lineItemKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

export function slicePresentationItems<T>(items: T[], max = 5): { shown: T[]; remainder: number } {
  if (items.length <= max) return { shown: items, remainder: 0 };
  return { shown: items.slice(0, max), remainder: items.length - max };
}

function blocksByLabel(artifact: BriefArtifact): Map<string, string> {
  const m = new Map<string, string>();
  for (const b of artifact.executive.blocks) {
    m.set(b.label.trim(), b.body);
  }
  return m;
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => sanitizeDisplayText(p.replace(/\n/g, " ")))
    .filter(Boolean);
}

function splitBullets(body: string): string[] {
  const lines = body.split("\n");
  const items: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const joined = sanitizeDisplayText(buf.join(" "));
    if (joined) items.push(joined);
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      flush();
      items.push(sanitizeDisplayText(line.replace(/^[-*•]\s+/, "")));
    } else if (/^\d+\)\s+/.test(line)) {
      flush();
      items.push(sanitizeDisplayText(line.replace(/^\d+\)\s+/, "")));
    } else {
      buf.push(line);
    }
  }
  flush();
  return items;
}

function parseAssessmentKeyValues(body: string) {
  const out: Record<string, string> = {};
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) continue;
    out[m[1]!.trim().toLowerCase()] = sanitizeDisplayText(m[2]!);
  }
  return out;
}

function parseDecisions(body: string): ExecutiveBriefDecision[] {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const decisions: ExecutiveBriefDecision[] = [];
  for (const line of lines) {
    const numbered = line.match(/^\d+\)\s+(.+)$/);
    const text = sanitizeDisplayText(numbered ? numbered[1]! : line.replace(/^[-*•]\s+/, ""));
    if (!text) continue;
    const ownerMatch = text.match(/(?:owner|accountable owner)[:\s]+([^.]+)/i);
    decisions.push({
      text,
      owner: ownerMatch ? sanitizeDisplayText(ownerMatch[1]!) : null,
    });
  }
  return decisions.slice(0, 6);
}

function parseMarkdownClaimSections(body: string): ExecutiveBriefClaimGroup[] {
  const groups: ExecutiveBriefClaimGroup[] = [];
  let current: ExecutiveBriefClaimGroup | null = null;

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      if (current?.items.length) groups.push(current);
      const title = heading[1]!.trim();
      if (/confirmed claims/i.test(title)) {
        current = { id: "confirmed", title: "Confirmed claims (register)", items: [] };
      } else if (/assumptions/i.test(title)) {
        current = {
          id: "assumptions",
          title: "Claims and assumptions",
          caveat: "Phrase conditionally — not verified fact.",
          items: [],
        };
      } else if (/needs validation/i.test(title)) {
        current = {
          id: "needsValidation",
          title: "Needs validation",
          caveat: "Do not state as settled fact.",
          items: [],
        };
      } else {
        current = null;
      }
      continue;
    }
    if (!current) continue;
    if (!line) continue;
    if (line.startsWith("Use hedged") || line.startsWith("Treat these")) {
      if (!current.caveat) current.caveat = sanitizeDisplayText(line);
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      const item = sanitizeDisplayText(line.replace(/^[-*•]\s+/, "").replace(/^…/, ""));
      if (item && !item.startsWith("…")) current.items.push(parseExecutiveLineItem(item));
    }
  }
  if (current?.items.length) groups.push(current);
  return groups;
}

function classifyGuardrails(body: string): { safe: string[]; unsafe: string[] } {
  const unsafe: string[] = [];
  const safe: string[] = [];
  const isUnsafeLine = (line: string) => /^do not\b/i.test(line) || /\bdo not\b/i.test(line) || /^avoid\b/i.test(line);

  const lines = body.split("\n");
  let inDoNotSaySection = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^do not say yet:?\s*$/i.test(line)) {
      inDoNotSaySection = true;
      continue;
    }
    if (inDoNotSaySection) {
      if (!line) {
        inDoNotSaySection = false;
        continue;
      }
      if (/^[-*•]\s+/.test(line)) {
        unsafe.push(sanitizeDisplayText(line.replace(/^[-*•]\s+/, "")));
        continue;
      }
      if (/^do not\b/i.test(line)) {
        unsafe.push(sanitizeDisplayText(line));
        continue;
      }
      inDoNotSaySection = false;
    }
  }

  for (const p of splitParagraphs(body)) {
    if (isUnsafeLine(p)) unsafe.push(p);
    else if (p.length) safe.push(p);
  }
  for (const b of splitBullets(body)) {
    if (isUnsafeLine(b)) unsafe.push(b);
    else if (b.length) safe.push(b);
  }
  return {
    safe: [...new Set(safe)],
    unsafe: [...new Set(unsafe)],
  };
}

function parseClaimsPositionSummary(claimsBody: string): string | null {
  const first = claimsBody.split("\n").map((l) => l.trim()).find(Boolean);
  if (!first || !/^claims position:/i.test(first)) return null;
  return sanitizeDisplayText(first);
}

function stripClaimsPositionFromBody(claimsBody: string): string {
  const lines = claimsBody.split("\n");
  if (lines[0]?.trim().match(/^claims position:/i)) {
    let i = 1;
    while (i < lines.length && !lines[i]!.trim()) i += 1;
    return lines.slice(i).join("\n");
  }
  return claimsBody;
}

function parseObservationCounts(body: string): { included: number | null; excluded: number | null } {
  let included: number | null = null;
  let excluded: number | null = null;
  const inc = body.match(/(\d+)\s+observation[s]?\s+(?:are\s+)?included/i);
  if (inc) included = Number(inc[1]);
  const ex = body.match(/(\d+)\s+observation[s]?\s+(?:is|are)\s+excluded/i);
  if (ex) excluded = Number(ex[1]);
  const exAlt = body.match(/excluded from brief output[^.]*?(\d+)\s+observation/i);
  if (exAlt && excluded == null) excluded = Number(exAlt[1]);
  return { included, excluded };
}

function parseSourceCountFromEvidence(body: string): number | null {
  const m = body.match(/(\d+)\s+linked\s+(?:source|record)/i) ?? body.match(/evidence base is\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

function extractOpenQuestionCount(label: string): number | null {
  const m = label.match(/(\d+)\s+on the issue record/i) ?? label.match(/(\d+)\s+open/i);
  return m ? Number(m[1]) : null;
}

const BLOCK = {
  executiveSummary: "Executive summary",
  currentAssessment: "Current assessment",
  recordSufficiency: "Record sufficiency",
  confirmedFacts: "Confirmed facts",
  claims: "Claims and assumptions",
  openQuestions: "Open questions and unresolved needs",
  evidence: "Evidence base",
  observations: "Observations",
  audience: "Audience implications",
  decisions: "Recommended decisions / next actions",
  guardrails: "What not to say yet / uncertainty guardrails",
  whatChanged: "What changed",
} as const;

export type ParseExecutiveBriefPresentationInput = {
  artifact: BriefArtifact;
  issueTitle: string;
  /** Optional substantive change lines (e.g. from activity since last revision). */
  changeHighlights?: string[];
  sourcesCount?: number;
};

export function parseExecutiveBriefPresentation(input: ParseExecutiveBriefPresentationInput): ExecutiveBriefPresentationModel {
  const { artifact, issueTitle, changeHighlights = [], sourcesCount } = input;
  const map = blocksByLabel(artifact);
  const assessment = parseAssessmentKeyValues(map.get(BLOCK.currentAssessment) ?? "");
  const statusRaw = assessment.status ?? "—";
  const status =
    statusRaw === "Ready for internal briefing with caveats" ? statusRaw : sanitizeDisplayText(statusRaw);

  const confirmedBody = map.get(BLOCK.confirmedFacts) ?? "";
  const confirmedBullets = splitBullets(confirmedBody);
  const confirmedParagraphs = splitParagraphs(confirmedBody).filter((p) => !confirmedBullets.includes(p));

  const claimsBodyRaw = map.get(BLOCK.claims) ?? "";
  const claimsPositionSummary = claimsBodyRaw.trim() ? parseClaimsPositionSummary(claimsBodyRaw) : null;
  const claimsBody = claimsBodyRaw.trim() ? stripClaimsPositionFromBody(claimsBodyRaw) : "";
  const claimGroups = claimsBody.trim() ? parseMarkdownClaimSections(claimsBody) : [];
  const recordSufficiencyBody = map.get(BLOCK.recordSufficiency) ?? "";
  const recordSufficiency = recordSufficiencyBody.trim()
    ? splitParagraphs(recordSufficiencyBody).join("\n\n") || sanitizeDisplayText(recordSufficiencyBody)
    : null;

  const guardrailsBody = map.get(BLOCK.guardrails) ?? "";
  const { safe: guardrailSafe, unsafe } = classifyGuardrails(guardrailsBody);

  const confirmedClaimItems = dedupeLineItems(claimGroups.filter((g) => g.id === "confirmed").flatMap((g) => g.items));
  const assumptionItems = dedupeLineItems(claimGroups.filter((g) => g.id === "assumptions").flatMap((g) => g.items));
  const needsValidationItems = dedupeLineItems(
    claimGroups.filter((g) => g.id === "needsValidation").flatMap((g) => g.items),
  );
  const nonConfirmedClaimKeys = new Set([
    ...assumptionItems.map(lineItemKey),
    ...needsValidationItems.map(lineItemKey),
  ]);
  const confirmedClaimKeys = new Set(confirmedClaimItems.map(lineItemKey));

  const safeToSayRaw = [
    ...confirmedBullets.filter((b) => !/^no confirmed facts/i.test(b)),
    ...guardrailSafe,
  ].filter(Boolean);

  const safeToSay = safeToSayRaw.filter((line) => {
    const parsed = parseExecutiveLineItem(line);
    if (parsed.code && nonConfirmedClaimKeys.has(lineItemKey(parsed))) return false;
    if (parsed.code && confirmedClaimKeys.has(lineItemKey(parsed))) return false;
    return true;
  });

  const doNotSayYet = [
    ...unsafe,
    ...needsValidationItems.map((it) => (it.code ? `${it.code}: ${it.text}` : it.text)),
  ].filter(Boolean);

  const openQuestions = splitBullets(map.get(BLOCK.openQuestions) ?? "");
  const openParagraphs = splitParagraphs(map.get(BLOCK.openQuestions) ?? "").filter(
    (p) => !openQuestions.includes(p) && !/^see the open questions/i.test(p),
  );

  const whatChangedBlock = map.get(BLOCK.whatChanged);
  const whatChanged = [
    ...changeHighlights.map(sanitizeDisplayText).filter(Boolean),
    ...(whatChangedBlock?.trim() ? splitBullets(whatChangedBlock) : []),
  ].slice(0, 8);

  const evidenceBody = map.get(BLOCK.evidence) ?? "";
  const observationsBody = map.get(BLOCK.observations) ?? "";
  const obsCounts = parseObservationCounts(observationsBody);

  const decisions = parseDecisions(map.get(BLOCK.decisions) ?? "");

  const assessmentLines = Object.entries(assessment)
    .filter(([k]) => !["status", "severity", "urgency"].includes(k))
    .map(([k, v]) => {
      const label =
        k === "briefing posture"
          ? "Briefing posture"
          : k === "open questions"
            ? "Open questions"
            : k === "issue owner"
              ? "Issue owner"
              : k.charAt(0).toUpperCase() + k.slice(1);
      return `${label}: ${v}`;
    });

  return {
    header: {
      title: sanitizeDisplayText(issueTitle),
      status,
      severity: assessment.severity ?? "—",
      urgency: assessment.urgency ?? "—",
      owner: assessment["issue owner"]?.replace(/not recorded yet\.?/i, "Owner not assigned") ?? "Owner not assigned",
      briefingPosture: assessment["briefing posture"] ?? "—",
      openQuestionsLabel: assessment["open questions"] ?? artifact.metadata.openGapsLabel,
      circulation: artifact.metadata.circulation,
      lastRevisionLabel: artifact.metadata.lastRevisionLabel,
      openGapsLabel: artifact.metadata.openGapsLabel,
    },
    position: {
      lede: sanitizeDisplayText(artifact.lede),
      executiveSummary: map.get(BLOCK.executiveSummary) ?? "",
      assessmentLines,
      recordSufficiency,
    },
    claimsPositionSummary,
    decisions: decisions.map((d) => ({
      ...d,
      owner: d.owner ?? (assessment["issue owner"] && !/not recorded/i.test(assessment["issue owner"]) ? assessment["issue owner"] : null),
    })),
    whatChanged,
    confirmedFacts: [...confirmedBullets, ...confirmedParagraphs].filter(Boolean),
    claimGroups,
    openQuestions: [...openQuestions, ...openParagraphs].filter(Boolean),
    safeToSay: [...new Set(safeToSay)].slice(0, 12),
    doNotSayYet: [...new Set(doNotSayYet)].slice(0, 12),
    evidenceSummary: evidenceBody.trim(),
    observationsSummary: observationsBody.trim(),
    audienceImplications: map.get(BLOCK.audience)?.trim() || null,
    rawBlocks: artifact.executive.blocks.map((b) => ({
      label: b.label,
      body: b.body.replace(UUID_RE, "…"),
    })),
    provenance: {
      sourcesCount: sourcesCount ?? parseSourceCountFromEvidence(evidenceBody),
      openQuestionsCount: extractOpenQuestionCount(assessment["open questions"] ?? artifact.metadata.openGapsLabel),
      observationsIncluded: obsCounts.included,
      observationsExcluded: obsCounts.excluded,
    },
  };
}
