/**
 * Filters internal/setup metadata out of executive leadership narrative blocks.
 * Dev/seed intake text may remain on the issue record but must not surface in the executive brief body.
 */

const INTERNAL_METADATA_LINE =
  /(?:dev\/staging|feasibility\s+seed|feasibility\s+qa\s+record|not\s+production\s+content|not\s+a\s+public\s+demo\s+route|intended\s+to\s+test\s+whether\s+metis|live-style\s+comms\s+issue|feasibility\s+qa\s*\(|dev\s+seed)/i;

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
