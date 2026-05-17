/**
 * Filters internal/setup metadata out of executive leadership narrative blocks.
 * Dev/seed intake text may remain on the issue record but must not surface in the executive brief body.
 */

const INTERNAL_METADATA_LINE =
  /(?:dev\/staging|feasibility\s+seed|feasibility\s+qa(?:\s+record|\s*\(|$)|not\s+production\s+content|not\s+a\s+public\s+demo\s+route|intended\s+to\s+test\s+whether\s+metis|live-style\s+comms\s+issue|dev\s+seed)/i;

const INTERNAL_OWNER_LABEL =
  /\b(feasibility\s+qa|dev\s+seed|qa\s*\(dev)\b/i;

const PRODUCT_EXPLANATION_LINE =
  /(?:generated\s+from\s+the\s+current\s+issue\s+record|intended\s+to\s+test\s+whether)/i;

export function isExecutiveInternalMetadataLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  return INTERNAL_METADATA_LINE.test(t) || PRODUCT_EXPLANATION_LINE.test(t);
}

export function filterExecutiveNarrativeLines(lines: string[]): string[] {
  return lines.map((l) => l.trim()).filter((l) => l.length > 0 && !isExecutiveInternalMetadataLine(l));
}

/** Remove internal metadata lines/paragraphs; preserve legitimate stakeholder context. */
export function filterExecutiveNarrativeText(raw: string): string {
  const input = raw ?? "";
  if (!input.trim()) return "";

  const trimmed = input.trim();
  if (/^[-*•]\s/m.test(trimmed)) {
    return trimmed
      .split(/\r?\n/)
      .map((line) => {
        const bullet = line.match(/^([-*•]\s+)(.*)$/);
        if (!bullet) return line.trim() ? line : "";
        const content = bullet[2]!.trim();
        if (!content || isExecutiveInternalMetadataLine(content)) return "";
        return `${bullet[1]}${content}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  const paragraphs = input.split(/\n{2,}/);
  const kept: string[] = [];

  for (const para of paragraphs) {
    const lines = para.split(/\r?\n/).map((l) => l.replace(/^[-*•]\s+/, "").trim());
    const filtered = filterExecutiveNarrativeLines(lines);
    if (!filtered.length) continue;
    kept.push(filtered.join("\n"));
  }

  return kept.join("\n\n").trim();
}

export function isExecutiveInternalMetadataText(raw: string): boolean {
  const filtered = filterExecutiveNarrativeText(raw);
  return !filtered.trim();
}

export function normalizeSentenceForDedupe(text: string): string {
  return text
    .trim()
    .replace(/^[-*•]\s+/, "")
    .replace(/\.$/, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isNearDuplicateSentence(a: string, b: string): boolean {
  const na = normalizeSentenceForDedupe(a);
  const nb = normalizeSentenceForDedupe(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 24 && nb.length >= 24 && (na.includes(nb) || nb.includes(na))) return true;
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const sharedWordPrefix = 6;
  if (wordsA.length >= sharedWordPrefix && wordsB.length >= sharedWordPrefix) {
    if (wordsA.slice(0, sharedWordPrefix).join(" ") === wordsB.slice(0, sharedWordPrefix).join(" ")) {
      return true;
    }
  }
  return false;
}

export function dedupeSentences(sentences: string[]): string[] {
  const out: string[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s || isExecutiveInternalMetadataLine(s)) continue;
    if (out.some((existing) => isNearDuplicateSentence(existing, s))) continue;
    out.push(s.endsWith(".") ? s : `${s}.`);
  }
  return out;
}

export function intakeConfirmedToSentences(confirmedFacts: string): string[] {
  if (!confirmedFacts.trim()) return [];
  return confirmedFacts
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
}

/** Leadership-facing owner label — never expose seed/QA fixture names. */
export function sanitizeExecutiveOwnerName(name: string): string {
  const t = name.trim();
  if (!t || INTERNAL_OWNER_LABEL.test(t) || isExecutiveInternalMetadataLine(t)) {
    return "Owner not assigned";
  }
  return t;
}

function capitalizeClause(clause: string): string {
  const t = clause.trim().replace(/\.$/, "");
  if (!t) return "";
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

/** Bullet text under a “Do not say yet” heading — no repeated lead-in phrase. */
export function formatExecutiveDoNotSayBullet(line: string): string {
  let clause = line
    .trim()
    .replace(/^[-*•]\s+/, "")
    .replace(/^do not say yet\s+/i, "")
    .replace(/^do not\s+/i, "");
  clause = capitalizeClause(clause);
  if (!clause) return "";
  return clause.endsWith(".") ? `- ${clause}` : `- ${clause}.`;
}

export function formatExecutiveDoNotSaySection(bullets: string[]): string {
  const deduped = dedupeExecutiveDoNotSayBullets(bullets);
  const formatted = deduped.map(formatExecutiveDoNotSayBullet).filter(Boolean);
  if (!formatted.length) return "";
  return ["Do not say yet:", ...formatted].join("\n");
}

/** Normalise guardrail clauses for dedupe (gap + claim sources may repeat the same line). */
export function normalizeDoNotSayBulletKey(line: string): string {
  let t = line
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^do not say yet\s+/i, "")
    .replace(/^do not\s+/i, "");
  t = t.replace(/^(that|when|what)\s+/, "");
  return t.replace(/\s+/g, " ").trim();
}

export function dedupeExecutiveDoNotSayBullets(bullets: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of bullets) {
    const key = normalizeDoNotSayBulletKey(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw.trim());
  }
  return out;
}

/** True when a full paragraph from Record sufficiency is already present in the executive summary. */
export function isParagraphContainedInText(paragraph: string, body: string): boolean {
  const p = paragraph.trim();
  const b = body.trim();
  if (!p || !b || p.length < 24) return false;
  if (isNearDuplicateSentence(p, b)) return true;
  return b.toLowerCase().includes(p.toLowerCase());
}

export function filterParagraphsNotInBody(paragraphs: string[], body: string): string[] {
  return paragraphs.filter((p) => p.trim() && !isParagraphContainedInText(p, body));
}
