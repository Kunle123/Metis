/**
 * Executive briefing pack DOCX — compact 2-page template (decision view + circulation view).
 */
import type { BriefArtifact } from "@metis/shared/briefVersion";
import {
  BorderStyle,
  Document,
  type FileChild,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { parseExecutiveBriefPresentation } from "@/lib/brief/parseExecutiveBriefPresentation";
import type { ExecutiveBriefLineItem } from "@/lib/brief/parseExecutiveBriefPresentation";
import {
  type BriefingPackContext,
  briefingPackFormatGeneratedAt,
  sanitizeExportText,
} from "./briefingPack";
import { buildCompactExecutivePackView } from "./compactExecutivePackDocx";
import { normalizeExportTerminology } from "./exportDocumentUtils";

const FONT = "Segoe UI";
const INK = "141418";
const MUTED = "52525B";
const BORDER = "D4D4D8";
const PANEL_FILL = "FAFAF9";
const STRIP_FILL = "F4F4F5";
const READ_FIRST_FILL = "FAF8F5";
const GUARDRAIL_FILL = "FAF8F5";
const BRASS = "6B5E4A";
const ACCENT = "2C3E50";

const CELL_MARGIN = { top: 80, bottom: 80, left: 120, right: 120 };
const PAGE_MARGIN = { top: 900, right: 900, bottom: 900, left: 900 };

function run(text: string, opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text: sanitizeExportText(text),
    font: FONT,
    size: opts?.size ?? 20,
    bold: opts?.bold,
    italics: opts?.italics,
    color: opts?.color ?? INK,
  });
}

function eyebrow(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: 14,
        bold: true,
        color: BRASS,
        characterSpacing: 36,
      }),
    ],
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 60 },
    children: [run(text, { bold: true, size: 22, color: ACCENT })],
  });
}

function muted(text: string, after = 60) {
  return new Paragraph({
    spacing: { after },
    children: [run(text, { color: MUTED, size: 18, italics: true })],
  });
}

function spacer(after = 100) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function borders(color = BORDER) {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color },
    bottom: { style: BorderStyle.SINGLE, size: 1, color },
    left: { style: BorderStyle.SINGLE, size: 1, color },
    right: { style: BorderStyle.SINGLE, size: 1, color },
  };
}

function bullet(text: string, size = 20) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [run(text, { size })],
  });
}

function lineItem(item: ExecutiveBriefLineItem) {
  if (item.code) {
    return new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: `${item.code}: `, font: FONT, size: 18, bold: true, color: ACCENT }),
        new TextRun({ text: sanitizeExportText(item.text), font: FONT, size: 18, color: INK }),
      ],
    });
  }
  return bullet(item.text, 18);
}

function buildMetadataStrip(
  ctx: BriefingPackContext,
  pack: ReturnType<typeof buildCompactExecutivePackView>,
  title: string,
) {
  const cells: [string, string][] = [
    ["Generated", briefingPackFormatGeneratedAt(ctx.generatedAt)],
    ["Owner", pack.ownerLabel],
    ["Status", pack.statusLabel],
    ["Severity", pack.severityLabel],
    ["Circulation", pack.circulation],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" },
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: STRIP_FILL },
            margins: { top: 120, bottom: 80, left: 140, right: 140 },
            children: [
              eyebrow("Executive briefing pack"),
              new Paragraph({
                spacing: { after: 40 },
                children: [run(title, { bold: true, size: 32, color: ACCENT })],
              }),
              muted(pack.generatedLabel, 0),
            ],
          }),
        ],
      }),
      ...cells.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: { fill: "EEEDEB" },
                margins: CELL_MARGIN,
                children: [new Paragraph({ children: [run(label, { color: MUTED, size: 16 })] })],
              }),
              new TableCell({
                width: { size: 72, type: WidthType.PERCENTAGE },
                margins: CELL_MARGIN,
                children: [new Paragraph({ children: [run(value, { size: 18 })] })],
              }),
            ],
          }),
      ),
    ],
  });
}

function buildReadFirstPanel(paragraphs: string[]) {
  const paras: Paragraph[] = [eyebrow("Read first · Current position")];
  if (!paragraphs.length) {
    paras.push(muted("No executive summary recorded."));
  } else {
    for (const p of paragraphs) {
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [run(p, { size: 20 })],
        }),
      );
    }
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: READ_FIRST_FILL },
            margins: CELL_MARGIN,
            borders: borders(),
            children: paras,
          }),
        ],
      }),
    ],
  });
}

function buildDecisionsTable(decisions: string[]) {
  const header = new TableRow({
    children: [
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "EEEDEB" },
        margins: CELL_MARGIN,
        children: [new Paragraph({ children: [run("#", { bold: true, size: 16, color: MUTED })] })],
      }),
      new TableCell({
        width: { size: 92, type: WidthType.PERCENTAGE },
        shading: { fill: "EEEDEB" },
        margins: CELL_MARGIN,
        children: [new Paragraph({ children: [run("Decision", { bold: true, size: 16, color: MUTED })] })],
      }),
    ],
  });

  const rows =
    decisions.length > 0
      ? decisions.map(
          (text, i) =>
            new TableRow({
              children: [
                new TableCell({
                  margins: CELL_MARGIN,
                  children: [new Paragraph({ children: [run(String(i + 1), { size: 18, color: BRASS })] })],
                }),
                new TableCell({
                  margins: CELL_MARGIN,
                  children: [new Paragraph({ children: [run(text, { size: 20 })] })],
                }),
              ],
            }),
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                margins: CELL_MARGIN,
                children: [muted("No decisions listed in this revision.", 0)],
              }),
            ],
          }),
        ];

  return [
    sectionTitle("Decisions needed"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [header, ...rows],
    }),
  ];
}

function buildStatusGrid(rows: { label: string; value: string }[]) {
  const tableRows = rows.map(
    ({ label, value }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEDEB" },
            margins: CELL_MARGIN,
            children: [new Paragraph({ children: [run(label, { color: MUTED, size: 16 })] })],
          }),
          new TableCell({
            width: { size: 64, type: WidthType.PERCENTAGE },
            margins: CELL_MARGIN,
            children: [new Paragraph({ children: [run(value, { size: 18 })] })],
          }),
        ],
      }),
  );

  return [
    sectionTitle("Current status"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: tableRows.length ? tableRows : [new TableRow({ children: [new TableCell({ children: [muted("—", 0)] })] })],
    }),
  ];
}

function buildGuardrailsTable(safeToSay: string[], doNotSayYet: string[]) {
  const safeParas: Paragraph[] = [new Paragraph({ spacing: { after: 50 }, children: [run("Safe to say", { bold: true, size: 20 })] })];
  if (safeToSay.length) {
    for (const line of safeToSay) safeParas.push(bullet(line, 18));
  } else {
    safeParas.push(muted("Use confirmed facts before external circulation.", 0));
  }

  const holdParas: Paragraph[] = [
    new Paragraph({ spacing: { after: 50 }, children: [run("Do not say yet", { bold: true, size: 20 })] }),
  ];
  if (doNotSayYet.length) {
    for (const line of doNotSayYet) holdParas.push(bullet(line, 18));
  } else {
    holdParas.push(muted("No explicit hold lines — apply validation discipline.", 0));
  }

  return [
    sectionTitle("Comms guardrails"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: GUARDRAIL_FILL },
              margins: CELL_MARGIN,
              borders: borders(),
              children: safeParas,
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: CELL_MARGIN,
              borders: borders(),
              children: holdParas,
            }),
          ],
        }),
      ],
    }),
  ];
}

function buildMessageCard(msg: BriefingPackContext["messages"][number]) {
  const paras: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [run(msg.templateLabel, { bold: true, size: 22, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [run(`${msg.audienceLabel} · ${msg.approvalStatus}`, { color: MUTED, italics: true, size: 16 })],
    }),
  ];

  const primary = sanitizeExportText(msg.primaryBody).replace(/\n+/g, " ").trim();
  if (primary) {
    paras.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [run(primary, { size: 20 })],
      }),
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: CELL_MARGIN,
            borders: borders(),
            children: paras,
          }),
        ],
      }),
    ],
  });
}

function buildRecordBasisBlock(lines: string[]) {
  const paras: Paragraph[] = lines.map((line) =>
    line === lines[0]
      ? new Paragraph({ spacing: { after: 60 }, children: [run(line, { size: 18 })] })
      : bullet(line, 18),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: PANEL_FILL },
            margins: CELL_MARGIN,
            borders: borders(),
            children: paras.length ? paras : [muted("Record counts unavailable.", 0)],
          }),
        ],
      }),
    ],
  });
}

export async function renderBriefingPackDocx(
  ctx: BriefingPackContext,
  artifact: BriefArtifact,
): Promise<Buffer> {
  const title = sanitizeExportText(normalizeExportTerminology(ctx.issue.title));
  const model = parseExecutiveBriefPresentation({
    artifact,
    issueTitle: ctx.issue.title,
    sourcesCount: ctx.issue.sourcesCount ?? undefined,
  });

  const assessmentBody =
    artifact.executive.blocks.find((b) => b.label.trim() === "Current assessment")?.body ?? "";

  const pack = buildCompactExecutivePackView(model, ctx, artifact, assessmentBody);
  const children: FileChild[] = [];

  // —— Page 1: decision view ——
  children.push(buildMetadataStrip(ctx, pack, title));
  children.push(spacer(80));
  children.push(buildReadFirstPanel(pack.readFirstParagraphs));
  children.push(spacer(80));
  children.push(...buildDecisionsTable(pack.decisions));
  children.push(spacer(80));
  children.push(...buildStatusGrid(pack.statusRows));

  if (pack.confirmedFacts.length) {
    children.push(sectionTitle("Confirmed facts"));
    const factParas = pack.confirmedFacts.map((f) => bullet(f, 18));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [new TableRow({ children: [new TableCell({ margins: CELL_MARGIN, children: factParas })] })],
      }),
    );
  }

  if (pack.validationClaims.length) {
    children.push(sectionTitle("Claims needing validation"));
    const claimParas = pack.validationClaims.map((c) => lineItem(c));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [new TableRow({ children: [new TableCell({ margins: CELL_MARGIN, children: claimParas })] })],
      }),
    );
  }

  if (pack.openQuestions.length) {
    children.push(sectionTitle("Critical open questions"));
    const qParas = pack.openQuestions.map((q) => bullet(q, 18));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [new TableRow({ children: [new TableCell({ margins: CELL_MARGIN, children: qParas })] })],
      }),
    );
  }

  // —— Page 2: circulation view ——
  children.push(pageBreak());
  children.push(...buildGuardrailsTable(pack.safeToSay, pack.doNotSayYet));
  children.push(spacer(80));

  if (pack.messages.length) {
    children.push(sectionTitle("Key message lines"));
    for (const msg of pack.messages) {
      children.push(buildMessageCard(msg));
      children.push(spacer(60));
    }
  }

  children.push(sectionTitle("Record basis"));
  children.push(buildRecordBasisBlock(pack.recordBasisLines));
  children.push(spacer(120));
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER } },
      spacing: { before: 100 },
      children: [
        run(
          `Prepared in Metis from ${pack.sourceBriefLabel}. Draft for internal review — confirm facts, approvals, and audience fit before external circulation.`,
          { color: MUTED, italics: true, size: 16 },
        ),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 20, color: INK },
          paragraph: { spacing: { line: 260, after: 60 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: PAGE_MARGIN } },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
