/**
 * Production DOCX export: OOXML buffer from the same semantic branching as Markdown/HTML.
 * Beta: unsupported for `email-ready` ({@link isExportDocxSupported} guards requests).
 */

import type { Issue } from "@prisma/client";
import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import { executiveBriefExportBlockLabel, normalizeExportTerminology } from "./renderExportPackage";

/** Brief packages that beta DOCX targets (matches UI / API guards). */
export function isExportDocxSupported(format: ExportFormat): boolean {
  return format === "full-issue-brief" || format === "executive-brief" || format === "board-note";
}

export const EXPORT_DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;

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

export async function renderExportPackageDocx(opts: {
  issue: Pick<Issue, "title">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
}): Promise<Buffer> {
  const { issue, mode, format, artifact } = opts;

  if (format === "email-ready") {
    throw new Error("DOCX export does not support email-ready format");
  }

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
