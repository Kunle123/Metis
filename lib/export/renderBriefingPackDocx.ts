/**
 * Executive briefing pack DOCX — mirrors HTML/Markdown pack structure and content prep.
 */
import type { BriefArtifact } from "@metis/shared/briefVersion";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";

import {
  type BriefingPackContext,
  briefingPackFormatGeneratedAt,
  briefingPackFormatLabel,
  briefingPackRecordBasisLines,
  getOrderedExecutiveBlocks,
  prepareExecutiveBlockBodyForExport,
  sanitizeExportText,
} from "./briefingPack";
import { normalizeExportTerminology } from "./exportDocumentUtils";

const MUTED = "52525B";
const ACCENT = "2C3E50";
const DECISION_FILL = "F8FAFC";
const GUARDRAIL_FILL = "FAF8F5";

function paragraphsFromBody(bodyTrimmed: string): string[] {
  if (!bodyTrimmed) return [];
  return bodyTrimmed.split(/\r?\n\r?\n+/).filter((b) => b.trim().length > 0);
}

function stripMarkdownHeading(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function blockVariant(label: string): "decisions" | "guardrails" | "default" {
  if (label === "Recommended decisions / next actions") return "decisions";
  if (label === "What not to say yet / uncertainty guardrails") return "guardrails";
  return "default";
}

function mutedRun(text: string, opts?: { italics?: boolean; size?: number }) {
  return new TextRun({
    text,
    color: MUTED,
    italics: opts?.italics,
    size: opts?.size,
  });
}

function heading1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 28 })],
  });
}

function heading2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 24 })],
  });
}

function heading3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 22 })],
  });
}

function pageBreakParagraph() {
  return new Paragraph({ children: [new PageBreak()] });
}

function bodyBlockShading(label: string): { fill: string } | undefined {
  const v = blockVariant(label);
  if (v === "decisions") return { fill: DECISION_FILL };
  if (v === "guardrails") return { fill: GUARDRAIL_FILL };
  return undefined;
}

function flushBodyToParagraphs(rawBody: string, out: Paragraph[], sectionLabel: string) {
  const shading = bodyBlockShading(sectionLabel);
  const blocks = paragraphsFromBody(rawBody);
  if (!blocks.length) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: "\u00a0" })],
        ...(shading ? { shading } : {}),
      }),
    );
    return;
  }

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^#{1,6}\s+/.test(line)) {
        out.push(heading3(stripMarkdownHeading(line)));
        continue;
      }
      const bulletMatch = line.match(/^\s*-\s+(.*)$/);
      if (bulletMatch) {
        out.push(
          new Paragraph({
            text: sanitizeExportText(bulletMatch[1] ?? ""),
            bullet: { level: 0 },
            spacing: { after: 80 },
            ...(shading ? { shading } : {}),
          }),
        );
        continue;
      }
      out.push(
        new Paragraph({
          children: [new TextRun({ text: sanitizeExportText(line) })],
          spacing: { after: 120 },
          ...(shading ? { shading } : {}),
        }),
      );
    }
  }
}

function metadataParagraphs(ctx: BriefingPackContext, circulation: string, out: Paragraph[]) {
  const rows: [string, string][] = [
    ["Generated", briefingPackFormatGeneratedAt(ctx.generatedAt)],
    ["Owner", (ctx.issue.ownerName ?? "Not assigned").trim() || "Not assigned"],
    ["Status", ctx.issue.status],
    ["Severity", ctx.issue.severity],
    ["Circulation", circulation],
  ];

  for (const [key, value] of rows) {
    out.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${key}: `, bold: true, size: 18, color: MUTED }),
          new TextRun({ text: sanitizeExportText(value), size: 20 }),
        ],
      }),
    );
  }
}

function messageDraftSection(msg: BriefingPackContext["messages"][number], out: Paragraph[]) {
  out.push(heading3(msg.templateLabel));
  out.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        mutedRun(`Audience: ${msg.audienceLabel} · ${msg.approvalStatus}`, { italics: true, size: 18 }),
      ],
    }),
  );

  const primary = sanitizeExportText(msg.primaryBody);
  flushBodyToParagraphs(primary, out, "message-primary");

  for (const section of msg.supportingSections) {
    out.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        border: { top: { style: BorderStyle.DASHED, size: 1, color: "D4D4D8" } },
        children: [new TextRun({ text: section.title, bold: true, size: 18, color: MUTED })],
      }),
    );
    flushBodyToParagraphs(sanitizeExportText(section.body), out, "message-support");
  }

  out.push(new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "" })] }));
}

export async function renderBriefingPackDocx(
  ctx: BriefingPackContext,
  artifact: BriefArtifact,
): Promise<Buffer> {
  const title = sanitizeExportText(normalizeExportTerminology(ctx.issue.title));
  const packageLabel = briefingPackFormatLabel(ctx.format);
  const circulation = sanitizeExportText(normalizeExportTerminology(artifact.metadata.circulation));

  const body: Paragraph[] = [];

  body.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [mutedRun(`${packageLabel} · ${ctx.sourceBriefLabel}`, { italics: true })],
    }),
  );
  body.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 36, color: ACCENT })],
    }),
  );
  metadataParagraphs(ctx, circulation, body);
  body.push(new Paragraph({ spacing: { after: 280 }, children: [] }));

  body.push(heading1("Executive brief"));

  for (const block of getOrderedExecutiveBlocks(artifact)) {
    const label = normalizeExportTerminology(block.label);
    const prepared = prepareExecutiveBlockBodyForExport(label, block.body);
    body.push(heading2(label));
    flushBodyToParagraphs(prepared, body, label);
  }

  if (ctx.messages.length > 0) {
    body.push(pageBreakParagraph());
    body.push(heading1("Message drafts"));
    body.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          mutedRun(
            "Copy-ready drafts from the current issue record. Review caveats are shown separately from primary copy.",
            { italics: true },
          ),
        ],
      }),
    );
    for (const msg of ctx.messages) {
      messageDraftSection(msg, body);
    }
  }

  body.push(pageBreakParagraph());
  body.push(heading1("Record basis"));
  const basisLines = briefingPackRecordBasisLines(ctx, artifact);
  body.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: basisLines[0] ?? "" })],
      shading: { fill: "F4F4F5" },
    }),
  );
  for (const line of basisLines.slice(1)) {
    body.push(
      new Paragraph({
        text: line,
        bullet: { level: 0 },
        spacing: { after: 60 },
      }),
    );
  }

  body.push(new Paragraph({ spacing: { before: 360 }, children: [] }));
  body.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "D4D4D8" } },
      spacing: { before: 200 },
      children: [
        mutedRun(
          `Prepared in Metis from ${ctx.sourceBriefLabel}. Draft for internal review — confirm facts, approvals, and audience fit before external circulation.`,
          { italics: true, size: 18 },
        ),
      ],
    }),
  );

  const doc = new Document({
    sections: [{ children: body }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
