import { z } from "zod";

import type { MessageVariantArtifact, MessageVariantTemplateId } from "@metis/shared/messageVariant";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

const CleanupResponseSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
    }),
  ),
  notes: z.string().optional().default(""),
});

export type MessageDraftCleanupPayload = {
  templateId: MessageVariantTemplateId;
  templateLabel: string;
  audiencePathLabel: string;
  audienceOrgDefaultsHint: string | null;
  issue: {
    title: string;
    summary: string;
    context: string;
    confirmedFacts: string;
    openQuestionsSummary: string;
  };
  evidenceSummaryLines: string[];
  openIssuesSummaryLines: string[];
  sectionsDeterministic: { id: string; title: string; body: string }[];
};

/** Match any of these in combined section bodies ⇒ treat deterministic as carrying explicit uncertainty framing. */
export const UNCERTAINTY_SIGNAL_PATTERNS: readonly RegExp[] = [
  /\bopen questions?\b/i,
  /\bunanswered\b/i,
  /\bnot yet confirmed\b/i,
  /\byet to confirm\b/i,
  /\bcannot confirm\b/i,
  /\bcannot\s+(?:currently\s+)?be\s+confirmed\b/i,
  /\bstill\s+(being\s+)?\b(?:confirm(?:ed|ing)|check(?:ed|ing)|validat(?:ed|ing)|verif(?:ied|ying)|establish(?:ed|ing))\b/i,
  /\bstay(?:s)?\s+unclear\b/i,
  /\bremain(?:s)?\s+unclear\b/i,
  /\bcurrently unclear\b/i,
  /\bstill under review\b/i,
  /\bworking to confirm\b/i,
  /\bpending\b.{0,24}\b(?:confirm|verification|review)\b/i,
  /\bsubject to change\b/i,
  /\bto be confirmed\b/i,
  /\bwe(?:'|\s)a?re\s+still\s+(?:checking|confirming)\b/i,
  /\bis(?:n't|\snot)\s+(?:yet\s+)?known\b/i,
  /\bwhether\b.{0,40}\bis\s+still\b/i,
  /\bmay\b.{0,20}\bnot\b/i,
];

export function joinedDeterministicContainsUncertaintySignals(detJoined: string): boolean {
  return UNCERTAINTY_SIGNAL_PATTERNS.some((re) => re.test(detJoined));
}

/** If deterministic conveys explicit uncertainty/openness, polished must retain at least one recognised uncertainty signal (can be equivalent phrasing). */
export function polishedSatisfiesUncertaintyPreservation(detJoined: string, polishedJoined: string): boolean {
  if (!joinedDeterministicContainsUncertaintySignals(detJoined)) return true;
  return UNCERTAINTY_SIGNAL_PATTERNS.some((re) => re.test(polishedJoined));
}

function parseJsonObjectFromAssistantContent(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(unfenced) as unknown;
}

function collectAllowedNumberTokens(...inputs: string[]) {
  const set = new Set<string>();
  const combined = inputs.join("\n");
  const matches = combined.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  for (const m of matches) set.add(m);
  return set;
}

function outputIntroducesNewNumbers(output: string, allowed: Set<string>) {
  const matches = output.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  for (const m of matches) {
    if (!allowed.has(m)) return true;
  }
  return false;
}

const HASH_HEADING_REGEX = /^#{1,6}\s/im;

function normalizeForSimilarity(text: string) {
  return text
    .replaceAll("\\n", "\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function bigramSet(text: string) {
  const words = normalizeForSimilarity(text).split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    out.add(`${words[i]} ${words[i + 1]}`);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
}

/**
 * Lexical similarity guard: reject trivially micro-edited drafts (not substantive enough vs deterministic).
 * Slightly permissive versus earlier versions so valid editorial passes are not wrongly discarded after strong rewrites still share lexical overlap.
 */
export function rewriteIsTooMinorVsDeterministic(detJoined: string, polishedJoined: string, bigramRejectAbove = 0.993): boolean {
  const det = normalizeForSimilarity(detJoined);
  const pol = normalizeForSimilarity(polishedJoined);
  if (!det || !pol) return true;
  if (det === pol) return true;
  const sim = jaccard(bigramSet(det), bigramSet(pol));
  return sim > bigramRejectAbove;
}

/** Server-only: callers must gate on MESSAGES_AI_CLEANUP_ENABLED and OPENAI_API_KEY */
export async function cleanupMessageVariantsSections(
  input: MessageDraftCleanupPayload,
): Promise<{ sections: MessageVariantArtifact["sections"]; notes?: string } | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

  const payloadObj = {
    purpose: "alternate-editorial-polish constrained-to-deterministic-truth",
    templateId: input.templateId,
    templateLabel: input.templateLabel,
    audiencePathLabel: input.audiencePathLabel,
    audienceOrgDefaultsHint: input.audienceOrgDefaultsHint,
    issueSnapshot: input.issue,
    supportingContext: {
      evidenceSummaryLines: input.evidenceSummaryLines,
      openIssuesSummaryLines: input.openIssuesSummaryLines,
    },
    deterministicSectionsToPolishOnly: input.sectionsDeterministic.map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
    })),
  };

  const payload = JSON.stringify(payloadObj);
  const allowedNumbers = collectAllowedNumberTokens(
    payload,
    ...input.sectionsDeterministic.map((s) => s.body),
  );
  const detJoined = input.sectionsDeterministic.map((s) => s.body).join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.34,
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: [
            `You edit draft stakeholder communications written in plain UK English for Metis.`,
            `Produce an alternate wording draft: meaningfully rewritten for readability and audience fit while treating the deterministic version as factual source of truth.`,
            `Respond with valid JSON only, matching the user schema.`,
            "",
            `## Source of truth and comparison`,
            `- The deterministic section bodies supplied in JSON are authoritative for facts and intent.`,
            `- Your polished bodies are alternate wording only: communicate the same assertions, uncertainties, omissions, caveats, and limitations.`,
            `- If unsure whether an edit could change substantive meaning or confidence versus the deterministic text, keep the deterministic wording.`,
            `- Do NOT “improve” the story by sharpening claims, implying causes, implying timelines, implying fault, implying approval, resolving debate, filling gaps from general knowledge, or replacing hedged language with firm conclusions.`,
            "",
            `## Allowed edits (explicitly encouraged when they obey the forbidden list)`,
            `- Restructure sentences and paragraphs for clarity, flow, and executive-facing polish.`,
            `- Improve transitions; remove repetition within a section.`,
            `- Tighten or expand phrasing moderately when length changes do not imply new commitments or completeness.`,
            `- Replace awkward deterministic phrasing (template residue, redundancy, brittle lists) with natural communication copy.`,
            `- Sharpen tone for the declared template lane (external / staff / media) and audience path labels without altering purpose, channel suitability, audience, legal/compliance nuances, or what is asserted vs hypothetical.`,
            `- Reorder bullets or merge/split bullets when no new assertions appear and numbering-dependent meaning is unchanged.`,
            "",
            `## Forbidden edits`,
            `- Add ANY new facts: names, organisations, dates, quantities, durations, quotations, attributed statements, causal claims, contractual commitments, or legal conclusions.`,
            `- Introduce numeric tokens that do not appear in the supplied JSON payloads or deterministic bodies.`,
            `- Answer, pre-empt, or resolve ANY open clarification, unanswered question, or itemised tracker line implied or listed as open.`,
            `- Remove hedging or uncertainty cues that exist in deterministic copy; do not downgrade “might/may/could/likely/possible/unclear” into certainty.`,
            `- Soften risks or compliance-critical meaning (including making the organisation appear more decisive or uniformly positive than deterministic copy supports).`,
            `- Invent missing detail, causes, mitigation, timelines, remediation, stakeholder positions, regulator positions, verification status, severity, prevalence, percentages, geography, staffing, tooling, precedent, citations, URLs, slogans.`,
            `- Change section IDs, titles, count, order, or role of headings vs body.`,
            `- Add explanatory meta (“Here’s a cleaner version”), markdown fences (# unless already used in THAT section body), changelog, disclaimers referencing AI.`,
            `- Mention GPT, prompting, automation, artificial intelligence as the author.`,
            "",
            `## Preserve uncertainty explicitly`,
            `- Keep explicit equivalents of “not yet confirmed”, “still checking”, “open questions”, “remains unclear”, “subject to verification”, conditional modals conveying epistemic limits, etc.`,
            `- Do not turn interrogative open points into affirmative statements.`,
            `- If information is missing in deterministic wording, preserve the gap-framing rather than implying knowledge.`,
            "",
            `Editorial ethos: prefer a visibly improved draft—a reader should notice purposeful editing—not cosmetic comma tweaks alone.`,
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `Return JSON with exactly:`,
            `- sections: [{ id (must match deterministic id), body (polished) }, ...]; same ids and COUNT as deterministicSections`,
            `- notes?: short internal caveat if you withheld edits when uncertain (omit empty/noise)`,
            "",
            payload,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const raw = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = raw.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = parseJsonObjectFromAssistantContent(content);
  } catch {
    return null;
  }

  const safe = CleanupResponseSchema.safeParse(parsed);
  if (!safe.success) return null;

  if (safe.data.sections.length !== input.sectionsDeterministic.length) return null;
  if (new Set(safe.data.sections.map((s) => s.id)).size !== safe.data.sections.length) return null;

  const polishedById = new Map(safe.data.sections.map((s) => [s.id, s]));
  const idSetDeterministic = new Set(input.sectionsDeterministic.map((s) => s.id));
  if (safe.data.sections.some((s) => !idSetDeterministic.has(s.id))) return null;

  const merged: MessageVariantArtifact["sections"] = [];
  let polishedBodiesJoin = "";

  for (const det of input.sectionsDeterministic) {
    const got = polishedById.get(det.id);
    if (!got?.body.trim()) return null;
    if (HASH_HEADING_REGEX.test(got.body) && !HASH_HEADING_REGEX.test(det.body)) return null;

    merged.push({
      id: det.id,
      title: det.title,
      body: got.body.trim(),
    });
    polishedBodiesJoin += (polishedBodiesJoin ? "\n\n" : "") + got.body.trim();
  }

  if (polishedBodiesJoin.trim().length === 0) return null;

  const maxCombined = Math.round(detJoined.length * 1.85) + 720;
  if (polishedBodiesJoin.length > maxCombined) return null;

  if (outputIntroducesNewNumbers(polishedBodiesJoin, allowedNumbers)) return null;

  if (!polishedSatisfiesUncertaintyPreservation(detJoined, polishedBodiesJoin)) {
    return null;
  }

  if (rewriteIsTooMinorVsDeterministic(detJoined, polishedBodiesJoin)) return null;

  return { sections: merged, notes: safe.data.notes || undefined };
}
