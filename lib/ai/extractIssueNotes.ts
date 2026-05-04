import { z } from "zod";

import { GapSeveritySchema } from "@metis/shared/gap";
import type { CaptureNotesExtractResponse } from "@metis/shared/captureNotesExtract";
import {
  CaptureNotesExtractResponseSchema,
  FollowUpActionExtractSchema,
  type FollowUpTarget,
  SuggestedObservationExtractSchema,
  SuggestedOpenQuestionExtractSchema,
  SuggestedSourceExtractSchema,
} from "@metis/shared/captureNotesExtract";
import { InternalInputConfidenceSchema } from "@metis/shared/internalInput";
import { SourceTierSchema } from "@metis/shared/source";

export const MAX_CAPTURE_NOTES_CHARS = 32_000;
export const MIN_CAPTURE_NOTES_CHARS = 48;

/** Per-group caps after filtering (prefer fewer, sharper suggestions). */
export const CAP_OPEN_QUESTIONS = 5;
export const CAP_SOURCES = 5;
export const CAP_OBSERVATIONS = 5;
export const CAP_FOLLOW_UPS = 5;

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

export class ExtractIssueNotesError extends Error {
  readonly code: "invalid_input" | "unavailable" | "provider_error" | "parse_error";

  constructor(code: ExtractIssueNotesError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function parseJsonObjectFromAssistantContent(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(unfenced) as unknown;
}

/** Collapse whitespace and lower-case for excerpt substring checks. */
export function normalizeNotesForExcerptMatch(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

/** True if excerpt (normalized) appears as a substring of normalized notes. */
export function excerptAppearsInNotes(verbatimExcerpt: string, rawNotes: string): boolean {
  const ex = verbatimExcerpt.trim();
  if (!ex.length) return false;
  const nNotes = normalizeNotesForExcerptMatch(rawNotes);
  const nEx = normalizeNotesForExcerptMatch(ex);
  return nNotes.includes(nEx);
}

function pickGapSeverity(v: unknown): z.infer<typeof GapSeveritySchema> {
  const r = GapSeveritySchema.safeParse(v);
  if (r.success) return r.data;
  return "Watch";
}

function pickTier(v: unknown): z.infer<typeof SourceTierSchema> {
  const r = SourceTierSchema.safeParse(v);
  if (r.success) return r.data;
  return "Internal";
}

function pickConfidence(v: unknown): z.infer<typeof InternalInputConfidenceSchema> {
  const r = InternalInputConfidenceSchema.safeParse(v);
  if (r.success) return r.data;
  return "Needs validation";
}

function pickFollowTarget(v: unknown): FollowUpTarget {
  const r = z.enum(["source", "open_question", "observation", "none"]).safeParse(v);
  return r.success ? r.data : "none";
}

function nullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function unknownArray(v: unknown): unknown[] {
  if (!Array.isArray(v)) return [];
  return v;
}

function nullableObject(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

/** Downgrade Official tier unless excerpt clearly references an official source. */
function conservativeTier(tier: z.infer<typeof SourceTierSchema>, verbatimExcerpt: string): z.infer<typeof SourceTierSchema> {
  if (tier !== "Official") return tier;
  return /\bofficial\b/i.test(verbatimExcerpt) ? "Official" : "Internal";
}

function urlOnlyIfInNotes(url: string | null, rawNotes: string): string | null {
  const t = url?.trim();
  if (!t) return null;
  return rawNotes.includes(t) ? t : null;
}

/**
 * Turn model JSON into a validated, capped response with excerpt checks and conservative tiering.
 * Drops items without traceable excerpts or with invalid shape.
 */
export function finalizeCaptureNotesExtraction(modelJson: unknown, rawNotesInput: string): CaptureNotesExtractResponse {
  const trimmedNotes = rawNotesInput.trim();
  if (!trimmedNotes.length) {
    return {
      ok: true,
      suggestedOpenQuestions: [],
      suggestedSources: [],
      suggestedObservations: [],
      followUpActions: [],
      limitations: "Notes were empty after validation.",
    };
  }

  const base = nullableObject(modelJson) ?? {};

  const limitationsRaw = typeof base.limitations === "string" ? base.limitations.trim() : "";

  const looseOq = unknownArray(base.suggestedOpenQuestions);
  const looseSrc = unknownArray(base.suggestedSources);
  const looseObs = unknownArray(base.suggestedObservations);
  const looseFu = unknownArray(base.followUpActions ?? base.followUps);

  const suggestedOpenQuestions: CaptureNotesExtractResponse["suggestedOpenQuestions"] = [];
  for (const item of looseOq) {
    const o = nullableObject(item);
    if (!o) continue;
    const verbatimExcerpt = nullableString(o.verbatimExcerpt) ?? "";
    if (!verbatimExcerpt || !excerptAppearsInNotes(verbatimExcerpt, trimmedNotes)) continue;

    const row = {
      title: nullableString(o.title) ?? "",
      prompt: nullableString(o.prompt) ?? "",
      whyItMatters: nullableString(o.whyItMatters) ?? "",
      stakeholder: nullableString(o.stakeholder) ?? "To confirm",
      severity: pickGapSeverity(o.severity),
      linkedSection: nullableString(o.linkedSection),
      verbatimExcerpt: verbatimExcerpt.trim(),
      needsReview: true as const,
    };
    const p = SuggestedOpenQuestionExtractSchema.safeParse(row);
    if (!p.success) continue;
    suggestedOpenQuestions.push(p.data);
    if (suggestedOpenQuestions.length >= CAP_OPEN_QUESTIONS) break;
  }

  const suggestedSources: CaptureNotesExtractResponse["suggestedSources"] = [];
  for (const item of looseSrc) {
    const o = nullableObject(item);
    if (!o) continue;
    const verbatimExcerpt = nullableString(o.verbatimExcerpt) ?? "";
    if (!verbatimExcerpt || !excerptAppearsInNotes(verbatimExcerpt, trimmedNotes)) continue;

    const tier = conservativeTier(pickTier(o.suggestedTier ?? o.tier), verbatimExcerpt);
    const row = {
      title: nullableString(o.title) ?? "",
      note: nullableString(o.note) ?? "",
      snippet: nullableString(o.snippet),
      url: urlOnlyIfInNotes(nullableString(o.url), trimmedNotes),
      suggestedTier: tier,
      linkedSection: nullableString(o.linkedSection),
      verbatimExcerpt: verbatimExcerpt.trim(),
      isVerifiedEvidence: false as const,
      needsReview: true as const,
    };
    const p = SuggestedSourceExtractSchema.safeParse(row);
    if (!p.success) continue;
    suggestedSources.push(p.data);
    if (suggestedSources.length >= CAP_SOURCES) break;
  }

  const suggestedObservations: CaptureNotesExtractResponse["suggestedObservations"] = [];
  for (const item of looseObs) {
    const o = nullableObject(item);
    if (!o) continue;
    const verbatimExcerpt = nullableString(o.verbatimExcerpt) ?? "";
    if (!verbatimExcerpt || !excerptAppearsInNotes(verbatimExcerpt, trimmedNotes)) continue;

    let confidence = pickConfidence(o.confidence);
    if (confidence === "Confirmed") confidence = "Needs validation";

    const row = {
      role: nullableString(o.role) ?? "Meeting notes",
      name: nullableString(o.name) ?? "Unattributed",
      response: nullableString(o.response) ?? "",
      confidence,
      linkedSection: nullableString(o.linkedSection),
      verbatimExcerpt: verbatimExcerpt.trim(),
      needsReview: true as const,
    };
    const p = SuggestedObservationExtractSchema.safeParse(row);
    if (!p.success) continue;
    suggestedObservations.push(p.data);
    if (suggestedObservations.length >= CAP_OBSERVATIONS) break;
  }

  const followUpActions: CaptureNotesExtractResponse["followUpActions"] = [];
  for (const item of looseFu) {
    const o = nullableObject(item);
    if (!o) continue;
    const verbatimExcerpt = nullableString(o.verbatimExcerpt) ?? "";
    if (!verbatimExcerpt || !excerptAppearsInNotes(verbatimExcerpt, trimmedNotes)) continue;

    const row = {
      label: nullableString(o.label) ?? "",
      rationale: nullableString(o.rationale),
      suggestedTarget: pickFollowTarget(o.suggestedTarget),
      verbatimExcerpt: verbatimExcerpt.trim(),
      needsReview: true as const,
    };
    const p = FollowUpActionExtractSchema.safeParse(row);
    if (!p.success) continue;
    followUpActions.push(p.data);
    if (followUpActions.length >= CAP_FOLLOW_UPS) break;
  }

  const softWarnings: string[] = [];
  if (!limitationsRaw.length) {
    softWarnings.push("Treat all items as provisional until you review.");
  }

  const limitations = [limitationsRaw, ...softWarnings].filter(Boolean).join(" ");

  const out: CaptureNotesExtractResponse = {
    ok: true,
    suggestedOpenQuestions,
    suggestedSources,
    suggestedObservations,
    followUpActions,
    limitations: limitations || "Suggestions are provisional; review each item before creating records.",
  };

  return CaptureNotesExtractResponseSchema.parse(out);
}

const SYSTEM = `You are an extraction assistant for Metis issue notes (meetings, calls, emails).

You output JSON ONLY. You do NOT create or update database records.

Rules:
- Do not invent facts, names, dates, numbers, URLs, commitments, or causes not present in the notes.
- Do not convert questions into facts. Do not answer open questions — surface them as suggested open questions.
- Preserve uncertainty: use tentative wording inside prompt/response fields when the notes are uncertain.
- Meeting commentary is not verified evidence. Every suggested source must have isVerifiedEvidence false.
- suggestedTier must not be Official unless the verbatim excerpt explicitly references an official document/source channel (explicit "official").
- Prefer Internal or Major media tiers for tentative mentions.
- Each suggestion MUST include verbatimExcerpt: a SHORT substring copied verbatim from the notes so a human can trace it (no paraphrasing in excerpts).
- If unsure whether something is a source vs observation vs question, prefer open_question or observation over source.
- Keep titles and bodies short (brief forms). Omit arrays when empty.
- Limit each suggestion group to ${CAP_OPEN_QUESTIONS} entries or fewer in your output array lengths.
- Return followUpActions only for clear next-step language in the notes; otherwise empty array.

Return ONLY valid JSON matching the user schema keys.`;

const USER_SCHEMA = `Return a single JSON object with exactly these keys:
- suggestedOpenQuestions: array (max ${CAP_OPEN_QUESTIONS}) of objects:
  - title (string)
  - prompt (string, question/clarification form)
  - whyItMatters (string)
  - stakeholder (string — who cares / who should confirm; otherwise "Stakeholder — confirm")
  - severity ("Critical" | "Important" | "Watch")
  - linkedSection (string or null)
  - verbatimExcerpt (string substring from notes)
  - needsReview (boolean, must be true)
- suggestedSources: array (max ${CAP_SOURCES}) of objects:
  - title (string)
  - note (string — what artifact is suspected)
  - snippet (string or null — only if pasted in notes)
  - url (string or null — ONLY if literally present in notes)
  - suggestedTier ("Official" | "Internal" | "Major media" | "Market signal") — conservative
  - linkedSection (string or null)
  - verbatimExcerpt (string substring from notes)
  - isVerifiedEvidence (boolean, MUST be false)
  - needsReview (boolean, must be true)
- suggestedObservations: array (max ${CAP_OBSERVATIONS}) of objects:
  - role (string — e.g. Meeting notes / Comms lead)
  - name (string — speaker if named in notes otherwise "Notes")
  - response (short paraphrase grounded in excerpt; no new facts)
  - confidence ("Confirmed" | "Likely" | "Unclear" | "Needs validation") — default Needs validation unless notes clearly state certainty
  - linkedSection (string or null)
  - verbatimExcerpt (string substring from notes)
  - needsReview (boolean, must be true)
- followUpActions: array (max ${CAP_FOLLOW_UPS}) of objects:
  - label (short string)
  - rationale (string or null)
  - suggestedTarget ("source" | "open_question" | "observation" | "none")
  - verbatimExcerpt (string substring from notes)
  - needsReview (boolean, must be true)
- limitations (string): what could not be classified or uncertainty summary`;

export type IssueNotesExtractionContext = {
  issueTitle: string;
  issueSummary: string;
};

export async function callExtractIssueNotesModel(
  rawNotes: string,
  meetingLabel: string | null | undefined,
  ctx: IssueNotesExtractionContext,
): Promise<CaptureNotesExtractResponse> {
  const trimmed = rawNotes.trim();
  if (trimmed.length < MIN_CAPTURE_NOTES_CHARS) {
    throw new ExtractIssueNotesError("invalid_input", `Notes must be at least ${MIN_CAPTURE_NOTES_CHARS} characters.`);
  }
  if (trimmed.length > MAX_CAPTURE_NOTES_CHARS) {
    throw new ExtractIssueNotesError("invalid_input", "Notes are too long.");
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new ExtractIssueNotesError("unavailable", "AI assist is not configured.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

  const labelBlock = meetingLabel?.trim()?.length ? `Meeting / context label: ${meetingLabel.trim()}` : "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.15,
      max_tokens: 3500,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${USER_SCHEMA}

Issue title: ${ctx.issueTitle}
Issue summary (for context only, do not restate unrelated facts):\n${ctx.issueSummary.slice(0, 4_000)}
${labelBlock ? `${labelBlock}\n` : ""}
Notes:\n${trimmed}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new ExtractIssueNotesError("provider_error", "AI request failed. Try again later.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new ExtractIssueNotesError("provider_error", "Empty response from AI.");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonObjectFromAssistantContent(content);
  } catch {
    throw new ExtractIssueNotesError("parse_error", "Could not read AI output.");
  }

  try {
    return finalizeCaptureNotesExtraction(parsed, trimmed);
  } catch {
    throw new ExtractIssueNotesError("parse_error", "Could not validate extraction output.");
  }
}
