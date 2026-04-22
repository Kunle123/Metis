import type { Issue } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";

function mdHeader(title: string) {
  return `# ${title}\n`;
}

function section(title: string, body: string) {
  return `\n## ${title}\n\n${body.trim()}\n`;
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
  const title = issue.title;

  if (format === "executive-brief" || mode === "executive") {
    const blocks = artifact.executive.blocks
      .map((b) => section(b.label, b.body))
      .join("");

    return {
      mimeType: "text/markdown" as const,
      content: `${mdHeader(title)}\n${blocks}`.trim() + "\n",
    };
  }

  if (format === "board-note") {
    const lede = artifact.lede;
    const posture = `Circulation: ${artifact.metadata.circulation}`;
    return {
      mimeType: "text/markdown" as const,
      content: `${mdHeader(`${title} — board note`)}\n${lede}\n\n${posture}\n`.trim() + "\n",
    };
  }

  if (format === "email-ready") {
    const lede = artifact.lede;
    const actions = artifact.executive.immediateActions.map((a) => `- ${a}`).join("\n");
    return {
      mimeType: "text/plain" as const,
      content: `${title}\n\n${lede}\n\nImmediate actions:\n${actions}\n`,
    };
  }

  // full-issue-brief
  const sections = artifact.full.sections.map((s) => section(s.title, s.body)).join("");
  return {
    mimeType: "text/markdown" as const,
    content: `${mdHeader(title)}\n${section("Lede", artifact.lede)}${sections}`.trim() + "\n",
  };
}

