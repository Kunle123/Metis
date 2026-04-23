export type DisplayConfidence = "Confirmed" | "Likely" | "Unclear" | "Needs validation";

/**
 * User-facing copy for internal confidence levels. API/schema values stay unchanged
 * (e.g. enum still stores `"Unclear"`).
 */
export function confidenceDisplayLabel(level: DisplayConfidence): string {
  if (level === "Unclear") return "Needs clarification";
  return level;
}
