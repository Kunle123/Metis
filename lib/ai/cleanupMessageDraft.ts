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

/** Heuristic: deterministic copy often repeats uncertainty framing; insist it stays visible after polish when present upstream. */
const UNCERTAINTY_SNIPPET_REGEX =
  /\b(open questions?|cannot confirm yet|still (being )?confirmed|working to confirm|yet to confirm|remain(s)? unclear|still under review)\b/i;

function deterministicContainedUncertaintyBodies(bodiesJoin: string) {
  return UNCERTAINTY_SNIPPET_REGEX.test(bodiesJoin);
}

function polishedPreservesUncertaintyBodies(polishedJoin: string) {
  return UNCERTAINTY_SNIPPET_REGEX.test(polishedJoin);
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

function isNearIdentical(detJoined: string, polishedJoined: string) {
  const det = normalizeForSimilarity(detJoined);
  const pol = normalizeForSimilarity(polishedJoined);
  if (!det || !pol) return true;
  if (det === pol) return true;
  // Similarity heuristic: bigram Jaccard close to 1 means minimal editorial change.
  const sim = jaccard(bigramSet(det), bigramSet(pol));
  return sim > 0.975;
}

/** Server-only: callers must gate on MESSAGES_AI_CLEANUP_ENABLED and OPENAI_API_KEY */
export async function cleanupMessageVariantsSections(
  input: MessageDraftCleanupPayload,
): Promise<{ sections: MessageVariantArtifact["sections"]; notes?: string } | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

  const payloadObj = {
    purpose: "readability-polish-only",
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
      temperature: 0.25,
      max_tokens: 2800,
      messages: [
        {
          role: "system",
          content: [
            `You rewrite draft message copy for clarity, flow, and professionalism in plain UK English.`,
            `You must respond with valid JSON matching the user's schema.`,
            "",
            `Hard rules (violations invalidate output):`,
            `- Do NOT add facts, figures, organisations, people's names, dates, causes, impacts, timelines, commitments, or legal conclusions not already present.`,
            `- Do NOT remove or soften uncertainty / open-question acknowledgement when the deterministic section already conveys it.`,
            `- Do NOT answer or resolve itemised open clarifications.`,
            `- Do NOT change section IDs, section titles, or section order.`,
            `- You MAY rewrite sentence structure substantially within a section, reduce repetition, and tighten wording.`,
            `- You MAY reframe internal/product-like phrasing into audience-facing language appropriate to the template (external / staff / media).`,
            `- You MAY restructure bullets into fewer clearer bullets if it does not add commitments or new claims.`,
            `- Do NOT add markdown headings (#) unless headings already existed in that section.`,
            `- Do NOT mention AI, GPT, prompting, automation, Metis.`,
            `- Keep broadly similar combined length; moderate shortening is encouraged when it improves clarity.`,
            "",
            `Editorial intent (preferred when present):`,
            `- Remove robotic/internal phrasing and reduce repetition.`,
            `- Improve clarity of what is confirmed vs what remains open.`,
            `- Calm, professional tone; avoid incident/crisis phrasing unless present in input.`,
            "",
            `Examples of phrases to improve when present (without changing meaning):`,
            `- "Our team is actively working on this matter (current status: Active). Posture: Active."`,
            `- "No specific actions are recorded in the issue template yet."`,
            `- "Some operational details are still being confirmed."`,
            `- Repetitive "We are still working to..." bullets.`,
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `Return JSON with exactly:`,
            `- sections: [{ id (must match deterministic id), body (polished) }, ...]; same ids and COUNT as deterministicSections`,
            `- notes?: short internal caveat about what you avoided changing (avoid empty string noise)`,
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

  // Allow more meaningful rewrites while still preventing runaway expansion.
  const maxCombined = Math.round(detJoined.length * 1.8) + 600;
  if (polishedBodiesJoin.length > maxCombined) return null;

  if (outputIntroducesNewNumbers(polishedBodiesJoin, allowedNumbers)) return null;

  if (deterministicContainedUncertaintyBodies(detJoined) && !polishedPreservesUncertaintyBodies(polishedBodiesJoin)) {
    return null;
  }

  // If the model made only microscopic edits, treat as low-value (do not store as AI-enhanced).
  if (isNearIdentical(detJoined, polishedBodiesJoin)) return null;

  return { sections: merged, notes: safe.data.notes || undefined };
}
