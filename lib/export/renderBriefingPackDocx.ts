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
import { buildCompactExecutivePackView, COMPACT_EXEC_PACK_LAYOUT_MARKER } from "./compactExecutivePackDocx";
import {
  decodeExportHtmlEntitiesForPlainText,
  normalizeExportTerminology,
} from "./exportDocumentUtils";

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

const CELL_MARGIN = { top: 60, bottom: 60, left: 100, right: 100 };
const PAGE_MARGIN = { top: 720, right: 720, bottom: 720, left: 720 };

function docxPlainText(text: string): string {
  return decodeExportHtmlEntitiesForPlainText(sanitizeExportText(text));
}

function run(text: string, opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text: docxPlainText(text),
    font: FONT,
    size: opts?.size ?? 18,
    bold: opts?.bold,
    italics: opts?.italics,
    color: opts?.color ?? INK,
  });
}

function eyebrow(text: string, after = 40) {
  return new Paragraph({
    spacing: { after },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: 12,
        bold: true,
        color: BRASS,
        characterSpacing: 32,
      }),
    ],
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { before: 60, after: 40 },
    children: [run(text, { bold: true, size: 20, color: ACCENT })],
  });
}

function muted(text: string, after = 40) {
  return new Paragraph({
    spacing: { after },
    children: [run(text, { color: MUTED, size: 16, italics: true })],
  });
}

function spacer(after = 50) {
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

/** Plain-text dash rows — avoids Word `bullet` without numbering config (shows as repeated `1.`). */
function dashRow(text: string, size = 18) {
  return new Paragraph({
    spacing: { after: 28 },
    indent: { left: 180, hanging: 120 },
    children: [
      new TextRun({ text: "– ", font: FONT, size, color: BRASS }),
      new TextRun({ text: docxPlainText(text), font: FONT, size, color: INK }),
    ],
  });
}

function lineItem(item: ExecutiveBriefLineItem) {
  if (item.code) {
    return new Paragraph({
      spacing: { after: 28 },
      indent: { left: 180, hanging: 120 },
      children: [
        new TextRun({ text: `${item.code}: `, font: FONT, size: 16, bold: true, color: ACCENT }),
        new TextRun({ text: docxPlainText(item.text), font: FONT, size: 16, color: INK }),
      ],
    });
  }
  return dashRow(item.text, 16);
}

function compactListTable(items: string[], emptyLabel: string) {
  const paras = items.length ? items.map((t) => dashRow(t, 16)) : [muted(emptyLabel, 0)];
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
            children: paras,
          }),
        ],
      }),
    ],
  });
}

function buildCompactHeaderStrip(
  ctx: BriefingPackContext,
  pack: ReturnType<typeof buildCompactExecutivePackView>,
  title: string,
) {
  const metaCells: [string, string][] = [
    ["Generated", briefingPackFormatGeneratedAt(ctx.generatedAt)],
    ["Owner", pack.ownerLabel],
    ["Status", pack.statusLabel],
    ["Severity", pack.severityLabel],
    ["Circulation", pack.circulation],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: metaCells.length,
            shading: { fill: STRIP_FILL },
            margins: { top: 80, bottom: 60, left: 120, right: 120 },
            borders: borders(),
            children: [
              eyebrow("Executive briefing pack", 30),
              new Paragraph({
                spacing: { after: 30 },
                children: [run(title, { bold: true, size: 28, color: ACCENT })],
              }),
              muted(pack.generatedLabel, 0),
            ],
          }),
        ],
      }),
      new TableRow({
        children: metaCells.map(([label, value]) =>
          new TableCell({
            width: { size: Math.floor(100 / metaCells.length), type: WidthType.PERCENTAGE },
            shading: { fill: "FFFFFF" },
            margins: CELL_MARGIN,
            borders: borders(),
            children: [
              new Paragraph({ spacing: { after: 20 }, children: [run(label, { size: 14, color: MUTED })] }),
              new Paragraph({ children: [run(value, { size: 16, bold: true })] }),
            ],
          }),
        ),
      }),
    ],
  });
}

function buildReadFirstStrip(paragraphs: string[]) {
  const paras: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [run("Read first", { bold: true, size: 18, color: ACCENT })],
    }),
  ];
  const shown = paragraphs.slice(0, 2);
  if (!shown.length) {
    paras.push(muted("No executive summary recorded.", 0));
  } else {
    for (const p of shown) {
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [run(p, { size: 17 })],
        }),
      );
    }
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(BRASS),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: READ_FIRST_FILL },
            margins: CELL_MARGIN,
            borders: {
              ...borders(BRASS),
              left: { style: BorderStyle.SINGLE, size: 12, color: BRASS },
            },
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
        width: { size: 7, type: WidthType.PERCENTAGE },
        shading: { fill: "EEEDEB" },
        margins: CELL_MARGIN,
        children: [new Paragraph({ children: [run("#", { bold: true, size: 14, color: MUTED })] })],
      }),
      new TableCell({
        width: { size: 93, type: WidthType.PERCENTAGE },
        shading: { fill: "EEEDEB" },
        margins: CELL_MARGIN,
        children: [new Paragraph({ children: [run("Decision needed", { bold: true, size: 14, color: MUTED })] })],
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
                  children: [new Paragraph({ children: [run(String(i + 1), { size: 16, color: BRASS, bold: true })] })],
                }),
                new TableCell({
                  margins: CELL_MARGIN,
                  children: [new Paragraph({ children: [run(text, { size: 17 })] })],
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
  const pairs: TableRow[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i]!;
    const right = rows[i + 1];
    pairs.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: CELL_MARGIN,
            borders: borders(),
            children: [
              new Paragraph({ spacing: { after: 16 }, children: [run(left.label, { size: 14, color: MUTED })] }),
              new Paragraph({ children: [run(left.value, { size: 16 })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: CELL_MARGIN,
            borders: borders(),
            children: right
              ? [
                  new Paragraph({ spacing: { after: 16 }, children: [run(right.label, { size: 14, color: MUTED })] }),
                  new Paragraph({ children: [run(right.value, { size: 16 })] }),
                ]
              : [new Paragraph({ children: [run("\u00a0", { size: 16 })] })],
          }),
        ],
      }),
    );
  }

  return [
    sectionTitle("Current status"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: pairs.length ? pairs : [new TableRow({ children: [new TableCell({ children: [muted("—", 0)] })] })],
    }),
  ];
}

function buildGuardrailsTable(safeToSay: string[], doNotSayYet: string[]) {
  const safeParas: Paragraph[] = [
    new Paragraph({ spacing: { after: 40 }, children: [run("Safe to say", { bold: true, size: 18 })] }),
  ];
  if (safeToSay.length) {
    for (const line of safeToSay) safeParas.push(dashRow(line, 16));
  } else {
    safeParas.push(muted("Use confirmed facts before external circulation.", 0));
  }

  const holdParas: Paragraph[] = [
    new Paragraph({ spacing: { after: 40 }, children: [run("Do not say yet", { bold: true, size: 18 })] }),
  ];
  if (doNotSayYet.length) {
    for (const line of doNotSayYet) holdParas.push(dashRow(line, 16));
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
  const primary = docxPlainText(msg.primaryBody).replace(/\n+/g, " ").trim();
  const paras: Paragraph[] = [
    new Paragraph({
      spacing: { after: 30 },
      children: [run(msg.templateLabel, { bold: true, size: 18, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 50 },
      children: [run(`${msg.audienceLabel} · ${msg.approvalStatus}`, { color: MUTED, italics: true, size: 14 })],
    }),
  ];
  if (primary) paras.push(new Paragraph({ spacing: { after: 0 }, children: [run(primary, { size: 17 })] }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(),
    rows: [new TableRow({ children: [new TableCell({ margins: CELL_MARGIN, borders: borders(), children: paras })] })],
  });
}

function buildRecordBasisBlock(lines: string[]) {
  const paras: Paragraph[] = [];
  if (lines[0]) {
    paras.push(new Paragraph({ spacing: { after: 40 }, children: [run(lines[0], { size: 16 })] }));
  }
  for (const line of lines.slice(1)) paras.push(dashRow(line, 16));

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

  // Page 1 — decision view
  children.push(buildCompactHeaderStrip(ctx, pack, title));
  children.push(spacer(40));
  children.push(buildReadFirstStrip(pack.readFirstParagraphs));
  children.push(spacer(40));
  children.push(...buildDecisionsTable(pack.decisions));
  children.push(spacer(40));
  children.push(...buildStatusGrid(pack.statusRows));

  if (pack.confirmedFacts.length) {
    children.push(sectionTitle("Confirmed facts"));
    children.push(compactListTable(pack.confirmedFacts, "No confirmed facts recorded."));
  }

  if (pack.validationClaims.length) {
    children.push(sectionTitle("Claims needing validation"));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                margins: CELL_MARGIN,
                borders: borders(),
                children: pack.validationClaims.map((c) => lineItem(c)),
              }),
            ],
          }),
        ],
      }),
    );
  }

  if (pack.openQuestions.length) {
    children.push(sectionTitle("Critical open questions"));
    children.push(compactListTable(pack.openQuestions, "No open questions recorded."));
  }

  // Page 2 — circulation view
  children.push(pageBreak());
  children.push(...buildGuardrailsTable(pack.safeToSay, pack.doNotSayYet));
  children.push(spacer(40));

  if (pack.messages.length) {
    children.push(sectionTitle("Key message lines"));
    for (const msg of pack.messages) {
      children.push(buildMessageCard(msg));
      children.push(spacer(40));
    }
  }

  children.push(sectionTitle("Record basis"));
  children.push(buildRecordBasisBlock(pack.recordBasisLines));
  children.push(spacer(60));
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER } },
      spacing: { before: 60 },
      children: [
        run(
          `${COMPACT_EXEC_PACK_LAYOUT_MARKER}. Prepared in Metis from ${pack.sourceBriefLabel}. Draft for internal review — confirm facts, approvals, and audience fit before external circulation.`,
          { color: MUTED, italics: true, size: 14 },
        ),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 18, color: INK },
          paragraph: { spacing: { line: 240, after: 40 } },
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
