import { z } from "zod";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const MAX_REWRITE_CHARS = 1200;

const BriefSynthesisResponseSchema = z.object({
  rewrites: z.object({
    full: z
      .object({
        "executive-summary": z.string().optional(),
      })
      .optional(),
  }),
  limitations: z.string().optional().default(""),
});

export type BriefSynthesisResponse = z.infer<typeof BriefSynthesisResponseSchema>;

function parseJsonObjectFromAssistantContent(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(unfenced) as unknown;
}

function collectAllowedNumberTokens(input: string) {
  const set = new Set<string>();
  const matches = input.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
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

function preservesUncertainty(output: string) {
  return /(open questions?|unclear|to be confirmed|not yet confirmed|pending|remains? open|still being confirmed|subject to change)/i.test(
    output,
  );
}

const SYSTEM = `You write leadership-ready briefing prose for a product called Metis.

Safety rules (must follow):
- Do not introduce facts, dates, names, numbers, commitments, causes, or impacts not present in the provided input.
- Do not answer open questions. Keep them explicitly open.
- Preserve uncertainty when open questions exist.
- Avoid incident/crisis language unless it appears in the provided input.
- Use plain UK English.
- Output JSON only. No markdown, no headings, no backticks.
- Do not mention that you are an AI or refer to models/prompting.`;

const USER_SCHEMA = `Return a single JSON object with exactly these keys:
- rewrites: { full: { "executive-summary": string } }
- limitations: string`;

export type BriefSynthesisInput = {
  issue: {
    title: string;
    summary: string;
    context: string;
    confirmedFacts: string;
    openQuestionsIntake: string[];
    audienceContextSummary: string;
  };
  topTrackerOpenQuestions: { severity?: string | null; linkedSection?: string | null; text: string }[];
  topSources: { sourceCode: string; tier: string; title: string; linkedSection?: string | null }[];
  topObservations: { role: string; name: string; confidence?: string | null; linkedSection?: string | null; response: string }[];
  deterministicExecutiveSummaryBody: string;
};

export async function synthesizeBriefExecutiveSummary(
  input: BriefSynthesisInput,
): Promise<{ rewrite: string; limitations: string } | null> {
  const enabled = process.env.BRIEF_AI_SYNTHESIS_ENABLED === "true";
  if (!enabled) return null;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

  const payload = JSON.stringify(input);
  const allowedNumbers = collectAllowedNumberTokens(payload);
  const hasOpenQuestions = input.issue.openQuestionsIntake.length > 0 || input.topTrackerOpenQuestions.length > 0;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${USER_SCHEMA}

Task:
Rewrite ONLY the Full brief executive summary body as a single concise paragraph (optionally 2 short paragraphs max). It must read like a leadership briefing note.

Constraints:
- Do not add any new facts. Use only what is present in the input JSON.
- Do not resolve or answer open questions.
- If open questions exist, include at least one explicit uncertainty marker (e.g. "open questions remain", "not yet confirmed", "subject to change").
- Keep it under ${MAX_REWRITE_CHARS} characters.

Input JSON:
${payload}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) return null;

  let parsed: unknown;
  try {
    parsed = parseJsonObjectFromAssistantContent(content);
  } catch {
    return null;
  }

  const safe = BriefSynthesisResponseSchema.safeParse(parsed);
  if (!safe.success) return null;

  const rewritten = safe.data.rewrites.full?.["executive-summary"]?.trim() ?? "";
  if (!rewritten) return null;
  if (rewritten.length > MAX_REWRITE_CHARS) return null;
  if (/^#{1,6}\s/m.test(rewritten)) return null;
  if (/\b(as an ai|as a language model)\b/i.test(rewritten)) return null;
  if (outputIntroducesNewNumbers(rewritten, allowedNumbers)) return null;
  if (hasOpenQuestions && !preservesUncertainty(rewritten)) return null;

  return { rewrite: rewritten, limitations: safe.data.limitations ?? "" };
}

