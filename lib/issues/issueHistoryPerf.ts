/** Lightweight timing for issue history load (dev / ISSUE_HISTORY_PERF=1). */

const ENABLED =
  process.env.ISSUE_HISTORY_PERF === "1" || process.env.NODE_ENV === "development";

export function issueHistoryPerfStart(label: string): () => void {
  if (!ENABLED) return () => {};
  const start = performance.now();
  return () => {
    const ms = Math.round(performance.now() - start);
    console.log(`[issue-history] ${label}: ${ms}ms`);
  };
}

export function issueHistoryPerfLog(label: string, detail?: Record<string, unknown>): void {
  if (!ENABLED) return;
  const extra = detail ? ` ${JSON.stringify(detail)}` : "";
  console.log(`[issue-history] ${label}${extra}`);
}
