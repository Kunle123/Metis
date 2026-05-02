/**
 * DOCX export spike — not wired into production UI or `/api/issues/.../export`.
 *
 * ## Options evaluated (brief)
 *
 * **`docx` (npm, used here)**
 * - Builds OOXML programmatically (~500KB gzipped transitive footprint; moderate risk).
 * - Railway/Node-compatible; no LibreOffice/browser.
 * - Styling fidelity: manual (mirrors Markdown/HTML branching with explicit headings/bullets rather than dumping raw HTML tags).
 *
 * **HTML → DOCX converters**
 * - Reuse {@link renderExportPackageHtml}; conversion via headless LibreOffice/Pandoc is heavy for serverless; JS HTML→DOCX tooling is fragmented and brittle for arbitrary CSS.
 *
 * **On-demand binary response (recommended eventual shape)**
 * - Extend render layer with `{ mimeType: "application/vnd...wordprocessingml...", body: Buffer }` (non-JSON) or parallel download route.
 * - Avoid storing OOXML bytes in `ArtifactExport.content` (typed as string UTF-16 text fields in practice).
 *
 * **base64 in DB string**
 * - Possible stopgap only; wastes space and complicates payloads; inferior to blob storage + URL for production.
 *
 * **Generation source**
 * - Prefer the same semantic branches as Markdown/HTML ({@link renderExportDeliverable}), i.e. structured `BriefArtifact` + normalization, not Markdown round-trip parsing.
 */

import type { Issue } from "@prisma/client";
import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import { executiveBriefExportBlockLabel, normalizeExportTerminology } from "./renderExportPackage";

function paragraphsFromBody(bodyTrimmed: string): string[] {
  if (!bodyTrimmed) return [];
  return bodyTrimmed.split(/\r?\n\r?\n+/).filter((b) => b.trim().length > 0);
}

function flushBodyBlockAsParagraphs(block: string, out: Paragraph[]) {
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trimEnd();
    if (!trimmed) {
      out.push(new Paragraph({ children: [new TextRun({ text: "\u00a0" })] }));
      continue;
    }
    if (/^\s*-\s+/.test(trimmed)) {
      out.push(
        new Paragraph({
          text: trimmed.replace(/^\s*-\s+/, ""),
          bullet: { level: 0 },
        }),
      );
    } else {
      out.push(new Paragraph({ children: [new TextRun({ text: trimmed })] }));
    }
  }
}

function bodyToDocxParagraphs(rawBody: string): Paragraph[] {
  const blocks = paragraphsFromBody(String(rawBody ?? "").trim());
  if (!blocks.length) return [new Paragraph({ children: [new TextRun({ text: "\u00a0" })] })];
  const out: Paragraph[] = [];
  for (const block of blocks) flushBodyBlockAsParagraphs(block, out);
  return out;
}

/**
 * Spike-only POC: OOXML `.docx` buffer from the same branching as Markdown/HTML export.
 */
export async function renderExportPackageDocxSpike(opts: {
  issue: Pick<Issue, "title">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
}): Promise<Buffer> {
  const { issue, mode, format, artifact } = opts;
  const titlePlain = normalizeExportTerminology(issue.title);
  const body: Paragraph[] = [];

  const heading2 = (t: string) =>
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: normalizeExportTerminology(t) })],
      }),
    );

  if (format === "executive-brief" || mode === "executive") {
    body.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: titlePlain, bold: true })],
      }),
    );
    artifact.executive.blocks.forEach((b, i) => {
      heading2(executiveBriefExportBlockLabel(i, b.label));
      body.push(...bodyToDocxParagraphs(normalizeExportTerminology(b.body)));
    });
  } else if (format === "board-note") {
    body.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: `${titlePlain} — board note`, bold: true })],
      }),
    );
    body.push(
      new Paragraph({
        children: [
          new TextRun({
            text: normalizeExportTerminology(`Circulation: ${artifact.metadata.circulation}`),
            italics: true,
          }),
        ],
      }),
    );
    body.push(...bodyToDocxParagraphs(normalizeExportTerminology(artifact.lede)));
  } else if (format === "email-ready") {
    body.push(new Paragraph({ children: [new TextRun({ text: `Subject: ${titlePlain}`, bold: true })] }));
    body.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Circulation: ${normalizeExportTerminology(artifact.metadata.circulation)}`,
          }),
        ],
      }),
    );
    body.push(...bodyToDocxParagraphs(normalizeExportTerminology(artifact.lede)));
    body.push(new Paragraph({ children: [new TextRun({ text: "Immediate actions:", bold: true })] }));
    for (const a of artifact.executive.immediateActions) {
      body.push(
        new Paragraph({
          text: normalizeExportTerminology(a),
          bullet: { level: 0 },
        }),
      );
    }
  } else {
    body.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: titlePlain, bold: true })],
      }),
    );
    heading2("Lede");
    body.push(...bodyToDocxParagraphs(normalizeExportTerminology(artifact.lede)));
    artifact.full.sections.forEach((s) => {
      heading2(normalizeExportTerminology(s.title));
      body.push(...bodyToDocxParagraphs(normalizeExportTerminology(s.body)));
    });
  }

  const doc = new Document({
    sections: [{ children: body }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
