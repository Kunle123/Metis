import type { Issue } from "@prisma/client";

import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat, ExportOutputType } from "@metis/shared/export";

export type RenderedExportDeliverable =
  | { mimeType: "text/markdown" | "text/plain"; content: string }
  | { mimeType: "text/html"; content: string };

/** Bridges logical `ExportFormat` with delivery `ExportOutputType` (HTML where supported; `email-ready` is always plain text). */
export function renderExportDeliverable(
  opts: Parameters<typeof renderExportPackage>[0] & { outputType?: ExportOutputType },
): RenderedExportDeliverable {
  const { format, outputType } = opts;
  if (format === "email-ready") {
    return renderExportPackage(opts);
  }
  if (outputType === "html") {
    return renderExportPackageHtml(opts);
  }
  return renderExportPackage(opts);
}

const HTML_DOCUMENT_STYLES = `
  :root {
    color-scheme: light;
    --metis-ink: #1a1a1f;
    --metis-muted: #4d4d55;
    --metis-border: #dfe0e4;
    --metis-fill: #f7f7f9;
    --metis-accent: #2f4f6f;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.55;
    font-size: 14px;
  }
  @media print {
    body { background: white; padding: 0; }
    article { max-width: 100%; }
    a { text-decoration: none; color: inherit; }
  }
  body {
    margin: 0 auto;
    max-width: 52rem;
    padding: 2rem clamp(16px, 4vw, 2.5rem) 3rem;
    background: white;
    color: var(--metis-ink);
  }
  article > header {
    padding-bottom: 1rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid var(--metis-border);
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 0.75rem;
    color: var(--metis-accent);
  }
  h2 {
    font-size: 1.1rem;
    font-weight: 650;
    margin: 1.75rem 0 0.65rem;
    color: var(--metis-accent);
    border-bottom: 1px solid var(--metis-border);
    padding-bottom: 0.35rem;
  }
  section { margin-bottom: 1.35rem; }
  p {
    margin: 0 0 0.75rem;
    color: var(--metis-ink);
  }
  ul {
    margin: 0 0 0.75rem;
    padding-left: 1.35rem;
    color: var(--metis-muted);
  }
  li { margin-bottom: 0.35rem; }
  .posture-line {
    font-size: 0.92rem;
    color: var(--metis-muted);
    margin-top: 0.5rem;
  }
  footer.meta {
    margin-top: 2.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--metis-border);
    font-size: 0.8rem;
    color: var(--metis-muted);
  }
`;

/** Minimal HTML escapes for injecting brief text into a static document (no scripting). */
export function escapeHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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

/**
 * Self-contained HTML (.html) packages for briefing exports. Mirrors `renderExportPackage` branching;
 * terminology is normalized identically before escaping. Does not handle `email-ready` (plain text only).
 */
export function renderExportPackageHtml({
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
  const titlePlain = normalizeExportTerminology(issue.title);

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
  const inner = `<header><h1>${escapeHtml(titlePlain)}</h1></header>\n<section aria-labelledby="${ledeSlug}"><h2 id="${ledeSlug}">${escapeHtml("Lede")}</h2>\n${bodyFragmentsToParagraphHtml(ledeFormatted)}</section>\n${sectionBlocks}`;
  return {
    mimeType: "text/html" as const,
    content: wrapStandaloneHtml(inner, titlePlain),
  };
}

