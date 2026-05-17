/** Minimal HTML escapes for injecting brief text into a static document (no scripting). */
export function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Executive-brief export reads `artifact.executive.blocks`. Full-mode artifacts label the first block
 * “Situation”; Executive-mode uses “Executive summary”. Normalize at export-only time so Markdown
 * matches expectation without persisting mutations.
 */
export function executiveBriefExportBlockLabel(index: number, label: string): string {
  if (index !== 0) return label;
  return label.trim() === "Situation" ? "Executive summary" : label;
}

export function normalizeExportTerminology(input: string) {
  const s = String(input ?? "");
  if (!s) return s;
  return (
    s
      .replace(/\bOperator posture\b/g, "Briefing posture")
      .replace(/\bClarification gaps\b/gi, (m) => (m[0] === "C" ? "Open questions" : "open questions"))
      .replace(/\bopen gaps\b/gi, (m) => (m[0] === "O" ? "Open questions" : "open questions"))
      .replace(/\bopen gap\(s\)\b/gi, "open question(s)")
      .replace(/\bopen gap\b/gi, "open question")
      .replace(/\bgaps\b/gi, (m) => (m[0] === "G" ? "Open questions" : "open questions"))
      .replace(/\bgap\b/gi, (m) => (m[0] === "G" ? "Open question" : "open question"))
      .replace(/\bUnassigned needs\b/gi, (m) => (m[0] === "U" ? "Additional open questions" : "additional open questions"))
  );
}
