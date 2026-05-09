import { prisma } from "@/lib/db/prisma";
import { formatGapCode, formatObservationCode } from "@/lib/issueRecordCodes";

/** Minimal issue rows for export-time audit appendix (Markdown + HTML). */
export type ExportAuditAppendixInput = {
  sources: Array<{
    sourceCode: string;
    title: string;
    tier: string;
    linkedSection: string | null;
    reliability: string | null;
  }>;
  gaps: Array<{
    gapNumber: number;
    status: string;
    severity: string;
    linkedSection: string | null;
    prompt: string;
    resolvedByInternalInputId: string | null;
  }>;
  internalInputs: Array<{
    id: string;
    observationNumber: number;
    role: string;
    name: string;
    confidence: string;
    linkedSection: string | null;
    excludedFromBrief: boolean;
    response: string;
  }>;
};

function escapeAppendixHtml(input: string) {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clampLine(s: string, max: number) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export async function loadExportAuditAppendixPayload(issueId: string): Promise<ExportAuditAppendixInput> {
  const [sources, gaps, internalInputs] = await Promise.all([
    prisma.source.findMany({
      where: { issueId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        sourceCode: true,
        title: true,
        tier: true,
        linkedSection: true,
        reliability: true,
      },
    }),
    prisma.gap.findMany({
      where: { issueId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        gapNumber: true,
        status: true,
        severity: true,
        linkedSection: true,
        prompt: true,
        resolvedByInternalInputId: true,
      },
    }),
    prisma.internalInput.findMany({
      where: { issueId },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        observationNumber: true,
        role: true,
        name: true,
        confidence: true,
        linkedSection: true,
        excludedFromBrief: true,
        response: true,
      },
    }),
  ]);

  return {
    sources: sources.map((s) => ({
      sourceCode: s.sourceCode,
      title: s.title,
      tier: s.tier,
      linkedSection: s.linkedSection,
      reliability: s.reliability,
    })),
    gaps: gaps.map((g) => ({
      gapNumber: g.gapNumber,
      status: g.status,
      severity: g.severity,
      linkedSection: g.linkedSection,
      prompt: g.prompt,
      resolvedByInternalInputId: g.resolvedByInternalInputId,
    })),
    internalInputs: internalInputs.map((i) => ({
      id: i.id,
      observationNumber: i.observationNumber,
      role: i.role,
      name: i.name,
      confidence: i.confidence,
      linkedSection: i.linkedSection,
      excludedFromBrief: i.excludedFromBrief,
      response: i.response,
    })),
  };
}

function observationCodeById(data: ExportAuditAppendixInput): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const i of data.internalInputs) {
    m.set(i.id, formatObservationCode(i.observationNumber));
  }
  return m;
}

/** Markdown block appended after the main full-issue-brief body. */
export function buildExportAuditAppendixMarkdown(data: ExportAuditAppendixInput): string {
  const obsById = observationCodeById(data);
  const lines: string[] = [];

  lines.push("## Audit appendix");
  lines.push("");
  lines.push("_Audit appendix reflects the issue record at export time._");
  lines.push("");
  lines.push("### Sources");
  lines.push("");
  if (!data.sources.length) {
    lines.push("- No sources recorded for this issue.");
  } else {
    for (const s of data.sources) {
      const code = (s.sourceCode ?? "").trim();
      const lead = code.length ? code : "Source";
      const section = (s.linkedSection ?? "").trim() || "—";
      const rel = (s.reliability ?? "").trim() || "—";
      lines.push(
        `- **${lead}** — ${clampLine(s.title, 200)} — ${s.tier} — Brief section: ${clampLine(section, 80)} — Reliability: ${clampLine(rel, 80)}`,
      );
    }
  }

  lines.push("");
  lines.push("### Open questions");
  lines.push("");
  if (!data.gaps.length) {
    lines.push("- No open questions recorded for this issue.");
  } else {
    for (const g of data.gaps) {
      const q = formatGapCode(g.gapNumber) ?? "Question ref unavailable";
      const section = (g.linkedSection ?? "").trim() || "—";
      let tail = "";
      if ((g.status ?? "").trim() === "Resolved" && g.resolvedByInternalInputId) {
        const obs = obsById.get(g.resolvedByInternalInputId);
        if (obs) tail = ` — Answered by ${obs}`;
        else tail = " — Answered by (observation ref unavailable)";
      }
      lines.push(
        `- **${q}** — ${g.status} — ${g.severity} — Section: ${clampLine(section, 80)} — ${clampLine(g.prompt, 220)}${tail}`,
      );
    }
  }

  lines.push("");
  lines.push("### Internal observations");
  lines.push("");
  lines.push(
    "_Internal observations are attributable internal records and may not be suitable for external circulation._",
  );
  lines.push("");
  if (!data.internalInputs.length) {
    lines.push("- No internal observations recorded for this issue.");
  } else {
    for (const i of data.internalInputs) {
      const obs = formatObservationCode(i.observationNumber) ?? "Observation ref unavailable";
      const section = (i.linkedSection ?? "").trim() || "—";
      const brief = i.excludedFromBrief ? "Excluded from briefs" : "Included in briefs";
      lines.push(
        `- **${obs}** — ${clampLine(`${i.role} · ${i.name}`, 120)} — ${i.confidence} — Section: ${clampLine(section, 80)} — ${brief} — ${clampLine(i.response, 200)}`,
      );
    }
  }

  return `\n${lines.join("\n")}\n`;
}

/** HTML fragment (inside `<article>`) for the audit appendix. */
export function buildExportAuditAppendixHtml(data: ExportAuditAppendixInput): string {
  const obsById = observationCodeById(data);
  const parts: string[] = [];

  parts.push(`<section aria-labelledby="metis-audit-appendix-h2"><h2 id="metis-audit-appendix-h2">${escapeAppendixHtml("Audit appendix")}</h2>`);
  parts.push(`<p><em>${escapeAppendixHtml("Audit appendix reflects the issue record at export time.")}</em></p>`);

  parts.push(`<h3>${escapeAppendixHtml("Sources")}</h3>`);
  if (!data.sources.length) {
    parts.push("<ul><li>No sources recorded for this issue.</li></ul>");
  } else {
    parts.push("<ul>");
    for (const s of data.sources) {
      const code = (s.sourceCode ?? "").trim();
      const lead = code.length ? code : "Source";
      const section = (s.linkedSection ?? "").trim() || "—";
      const rel = (s.reliability ?? "").trim() || "—";
      const line = `${lead} — ${clampLine(s.title, 200)} — ${s.tier} — Brief section: ${clampLine(section, 80)} — Reliability: ${clampLine(rel, 80)}`;
      parts.push(`<li>${escapeAppendixHtml(line)}</li>`);
    }
    parts.push("</ul>");
  }

  parts.push(`<h3>${escapeAppendixHtml("Open questions")}</h3>`);
  if (!data.gaps.length) {
    parts.push("<ul><li>No open questions recorded for this issue.</li></ul>");
  } else {
    parts.push("<ul>");
    for (const g of data.gaps) {
      const q = formatGapCode(g.gapNumber) ?? "Question ref unavailable";
      const section = (g.linkedSection ?? "").trim() || "—";
      let tail = "";
      if ((g.status ?? "").trim() === "Resolved" && g.resolvedByInternalInputId) {
        const obs = obsById.get(g.resolvedByInternalInputId);
        if (obs) tail = ` — Answered by ${obs}`;
        else tail = " — Answered by (observation ref unavailable)";
      }
      const line = `${q} — ${g.status} — ${g.severity} — Section: ${clampLine(section, 80)} — ${clampLine(g.prompt, 220)}${tail}`;
      parts.push(`<li>${escapeAppendixHtml(line)}</li>`);
    }
    parts.push("</ul>");
  }

  parts.push(`<h3>${escapeAppendixHtml("Internal observations")}</h3>`);
  parts.push(
    `<p><em>${escapeAppendixHtml("Internal observations are attributable internal records and may not be suitable for external circulation.")}</em></p>`,
  );
  if (!data.internalInputs.length) {
    parts.push("<ul><li>No internal observations recorded for this issue.</li></ul>");
  } else {
    parts.push("<ul>");
    for (const i of data.internalInputs) {
      const obs = formatObservationCode(i.observationNumber) ?? "Observation ref unavailable";
      const section = (i.linkedSection ?? "").trim() || "—";
      const brief = i.excludedFromBrief ? "Excluded from briefs" : "Included in briefs";
      const line = `${obs} — ${clampLine(`${i.role} · ${i.name}`, 120)} — ${i.confidence} — Section: ${clampLine(section, 80)} — ${brief} — ${clampLine(i.response, 200)}`;
      parts.push(`<li>${escapeAppendixHtml(line)}</li>`);
    }
    parts.push("</ul>");
  }

  parts.push("</section>");
  return `\n${parts.join("\n")}\n`;
}
