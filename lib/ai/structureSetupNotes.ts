import { z } from "zod";

const severityEnum = z.enum(["Critical", "High", "Moderate", "Low"]);
const priorityEnum = z.enum(["Critical", "High", "Normal", "Low"]);
const postureEnum = z.enum(["Monitoring", "Active", "Holding", "Closed"]);
const sourceTierEnum = z.enum(["Official", "Internal", "Major media", "Market signal"]);
const gapSeverityEnum = z.enum(["Critical", "Important", "Watch"]);

export const StructureSetupSuggestionsSchema = z.object({
  title: z.string().nullable().optional(),
  issueType: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  confirmedFacts: z.string().nullable().optional(),
  openQuestions: z.string().nullable().optional(),
  context: z.string().nullable().optional(),
  audience: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  severity: severityEnum.nullable().optional(),
  priority: priorityEnum.nullable().optional(),
  operatorPosture: postureEnum.nullable().optional(),
  needsMore: z.array(z.string()).default([]),
  limitations: z.string().default(""),
});

const SuggestedSourceSchema = z.object({
  title: z.string().min(1).nullable(),
  note: z.string().min(1).nullable(),
  snippet: z.string().nullable(),
  tier: sourceTierEnum.nullable(),
  reliability: z.string().nullable(),
  linkedSection: z.string().nullable(),
  whyThisIsEvidence: z.string().nullable(),
});

const SuggestedGapSchema = z.object({
  title: z.string().min(1).nullable(),
  whyItMatters: z.string().min(1).nullable(),
  stakeholder: z.string().min(1).nullable(),
  linkedSection: z.string().min(1).nullable(),
  prompt: z.string().min(1).nullable(),
  severity: gapSeverityEnum.nullable(),
});

export const StructureSetupResponseSchema = z.object({
  ok: z.literal(true),
  suggestions: StructureSetupSuggestionsSchema,
  suggestedSources: z.array(SuggestedSourceSchema).default([]),
  suggestedGaps: z.array(SuggestedGapSchema).default([]),
  needsMore: z.array(z.string()),
  limitations: z.string(),
});

export type StructureSetupResponse = z.infer<typeof StructureSetupResponseSchema>;
export type StructureSetupSuggestions = z.infer<typeof StructureSetupSuggestionsSchema>;

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const MAX_RAW_NOTES = 32_000;

const SYSTEM = `You are a structured-intake helper for a crisis/operations "issue" record in a product called Metis.

Your job is to SUGGEST field values that map a user's raw notes into structured work. You do NOT create records and you do NOT act autonomously.

Rules:
- Output a single JSON object only (no markdown, no backticks) matching the keys requested in the user message.
- Do NOT invent facts, numbers, times, or names that are not present or clearly implied in the notes. If something is missing, use null for that field, list the gap in "needsMore", and explain briefly in "limitations".
- Keep "confirmedFacts" to things the notes state as known or well-supported. Put uncertainty, unverified items, and needed confirmation in "openQuestions" instead.
- "summary" is a concise working line (1–3 sentences) grounded in the notes, not a generic template.
- "issueType" and "title" should be specific to the situation when the notes support it; if the notes are too thin, return nulls and rely on "needsMore".
- "severity" must be one of: Critical, High, Moderate, Low, or null if not inferable.
- "priority" must be one of: Critical, High, Normal, Low, or null.
- "operatorPosture" must be one of: Monitoring, Active, Holding, Closed, or null.
- "suggestedSources" are potential evidence items to locate or confirm. They are NOT verified facts. Do not invent URLs. Only include snippet text if present in the notes.
- Each suggested source must be an evidence artifact already mentioned or clearly present in the notes (e.g., a specific ticket, email, confirmation, metric/spike, incident record). Do not propose tasks as sources.
- Do not phrase sources as actions (avoid titles starting with: Review, Check, Analyze, Investigate, Confirm, Verify). Those belong as gaps/tasks.
- Each suggested source should include a title and a note (what the evidence is / where it exists) and a short justification in "whyThisIsEvidence".
- "suggestedGaps" are unresolved questions / missing information. They must be phrased as questions/prompts, not assertions. Keep them separate from confirmed facts.
- "suggestedGaps" should include verification tasks and investigative next steps (e.g., review logs, confirm counts, analyze tickets).
- Gap severity must be one of: Critical, Important, Watch, or null if not inferable.
- "needsMore" is an array of short strings (what is missing to fill the form well). Use an empty array if the notes are sufficient.
- "limitations" is a short string about what you could not infer or what remains uncertain.`;

function nullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function pickEnum(v: unknown, schema: z.ZodTypeAny): string | null {
  if (v === null || v === undefined) return null;
  const s = typeof v === "string" ? v.trim() : String(v);
  const r = schema.safeParse(s);
  return r.success ? String(r.data) : null;
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
}

function unknownArray(v: unknown): unknown[] {
  if (!Array.isArray(v)) return [];
  return v;
}

function nullableObject(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  if (Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

const SOURCE_ACTION_VERB = /^(review|check|analy[sz]e|investigat(e|ion)|confirm|verify|look into|triage)\b/i;

const USER_KEY_SCHEMA = `Return JSON with exactly these keys:
- title (string or null)
- issueType (string or null)
- summary (string or null)
- confirmedFacts (string or null)
- openQuestions (string or null)
- context (string or null)
- audience (string or null)
- ownerName (string or null)
- severity ("Critical" | "High" | "Moderate" | "Low" or null)
- priority ("Critical" | "High" | "Normal" | "Low" or null)
- operatorPosture ("Monitoring" | "Active" | "Holding" | "Closed" or null)
- suggestedSources (array of objects):
  - title (string or null)
  - note (string or null)
  - snippet (string or null)
  - tier ("Official" | "Internal" | "Major media" | "Market signal" or null)
  - reliability (string or null)
  - linkedSection (string or null)
  - whyThisIsEvidence (string or null)
- suggestedGaps (array of objects):
  - title (string or null)
  - whyItMatters (string or null)
  - stakeholder (string or null)
  - linkedSection (string or null)
  - prompt (string or null)
  - severity ("Critical" | "Important" | "Watch" or null)
- needsMore (array of strings)
- limitations (string)`;

function parseJsonObjectFromAssistantContent(content: string): unknown {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(unfenced) as unknown;
}

export async function callStructureSetupModel(rawNotes: string): Promise<StructureSetupResponse> {
  if (rawNotes.length > MAX_RAW_NOTES) {
    throw new StructureSetupError("invalid_input", "Notes are too long.");
  }
  if (!rawNotes.trim().length) {
    throw new StructureSetupError("invalid_input", "Notes cannot be empty.");
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new StructureSetupError("unavailable", "AI assist is not configured.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;

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
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `${USER_KEY_SCHEMA}\n\nNotes:\n\n${rawNotes}` },
      ],
    }),
  });

  if (!res.ok) {
    throw new StructureSetupError("provider_error", "AI request failed. Try again later.");
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new StructureSetupError("provider_error", "Empty response from AI.");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonObjectFromAssistantContent(content);
  } catch {
    throw new StructureSetupError("parse_error", "Could not read AI output.");
  }

  const loose = z
    .object({
      title: z.unknown().optional(),
      issueType: z.unknown().optional(),
      summary: z.unknown().optional(),
      confirmedFacts: z.unknown().optional(),
      openQuestions: z.unknown().optional(),
      context: z.unknown().optional(),
      audience: z.unknown().optional(),
      ownerName: z.unknown().optional(),
      severity: z.unknown().optional(),
      priority: z.unknown().optional(),
      operatorPosture: z.unknown().optional(),
      suggestedSources: z.unknown().optional(),
      suggestedGaps: z.unknown().optional(),
      needsMore: z.unknown().optional(),
      limitations: z.unknown().optional(),
    })
    .safeParse(parsed);

  if (!loose.success) {
    throw new StructureSetupError("parse_error", "AI output did not match the expected format.");
  }

  const s = loose.data;
  const suggestions = StructureSetupSuggestionsSchema.parse({
    title: nullableString(s.title),
    issueType: nullableString(s.issueType),
    summary: nullableString(s.summary),
    confirmedFacts: nullableString(s.confirmedFacts),
    openQuestions: nullableString(s.openQuestions),
    context: nullableString(s.context),
    audience: nullableString(s.audience),
    ownerName: nullableString(s.ownerName),
    severity: pickEnum(s.severity, severityEnum),
    priority: pickEnum(s.priority, priorityEnum),
    operatorPosture: pickEnum(s.operatorPosture, postureEnum),
    needsMore: stringArray(s.needsMore),
    limitations: typeof s.limitations === "string" ? s.limitations : "",
  });

  const suggestedSources = unknownArray(s.suggestedSources)
    .map(nullableObject)
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((obj) => ({
      title: nullableString(obj.title),
      note: nullableString(obj.note),
      snippet: nullableString(obj.snippet),
      tier: pickEnum(obj.tier, sourceTierEnum),
      reliability: nullableString(obj.reliability),
      linkedSection: nullableString(obj.linkedSection),
      whyThisIsEvidence: nullableString(obj.whyThisIsEvidence),
    }));

  const suggestedGaps = unknownArray(s.suggestedGaps)
    .map(nullableObject)
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((obj) => ({
      title: nullableString(obj.title),
      whyItMatters: nullableString(obj.whyItMatters),
      stakeholder: nullableString(obj.stakeholder),
      linkedSection: nullableString(obj.linkedSection),
      prompt: nullableString(obj.prompt),
      severity: pickEnum(obj.severity, gapSeverityEnum),
    }));

  const suggestedSourcesValidated = z.array(SuggestedSourceSchema).parse(suggestedSources);
  const suggestedGapsValidated = z.array(SuggestedGapSchema).parse(suggestedGaps);

  const reclassified = reclassifyActionSources(suggestedSourcesValidated, suggestedGapsValidated);

  return {
    ok: true,
    suggestions,
    suggestedSources: reclassified.suggestedSources,
    suggestedGaps: reclassified.suggestedGaps,
    needsMore: suggestions.needsMore,
    limitations: suggestions.limitations,
  };
}

function reclassifyActionSources(
  suggestedSources: z.infer<typeof SuggestedSourceSchema>[],
  suggestedGaps: z.infer<typeof SuggestedGapSchema>[],
) {
  const sources: z.infer<typeof SuggestedSourceSchema>[] = [];
  const gaps: z.infer<typeof SuggestedGapSchema>[] = [...suggestedGaps];

  for (const src of suggestedSources) {
    const title = (src.title ?? "").trim();
    if (title && SOURCE_ACTION_VERB.test(title)) {
      gaps.push({
        title,
        prompt: title,
        whyItMatters: src.note ?? src.whyThisIsEvidence ?? null,
        stakeholder: null,
        linkedSection: src.linkedSection ?? null,
        severity: null,
      });
      continue;
    }
    sources.push(src);
  }

  return {
    suggestedSources: z.array(SuggestedSourceSchema).parse(sources),
    suggestedGaps: z.array(SuggestedGapSchema).parse(gaps),
  };
}

export class StructureSetupError extends Error {
  constructor(
    readonly code: "invalid_input" | "unavailable" | "provider_error" | "parse_error",
    message: string,
  ) {
    super(message);
    this.name = "StructureSetupError";
  }
}
