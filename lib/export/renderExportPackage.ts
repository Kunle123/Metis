import type { Issue } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";

function mdHeader(title: string) {
  return `# ${title}\n`;
}

function section(title: string, body: string) {
  return `\n## ${title}\n\n${body.trim()}\n`;
}

/**
 * Executive-brief export reads `artifact.executive.blocks`. Full-mode artifacts label the first block
 * “Situation”; Executive-mode uses “Executive summary”. Normalize at export-only time so Markdown
 * matches expectation without persisting mutations.
 */
function executiveBriefExportBlockLabel(index: number, label: string): string {
  if (index !== 0) return label;
  return label.trim() === "Situation" ? "Executive summary" : label;
}

function normalizeExportTerminology(input: string) {
  const s = String(input ?? "");
  if (!s) return s;
  return (
    s
      // posture language
      .replace(/\bOperator posture\b/g, "Briefing posture")
      // old gap terminology variants
      .replace(/\bClarification gaps\b/gi, (m) => (m[0] === "C" ? "Open questions" : "open questions"))
      .replace(/\bopen gaps\b/gi, (m) => (m[0] === "O" ? "Open questions" : "open questions"))
      .replace(/\bopen gap\(s\)\b/gi, "open question(s)")
      .replace(/\bopen gap\b/gi, "open question")
      .replace(/\bgaps\b/gi, (m) => (m[0] === "G" ? "Open questions" : "open questions"))
      .replace(/\bgap\b/gi, (m) => (m[0] === "G" ? "Open question" : "open question"))
      .replace(/\bUnassigned needs\b/gi, (m) => (m[0] === "U" ? "Additional open questions" : "additional open questions"))
  );
}

export function renderExportPackage({
  issue,
  mode,
  format,
  artifact,
}: {
  issue: Pick<Issue, "title">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
}) {
  const title = normalizeExportTerminology(issue.title);

  if (format === "executive-brief" || mode === "executive") {
    const blocks = artifact.executive.blocks
      .map((b, i) =>
        section(
          normalizeExportTerminology(executiveBriefExportBlockLabel(i, b.label)),
          normalizeExportTerminology(b.body),
        ),
      )
      .join("");

    return {
      mimeType: "text/markdown" as const,
      content: `${mdHeader(title)}\n${blocks}`.trim() + "\n",
    };
  }

  if (format === "board-note") {
    const lede = normalizeExportTerminology(artifact.lede);
    const posture = normalizeExportTerminology(`Circulation: ${artifact.metadata.circulation}`);
    return {
      mimeType: "text/markdown" as const,
      content: `${mdHeader(`${title} — board note`)}\n${lede}\n\n${posture}\n`.trim() + "\n",
    };
  }

  if (format === "email-ready") {
    const lede = normalizeExportTerminology(artifact.lede);
    const circulation = normalizeExportTerminology(artifact.metadata.circulation);
    const actions = artifact.executive.immediateActions.map((a) => `- ${normalizeExportTerminology(a)}`).join("\n");
    return {
      mimeType: "text/plain" as const,
      content: `Subject: ${title}\nCirculation: ${circulation}\n\n${lede}\n\nImmediate actions:\n${actions}\n`,
    };
  }

  // full-issue-brief
  const sections = artifact.full.sections.map((s) => section(normalizeExportTerminology(s.title), normalizeExportTerminology(s.body))).join("");
  return {
    mimeType: "text/markdown" as const,
    content: `${mdHeader(title)}\n${section("Lede", normalizeExportTerminology(artifact.lede))}${sections}`.trim() + "\n",
  };
}

