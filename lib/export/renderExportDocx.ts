/**
 * Production DOCX export: OOXML buffer from the same semantic branching as Markdown/HTML.
 * Beta: unsupported for `email-ready` ({@link isExportDocxSupported} guards requests).
 */

import type { Issue } from "@prisma/client";
import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import type { ExportFormat } from "@metis/shared/export";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import {
  buildExportAuditAppendixDocStructure,
  type ExportAuditAppendixDocNode,
  type ExportAuditAppendixInput,
} from "./buildExportAuditAppendix";
import { shouldUseBriefingPackRenderer, type BriefingPackContext } from "./briefingPack";
import { renderBriefingPackDocx } from "./renderBriefingPackDocx";
import { executiveBriefExportBlockLabel, normalizeExportTerminology } from "./exportDocumentUtils";

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

/** Audit appendix copy matches Markdown/HTML (no export terminology normalization on appendix strings). */
function appendixDocNodesToParagraphs(nodes: ExportAuditAppendixDocNode[]): Paragraph[] {
  const out: Paragraph[] = [];
  for (const n of nodes) {
    if (n.type === "heading2") {
      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(n.text)],
        }),
      );
    } else if (n.type === "heading3") {
      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun(n.text)],
        }),
      );
    } else if (n.type === "italicParagraph") {
      out.push(
        new Paragraph({
          children: [new TextRun({ text: n.text, italics: true })],
        }),
      );
    } else {
      out.push(
        new Paragraph({
          text: n.text,
          bullet: { level: 0 },
        }),
      );
    }
  }
  return out;
}

function bodyToDocxParagraphs(rawBody: string): Paragraph[] {
  const blocks = paragraphsFromBody(String(rawBody ?? "").trim());
  if (!blocks.length) return [new Paragraph({ children: [new TextRun({ text: "\u00a0" })] })];
  const out: Paragraph[] = [];
  for (const block of blocks) flushBodyBlockAsParagraphs(block, out);
  return out;
}

export async function renderExportPackageDocx(opts: {
  issue: Pick<Issue, "title" | "id">;
  mode: BriefMode;
  format: ExportFormat;
  artifact: BriefArtifact;
  /** Required for full-issue-brief DOCX (audit appendix). Loaded by the API route. */
  auditAppendix?: ExportAuditAppendixInput;
  briefingPack?: BriefingPackContext | null;
}): Promise<Buffer> {
  const { issue, mode, format, artifact, auditAppendix, briefingPack } = opts;

  if (format === "email-ready") {
    throw new Error("DOCX export does not support email-ready format");
  }

  if (briefingPack && shouldUseBriefingPackRenderer(format, mode)) {
    return renderBriefingPackDocx(briefingPack, artifact);
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

    if (!auditAppendix) {
      throw new Error("full-issue-brief DOCX requires auditAppendix payload");
    }
    body.push(...appendixDocNodesToParagraphs(buildExportAuditAppendixDocStructure(auditAppendix)));
  }

  const doc = new Document({
    sections: [{ children: body }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
