import type { Issue } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat, ExportOutputType } from "@metis/shared/export";

import type { ExportAuditAppendixInput } from "@/lib/export/buildExportAuditAppendix";
import { buildExportAuditAppendixHtml, buildExportAuditAppendixMarkdown } from "@/lib/export/buildExportAuditAppendix";
import {
  type BriefingPackContext,
  renderBriefingPackHtml,
  renderBriefingPackMarkdown,
  shouldUseBriefingPackRenderer,
} from "@/lib/export/briefingPack";
import { EXPORT_STANDALONE_HTML_STYLES } from "@/lib/export/exportDocumentStyles";
import {
  escapeHtml,
  executiveBriefExportBlockLabel,
  normalizeExportTerminology,
} from "@/lib/export/exportDocumentUtils";

export { escapeHtml, executiveBriefExportBlockLabel, normalizeExportTerminology };

export type RenderedExportDeliverable =
  | { mimeType: "text/markdown" | "text/plain"; content: string }
  | { mimeType: "text/html"; content: string };

/** Bridges logical `ExportFormat` with delivery `ExportOutputType` (HTML where supported; `email-ready` is always plain text). */
export function renderExportDeliverable(
  opts: Parameters<typeof renderExportPackage>[0] & {
    outputType?: ExportOutputType;
    briefingPack?: BriefingPackContext | null;
  },
): RenderedExportDeliverable {
  const { format, outputType, briefingPack } = opts;
  if (format === "email-ready") {
    return renderExportPackage(opts);
  }
  if (outputType === "html") {
    return renderExportPackageHtml(opts);
  }
  return renderExportPackage(opts);
}

/** Shared light document styles for non-pack HTML exports (full brief, board note). */
const HTML_DOCUMENT_STYLES = EXPORT_STANDALONE_HTML_STYLES;

function paragraphsFromBody(bodyTrimmed: string): string[] {
  if (!bodyTrimmed) return [];
  return bodyTrimmed.split(/\r?\n\r?\n+/).filter((b) => b.trim().length > 0);
}

function bodyFragmentsToParagraphHtml(rawBody: string): string {
  const parts = paragraphsFromBody(String(rawBody ?? "").trim());
  if (!parts.length) return "<p>&nbsp;</p>";
  return parts
    .map((block) => {
      const escaped = escapeHtml(block);
      const inner = escaped.split(/\r?\n/).join("<br />\n");
      return `<p>${inner}</p>`;
    })
    .join("\n");
}

function wrapStandaloneHtml(innerBody: string, documentTitlePlain: string) {
  const t = escapeHtml(documentTitlePlain);
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t}</title>
<style>${HTML_DOCUMENT_STYLES}</style>
</head>
<body>
<article>${innerBody}</article>
</body>
</html>
`;
}

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
  auditAppendix,
  briefingPack,
}: {
  issue: Pick<Issue, "title">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
  /** Export-time issue ledger; only appended for `full-issue-brief` Markdown. */
  auditAppendix?: ExportAuditAppendixInput | null;
  briefingPack?: BriefingPackContext | null;
}) {
  const title = normalizeExportTerminology(issue.title);

  if (briefingPack && shouldUseBriefingPackRenderer(format, mode)) {
    return {
      mimeType: "text/markdown" as const,
      content: renderBriefingPackMarkdown(briefingPack, artifact),
    };
  }

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
  let content = `${mdHeader(title)}\n${section("Lede", normalizeExportTerminology(artifact.lede))}${sections}`.trim() + "\n";
  if (format === "full-issue-brief" && auditAppendix) {
    content += buildExportAuditAppendixMarkdown(auditAppendix);
  }
  return {
    mimeType: "text/markdown" as const,
    content,
  };
}

/**
 * Self-contained HTML (.html) packages for briefing exports. Mirrors `renderExportPackage` branching;
 * terminology is normalized identically before escaping. Does not handle `email-ready` (plain text only).
 */
export function renderExportPackageHtml({
  issue,
  mode,
  format,
  artifact,
  auditAppendix,
  briefingPack,
}: {
  issue: Pick<Issue, "title">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
  /** Export-time issue ledger; only appended for `full-issue-brief` HTML. */
  auditAppendix?: ExportAuditAppendixInput | null;
  briefingPack?: BriefingPackContext | null;
}) {
  const titlePlain = normalizeExportTerminology(issue.title);

  if (briefingPack && shouldUseBriefingPackRenderer(format, mode)) {
    return {
      mimeType: "text/html" as const,
      content: renderBriefingPackHtml(briefingPack, artifact),
    };
  }

  if (format === "executive-brief" || mode === "executive") {
    const sectionsInner = artifact.executive.blocks
      .map((b, i) => {
        const h = normalizeExportTerminology(executiveBriefExportBlockLabel(i, b.label));
        const bodyTxt = normalizeExportTerminology(b.body);
        return `<section aria-labelledby="${escapeHtml(`section-${i}`)}"><h2 id="${escapeHtml(`section-${i}`)}">${escapeHtml(h)}</h2>\n${bodyFragmentsToParagraphHtml(bodyTxt)}</section>`;
      })
      .join("\n");
    const inner = `<header><h1>${escapeHtml(titlePlain)}</h1></header>\n${sectionsInner}`;
    return {
      mimeType: "text/html" as const,
      content: wrapStandaloneHtml(inner, titlePlain),
    };
  }

  if (format === "board-note") {
    const lede = normalizeExportTerminology(artifact.lede);
    const posture = normalizeExportTerminology(`Circulation: ${artifact.metadata.circulation}`);
    const docTitle = `${titlePlain} — board note`;
    const inner = `<header><h1>${escapeHtml(docTitle)}</h1><p class="posture-line">${escapeHtml(posture)}</p></header>\n<section>${bodyFragmentsToParagraphHtml(lede)}</section>`;
    return {
      mimeType: "text/html" as const,
      content: wrapStandaloneHtml(inner, docTitle),
    };
  }

  // full-issue-brief (default remaining)
  const ledeFormatted = normalizeExportTerminology(artifact.lede);
  const sectionBlocks = artifact.full.sections
    .map((s, i) => {
      const slug = `${s.id}-${i}`;
      const h = normalizeExportTerminology(s.title);
      const bodyTxt = normalizeExportTerminology(s.body);
      return `<section aria-labelledby="${escapeHtml(slug)}"><h2 id="${escapeHtml(slug)}">${escapeHtml(h)}</h2>\n${bodyFragmentsToParagraphHtml(bodyTxt)}</section>`;
    })
    .join("\n");
  const ledeSlug = "metis-section-lede";
  let inner = `<header><h1>${escapeHtml(titlePlain)}</h1></header>\n<section aria-labelledby="${ledeSlug}"><h2 id="${ledeSlug}">${escapeHtml("Lede")}</h2>\n${bodyFragmentsToParagraphHtml(ledeFormatted)}</section>\n${sectionBlocks}`;
  if (format === "full-issue-brief" && auditAppendix) {
    inner += buildExportAuditAppendixHtml(auditAppendix);
  }
  return {
    mimeType: "text/html" as const,
    content: wrapStandaloneHtml(inner, titlePlain),
  };
}

