/**
 * Executive briefing pack DOCX — deliberate Metis template (tables, panels, scan-friendly blocks).
 */
import type { BriefArtifact } from "@metis/shared/briefVersion";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
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

import {
  parseExecutiveBriefPresentation,
  slicePresentationItems,
  type ExecutiveBriefLineItem,
} from "@/lib/brief/parseExecutiveBriefPresentation";
import {
  type BriefingPackContext,
  briefingPackFormatGeneratedAt,
  briefingPackRecordBasisLines,
  sanitizeExportText,
} from "./briefingPack";
import { normalizeExportTerminology } from "./exportDocumentUtils";

const FONT = "Segoe UI";
const INK = "141418";
const MUTED = "52525B";
const BORDER = "D4D4D8";
const PANEL_FILL = "FAFAF9";
const COVER_FILL = "F4F4F5";
const READ_FIRST_FILL = "FAF8F5";
const DECISION_FILL = "F8FAFC";
const DECISION_BORDER = "C5D4E4";
const GUARDRAIL_FILL = "FAF8F5";
const GUARDRAIL_BORDER = "D6CFC4";
const BRASS = "6B5E4A";
const ACCENT = "2C3E50";

const CELL_MARGIN = { top: 100, bottom: 100, left: 140, right: 140 };

function run(text: string, opts?: { bold?: boolean; italics?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text: sanitizeExportText(text),
    font: FONT,
    size: opts?.size ?? 22,
    bold: opts?.bold,
    italics: opts?.italics,
    color: opts?.color ?? INK,
  });
}

function mutedParagraph(text: string, opts?: { italics?: boolean; size?: number; after?: number }) {
  return new Paragraph({
    spacing: { after: opts?.after ?? 80 },
    children: [run(text, { color: MUTED, size: opts?.size ?? 18, italics: opts?.italics })],
  });
}

function eyebrow(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: 16,
        bold: true,
        color: BRASS,
        characterSpacing: 40,
      }),
    ],
  });
}

function panelTitle(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [run(text, { bold: true, size: 22, color: ACCENT })],
  });
}

function spacer(after = 160) {
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

function panelTable(rows: TableRow[], fill = PANEL_FILL, borderColor = BORDER) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(borderColor),
    rows,
  });
}

function panelCell(children: FileChild[], fill: string, borderColor = BORDER) {
  const paras = children.filter((c): c is Paragraph => c instanceof Paragraph);
  return new TableCell({
    shading: { fill },
    margins: CELL_MARGIN,
    borders: borders(borderColor),
    children: paras.length ? paras : [new Paragraph({ children: [run("\u00a0")] })],
  });
}

function panelRow(children: FileChild[], fill: string, borderColor = BORDER) {
  return new TableRow({ children: [panelCell(children, fill, borderColor)] });
}

function bulletParagraph(text: string, opts?: { size?: number }) {
  const cleaned = sanitizeExportText(text)
    .replace(/^do not say yet[:\s]*/i, "")
    .trim();
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: cleaned, font: FONT, size: opts?.size ?? 22, color: INK })],
  });
}

function bodyParagraph(text: string, opts?: { after?: number; size?: number }) {
  return new Paragraph({
    spacing: { after: opts?.after ?? 100 },
    children: [run(text, { size: opts?.size ?? 22 })],
  });
}

function lineItemParagraph(item: ExecutiveBriefLineItem, size = 18) {
  if (item.code) {
    return new Paragraph({
      spacing: { after: 50 },
      children: [
        new TextRun({ text: `${item.code}: `, font: FONT, size, bold: true, color: ACCENT }),
        new TextRun({ text: sanitizeExportText(item.text), font: FONT, size, color: INK }),
      ],
    });
  }
  return bulletParagraph(item.text, { size });
}

function flushParagraphs(text: string, out: Paragraph[], size = 22) {
  const parts = text.split(/\n{2,}/).map((p) => sanitizeExportText(p.replace(/\n/g, " "))).filter(Boolean);
  for (const p of parts) out.push(bodyParagraph(p, { size }));
}

function buildCoverPanel(ctx: BriefingPackContext, title: string, circulation: string) {
  const metaRows: [string, string][] = [
    ["Generated", briefingPackFormatGeneratedAt(ctx.generatedAt)],
    ["Owner", (ctx.issue.ownerName ?? "Not assigned").trim() || "Not assigned"],
    ["Status", ctx.issue.status],
    ["Severity", ctx.issue.severity],
    ["Circulation", circulation],
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E4E4E7" },
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: metaRows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { fill: "EEEDEB" },
              margins: { top: 60, bottom: 60, left: 100, right: 80 },
              children: [new Paragraph({ children: [run(k, { color: MUTED, size: 16 })] })],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 80, right: 100 },
              children: [new Paragraph({ children: [run(v, { size: 20 })] })],
            }),
          ],
        }),
    ),
  });

  const coverContent: Paragraph[] = [
    eyebrow("Executive briefing pack"),
    new Paragraph({
      spacing: { after: 100 },
      children: [run(title, { bold: true, size: 36, color: ACCENT })],
    }),
    mutedParagraph(ctx.sourceBriefLabel, { italics: true, size: 20, after: 200 }),
  ];

  return panelTable([
    panelRow(coverContent, COVER_FILL),
    new TableRow({
      children: [
        new TableCell({
          margins: { top: 0, bottom: 120, left: 140, right: 140 },
          children: [metaTable],
        }),
      ],
    }),
  ], COVER_FILL);
}

function buildReadFirstPanel(recordSufficiency: string | null, executiveSummary: string) {
  const paras: Paragraph[] = [
    eyebrow("Read first · Current position"),
  ];
  if (recordSufficiency) flushParagraphs(recordSufficiency, paras, 22);
  if (executiveSummary) {
    if (recordSufficiency) {
      paras.push(
        new Paragraph({
          spacing: { before: 120, after: 80 },
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER } },
          children: [],
        }),
      );
    }
    flushParagraphs(executiveSummary, paras, 22);
  }
  if (!recordSufficiency && !executiveSummary) {
    paras.push(mutedParagraph("No executive summary recorded.", { italics: true }));
  }
  return panelTable([panelRow(paras, READ_FIRST_FILL, GUARDRAIL_BORDER)], READ_FIRST_FILL, GUARDRAIL_BORDER);
}

function buildDecisionsPanel(
  decisions: { text: string; owner: string | null }[],
  defaultOwner: string,
) {
  const paras: Paragraph[] = [eyebrow("Action · Decisions needed")];
  if (!decisions.length) {
    paras.push(mutedParagraph("No decisions listed in this revision.", { italics: true }));
  } else {
    decisions.forEach((d, i) => {
      paras.push(
        new Paragraph({
          spacing: { after: 100 },
          indent: { left: 200 },
          children: [
            new TextRun({ text: `${i + 1}. `, font: FONT, bold: true, size: 22, color: BRASS }),
            new TextRun({ text: sanitizeExportText(d.text), font: FONT, size: 22, color: INK }),
          ],
        }),
      );
      const owner = d.owner ?? defaultOwner;
      if (owner && !/not assigned/i.test(owner)) {
        paras.push(
          new Paragraph({
            spacing: { after: 120 },
            indent: { left: 360 },
            children: [run(`Owner — ${owner}`, { color: MUTED, size: 16 })],
          }),
        );
      }
    });
  }
  return panelTable([panelRow(paras, DECISION_FILL, DECISION_BORDER)], DECISION_FILL, DECISION_BORDER);
}

function buildAssessmentGrid(
  rows: { label: string; value: string }[],
) {
  const tableRows = rows.map(
    ({ label, value }) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEDEB" },
            margins: CELL_MARGIN,
            children: [new Paragraph({ children: [run(label, { color: MUTED, size: 16 })] })],
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            margins: CELL_MARGIN,
            children: [new Paragraph({ children: [run(value, { size: 20 })] })],
          }),
        ],
      }),
  );

  const wrapper: Paragraph[] = [eyebrow("Status"), panelTitle("Current assessment")];
  return [
    panelTable([panelRow(wrapper, PANEL_FILL)]),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: borders(),
      rows: tableRows,
    }),
  ];
}

function buildGuardrailsPanel(safeToSay: string[], doNotSayYet: string[]) {
  const safeParas: Paragraph[] = [panelTitle("Safe to say")];
  if (safeToSay.length) {
    for (const line of safeToSay) safeParas.push(bulletParagraph(line));
  } else {
    safeParas.push(mutedParagraph("Use confirmed facts and sources before circulating externally.", { italics: true }));
  }

  const holdParas: Paragraph[] = [panelTitle("Do not say yet")];
  if (doNotSayYet.length) {
    for (const line of doNotSayYet) holdParas.push(bulletParagraph(line));
  } else {
    holdParas.push(mutedParagraph("No explicit hold lines — apply standard validation discipline.", { italics: true }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders(GUARDRAIL_BORDER),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: GUARDRAIL_FILL },
            margins: CELL_MARGIN,
            borders: borders(GUARDRAIL_BORDER),
            children: safeParas,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: "FFFFFF" },
            margins: CELL_MARGIN,
            borders: borders(GUARDRAIL_BORDER),
            children: holdParas,
          }),
        ],
      }),
    ],
  });
}

function buildMessageCard(msg: BriefingPackContext["messages"][number]) {
  const header: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [run(msg.templateLabel, { bold: true, size: 24, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        run(`Audience: ${msg.audienceLabel} · ${msg.approvalStatus}`, { color: MUTED, italics: true, size: 18 }),
      ],
    }),
  ];

  const primary: Paragraph[] = [];
  flushParagraphs(sanitizeExportText(msg.primaryBody), primary, 22);

  const support: Paragraph[] = [];
  for (const section of msg.supportingSections) {
    support.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        border: { top: { style: BorderStyle.DASHED, size: 1, color: BORDER } },
        children: [run(section.title, { bold: true, size: 18, color: MUTED })],
      }),
    );
    const supportBody: Paragraph[] = [];
    flushParagraphs(sanitizeExportText(section.body), supportBody, 18);
    support.push(...supportBody);
  }

  return panelTable(
    [panelRow([...header, ...primary, ...support], "FFFFFF")],
    "FFFFFF",
  );
}

function parseAssessmentRows(body: string, header: ReturnType<typeof parseExecutiveBriefPresentation>["header"]) {
  const out: { label: string; value: string }[] = [];
  const kv: Record<string, string> = {};
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (m) kv[m[1]!.trim().toLowerCase()] = sanitizeExportText(m[2]!);
  }

  const add = (label: string, value: string | undefined) => {
    if (value?.trim()) out.push({ label, value: sanitizeExportText(value) });
  };

  add("Status", kv.status ?? header.status);
  add("Briefing confidence", kv["briefing confidence"]);
  add("External position", kv["external position"]);
  add("Severity", kv.severity ?? header.severity);
  add("Urgency", kv.urgency ?? header.urgency);
  add("Briefing posture", kv["briefing posture"] ?? header.briefingPosture);
  add("Open questions", kv["open questions"] ?? header.openQuestionsLabel);
  add("Issue owner", kv["issue owner"] ?? header.owner);

  return out;
}

export async function renderBriefingPackDocx(
  ctx: BriefingPackContext,
  artifact: BriefArtifact,
): Promise<Buffer> {
  const title = sanitizeExportText(normalizeExportTerminology(ctx.issue.title));
  const circulation = sanitizeExportText(normalizeExportTerminology(artifact.metadata.circulation));

  const model = parseExecutiveBriefPresentation({
    artifact,
    issueTitle: ctx.issue.title,
    sourcesCount: ctx.issue.sourcesCount ?? undefined,
  });

  const assessmentBody =
    artifact.executive.blocks.find((b) => b.label.trim() === "Current assessment")?.body ?? "";

  const children: FileChild[] = [];

  children.push(buildCoverPanel(ctx, title, circulation));
  children.push(spacer(240));
  children.push(buildReadFirstPanel(model.position.recordSufficiency, model.position.executiveSummary));
  children.push(spacer(200));
  children.push(buildDecisionsPanel(model.decisions, model.header.owner));
  children.push(spacer(200));
  children.push(...buildAssessmentGrid(parseAssessmentRows(assessmentBody, model.header)));
  children.push(spacer(200));

  if (model.confirmedFacts.length) {
    const { shown, remainder } = slicePresentationItems(model.confirmedFacts, 6);
    children.push(eyebrow("Record basis"));
    children.push(panelTitle("Confirmed facts"));
    const paras: Paragraph[] = [];
    for (const f of shown) paras.push(bulletParagraph(f));
    if (remainder > 0) paras.push(mutedParagraph(`+${remainder} more on the full brief.`, { italics: true }));
    children.push(panelTable([panelRow(paras, PANEL_FILL)]));
    children.push(spacer(160));
  }

  if (model.claimsPositionSummary || model.claimGroups.length) {
    children.push(panelTitle("Claims and assumptions"));
    if (model.claimsPositionSummary) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: PANEL_FILL },
          children: [run(model.claimsPositionSummary, { bold: true, size: 20 })],
        }),
      );
    }
    for (const group of model.claimGroups) {
      const { shown, remainder } = slicePresentationItems(group.items, 4);
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [run(group.title, { bold: true, size: 20, color: ACCENT })],
        }),
      );
      if (group.caveat) {
        children.push(mutedParagraph(group.caveat, { italics: true, size: 18 }));
      }
      const itemParas: Paragraph[] = [];
      for (const item of shown) {
        itemParas.push(lineItemParagraph(item, 18));
      }
      if (remainder > 0) itemParas.push(mutedParagraph(`+${remainder} more.`, { italics: true, size: 16 }));
      children.push(panelTable([panelRow(itemParas, PANEL_FILL)]));
    }
    children.push(spacer(160));
  }

  if (model.openQuestions.length) {
    const { shown, remainder } = slicePresentationItems(model.openQuestions, 5);
    children.push(panelTitle("Open questions"));
    const paras: Paragraph[] = [];
    for (const q of shown) paras.push(bulletParagraph(q, { size: 20 }));
    if (remainder > 0) paras.push(mutedParagraph(`+${remainder} more — see Open questions in workspace.`, { italics: true }));
    children.push(panelTable([panelRow(paras, PANEL_FILL)]));
    children.push(spacer(160));
  }

  children.push(eyebrow("Circulation"));
  children.push(panelTitle("Comms guardrails"));
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [run("What may be said now versus what must stay off the record.", { color: MUTED, italics: true })],
    }),
  );
  children.push(buildGuardrailsPanel(model.safeToSay, model.doNotSayYet));
  children.push(spacer(160));

  if (model.evidenceSummary.trim()) {
    const lead = sanitizeExportText(model.evidenceSummary.split(/\n{2,}/)[0] ?? "");
    if (lead) {
      children.push(panelTitle("Evidence base"));
      children.push(bodyParagraph(lead, { size: 20 }));
      children.push(spacer(120));
    }
  }

  if (model.observationsSummary.trim()) {
    const lead = sanitizeExportText(model.observationsSummary.split(/\n{2,}/)[0] ?? "");
    if (lead) {
      children.push(panelTitle("Observations"));
      children.push(bodyParagraph(lead, { size: 20 }));
      children.push(spacer(120));
    }
  }

  if (model.audienceImplications) {
    children.push(panelTitle("Audience implications"));
    const audienceParas: Paragraph[] = [];
    flushParagraphs(sanitizeExportText(model.audienceImplications), audienceParas, 20);
    children.push(...audienceParas);
    children.push(spacer(120));
  }

  if (ctx.messages.length > 0) {
    children.push(pageBreak());
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
        children: [run("Message drafts", { bold: true, size: 28, color: ACCENT })],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          run(
            "Copy-ready drafts from the current issue record. Review caveats are shown separately from primary copy.",
            { color: MUTED, italics: true },
          ),
        ],
      }),
    );
    for (const msg of ctx.messages) {
      children.push(buildMessageCard(msg));
      children.push(spacer(200));
    }
  }

  children.push(pageBreak());
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [run("Record basis", { bold: true, size: 28, color: ACCENT })],
    }),
  );

  const basisLines = briefingPackRecordBasisLines(ctx, artifact);
  const countRows = basisLines.slice(1).map(
    (line) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: CELL_MARGIN,
            children: [new Paragraph({ children: [run(line, { size: 20 })] })],
          }),
        ],
      }),
  );

  children.push(
    panelTable([
      panelRow([bodyParagraph(basisLines[0] ?? "", { size: 20 })], PANEL_FILL),
    ]),
  );
  if (countRows.length) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: borders(),
        rows: countRows,
      }),
    );
  }

  children.push(spacer(280));
  children.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: BORDER } },
      spacing: { before: 160 },
      alignment: AlignmentType.LEFT,
      children: [
        run(
          `Prepared in Metis from ${ctx.sourceBriefLabel}. Draft for internal review — confirm facts, approvals, and audience fit before external circulation.`,
          { color: MUTED, italics: true, size: 18 },
        ),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: INK },
          paragraph: { spacing: { line: 276, after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
