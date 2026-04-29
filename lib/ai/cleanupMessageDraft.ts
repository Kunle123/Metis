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
            `You polish external/internal/media draft message copy for clarity and readability in plain UK English only.`,
            `You must respond with valid JSON matching the user's schema.`,
            "",
            `Hard rules (violations invalidate output):`,
            `- Do NOT add facts, figures, organisations, people's names, dates, causes, impacts, timelines, commitments, or legal conclusions not already present.`,
            `- Do NOT remove or soften uncertainty / open-question acknowledgement when the deterministic section already conveys it.`,
            `- Do NOT answer or resolve itemised open clarifications.`,
            `- Do NOT change the organisational purpose of any section title or reorder sections.`,
            `- Preserve bullet structure where the deterministic body clearly uses bullets; do not invent lists that read as commitments.`,
            `- Do NOT add markdown headings (#) unless headings already existed in that section.`,
            `- Do NOT mention AI, GPT, prompting, automation, Metis.`,
            `- Keep broadly similar combined length (+/- a small margin): do not bloat.`,
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

  const maxCombined = Math.round(detJoined.length * 1.45) + 400;
  if (polishedBodiesJoin.length > maxCombined + 600) return null;

  if (outputIntroducesNewNumbers(polishedBodiesJoin, allowedNumbers)) return null;

  if (deterministicContainedUncertaintyBodies(detJoined) && !polishedPreservesUncertaintyBodies(polishedBodiesJoin)) {
    return null;
  }

  return { sections: merged, notes: safe.data.notes || undefined };
}
