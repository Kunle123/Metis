import { z } from "zod";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const MAX_REWRITE_CHARS = 1200;

const BriefSynthesisResponseV1Schema = z.object({
  rewrites: z.object({
    full: z
      .object({
        "executive-summary": z.string().optional(),
      })
      .optional(),
  }),
  limitations: z.string().optional().default(""),
});

const BriefSynthesisResponseV2Schema = z.object({
  rewrite: z.string().optional(),
  limitations: z.string().optional().default(""),
});

type ParsedRewrite = { rewrite: string; limitations: string };

function parseRewritePayload(input: unknown): ParsedRewrite | null {
  const v2 = BriefSynthesisResponseV2Schema.safeParse(input);
  if (v2.success) {
    const rewrite = (v2.data.rewrite ?? "").trim();
    return { rewrite, limitations: v2.data.limitations ?? "" };
  }

  const v1 = BriefSynthesisResponseV1Schema.safeParse(input);
  if (v1.success) {
    const rewrite = (v1.data.rewrites.full?.["executive-summary"] ?? "").trim();
    return { rewrite, limitations: v1.data.limitations ?? "" };
  }

  return null;
}

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

const MIN_POLISHED_SAVE_CHARS = 20;

/**
 * Same safety bar as model output, for persisting user-approved polished text on save.
 * `input` must use the current deterministic executive summary body in `deterministicExecutiveSummaryBody`.
 */
export function evaluateExecutivePolishedBodyForSave(
  input: BriefSynthesisInput,
  polishedBody: string,
): { ok: true } | { ok: false; message: string } {
  const trimmed = polishedBody.trim();
  if (trimmed.length < MIN_POLISHED_SAVE_CHARS) {
    return { ok: false, message: "Polished wording is empty or too short to save." };
  }

  const payload = JSON.stringify(input);
  const allowedNumbers = collectAllowedNumberTokens(payload);
  const hasOpenQuestions =
    input.issue.openQuestionsIntake.length > 0 ||
    input.topTrackerOpenQuestions.length > 0 ||
    (input.claims?.needsValidation?.length ?? 0) > 0;

  if (
    !isBriefExecutiveSummaryRewriteSafe({
      rewritten: trimmed,
      allowedNumbers,
      hasOpenQuestions,
      maxChars: MAX_REWRITE_CHARS,
    })
  ) {
    return { ok: false, message: "Polished wording did not pass safety checks." };
  }

  return { ok: true };
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

const MAX_REWRITE_CHARS_EXPORT = MAX_REWRITE_CHARS;

/** Validates rewrite text after model output; shared with fixture runner (no API). */
export function isBriefExecutiveSummaryRewriteSafe(params: {
  rewritten: string;
  allowedNumbers: Set<string>;
  hasOpenQuestions: boolean;
  maxChars?: number;
}) {
  const maxChars = params.maxChars ?? MAX_REWRITE_CHARS_EXPORT;
  const rewritten = params.rewritten.trim();
  if (!rewritten) return false;
  if (rewritten.length > maxChars) return false;
  if (/^#{1,6}\s/m.test(rewritten)) return false;
  if (/\b(as an ai|as a language model)\b/i.test(rewritten)) return false;
  if (outputIntroducesNewNumbers(rewritten, params.allowedNumbers)) return false;
  if (params.hasOpenQuestions && !preservesUncertainty(rewritten)) return false;
  return true;
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
- rewrite: string
- limitations: string`;

export type BriefSynthesisClaimsSlice = {
  confirmed: { code: string; text: string; notes?: string | null }[];
  assumptions: { code: string; text: string; notes?: string | null }[];
  needsValidation: { code: string; text: string; notes?: string | null }[];
};

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
  /** Non-superseded claims grouped for model constraints; omitted when empty. */
  claims?: BriefSynthesisClaimsSlice;
};

export type BriefAlternateWordingSynthesisOutcome =
  | { status: "success"; rewrite: string; limitations: string }
  | {
      status: "error";
      error:
        | "missing_api_key"
        | "openai_http"
        | "empty_response"
        | "parse_failed"
        | "invalid_payload"
        | "safety_rejected";
    };

/**
 * Runs the alternate-wording model and safety checks. Does not read `BRIEF_AI_SYNTHESIS_ENABLED`;
 * callers must gate on org/product policy before invoking.
 */
export async function executeBriefAlternateWordingSynthesis(params: {
  input: BriefSynthesisInput;
  targetLabel: string;
}): Promise<BriefAlternateWordingSynthesisOutcome> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return { status: "error", error: "missing_api_key" };

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

  const payload = JSON.stringify(params.input);
  const allowedNumbers = collectAllowedNumberTokens(payload);
  const hasOpenQuestions =
    params.input.issue.openQuestionsIntake.length > 0 ||
    params.input.topTrackerOpenQuestions.length > 0 ||
    (params.input.claims?.needsValidation?.length ?? 0) > 0;

  const claimsConstraints = (() => {
    const c = params.input.claims;
    if (!c) return "";
    const any = c.confirmed.length + c.assumptions.length + c.needsValidation.length > 0;
    if (!any) return "";
    return `
Claims register (in input JSON under "claims"):
- Superseded claims are omitted; do not resurrect them.
- "confirmed": may phrase as factual for this workspace only when consistent with other fields.
- "assumptions": use conditional / hedged language (working assumption, subject to verification).
- "needsValidation": do not assert as settled fact; keep explicit uncertainty while any such lines exist.`;
  })();

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
Rewrite ONLY the ${params.targetLabel} as a single concise paragraph (optionally 2 short paragraphs max). It must read like a leadership briefing note.

Constraints:
- Do not add any new facts. Use only what is present in the input JSON.
- Do not resolve or answer open questions.
- If open questions exist, include at least one explicit uncertainty marker (e.g. "open questions remain", "not yet confirmed", "subject to change").
- If polishing might shift meaning, tighten confidence, remove caveats, or hide ambiguity compared with the deterministic paragraph, omit the rewrite (return an empty or unusable rewrite so the system keeps deterministic wording).
- Keep it under ${MAX_REWRITE_CHARS} characters.${claimsConstraints}

Input JSON:
${payload}`,
        },
      ],
    }),
  });

  if (!res.ok) return { status: "error", error: "openai_http" };

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) return { status: "error", error: "empty_response" };

  let parsed: unknown;
  try {
    parsed = parseJsonObjectFromAssistantContent(content);
  } catch {
    return { status: "error", error: "parse_failed" };
  }

  const safe = parseRewritePayload(parsed);
  if (!safe) return { status: "error", error: "invalid_payload" };

  const rewritten = safe.rewrite.trim();
  if (
    !isBriefExecutiveSummaryRewriteSafe({
      rewritten,
      allowedNumbers,
      hasOpenQuestions,
      maxChars: MAX_REWRITE_CHARS,
    })
  ) {
    return { status: "error", error: "safety_rejected" };
  }

  return { status: "success", rewrite: rewritten, limitations: safe.limitations ?? "" };
}

export async function synthesizeBriefAlternateWording(params: {
  input: BriefSynthesisInput;
  targetLabel: string;
}): Promise<{ rewrite: string; limitations: string } | null> {
  const enabled = process.env.BRIEF_AI_SYNTHESIS_ENABLED === "true";
  if (!enabled) return null;

  const outcome = await executeBriefAlternateWordingSynthesis(params);
  if (outcome.status === "success") {
    return { rewrite: outcome.rewrite, limitations: outcome.limitations };
  }
  return null;
}

export async function synthesizeBriefExecutiveSummary(
  input: BriefSynthesisInput,
): Promise<{ rewrite: string; limitations: string } | null> {
  return synthesizeBriefAlternateWording({
    input,
    targetLabel: "Full brief executive summary body",
  });
}

