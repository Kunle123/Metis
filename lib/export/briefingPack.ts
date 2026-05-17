import type { Issue } from "@prisma/client";

import type { BriefArtifact } from "@metis/shared/briefVersion";
import type { MessageVariantArtifact } from "@metis/shared/messageVariant";
import type { ExportFormat } from "@metis/shared/export";

import { BRIEFING_PACK_DOCUMENT_STYLES } from "./exportDocumentStyles";
import { executiveBriefExportBlockLabel, escapeHtml, normalizeExportTerminology } from "./exportDocumentUtils";

export { BRIEFING_PACK_DOCUMENT_STYLES };

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

const BANNED_LINE_PATTERNS = [
  /feasibility qa/i,
  /\bdev seed\b/i,
  /dev\/staging/i,
  /intended to test whether metis/i,
  /not production content/i,
  /live-style comms issue/i,
  /generated from the current issue record/i,
];

export type BriefingPackMessage = {
  templateLabel: string;
  audienceLabel: string;
  approvalStatus: string;
  primaryBody: string;
  supportingSections: { title: string; body: string }[];
};

export type BriefingPackContext = {
  issue: Pick<Issue, "title" | "ownerName" | "status" | "severity" | "priority" | "updatedAt" | "sourcesCount" | "openGapsCount">;
  format: ExportFormat;
  sourceBriefLabel: string;
  generatedAt: Date;
  messages: BriefingPackMessage[];
  claimsCount: number | null;
};

const EXECUTIVE_BLOCK_ORDER: Record<string, number> = {
  "Executive summary": 10,
  "Current assessment": 20,
  "Record sufficiency": 30,
  "Recommended decisions / next actions": 40,
  "Confirmed facts": 50,
  "Claims and assumptions": 60,
  "Open questions and unresolved needs": 70,
  "What not to say yet / uncertainty guardrails": 80,
  Observations: 90,
  "Evidence base": 100,
  "Audience implications": 110,
};

function formatShortDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function sanitizeExportText(text: string): string {
  let s = String(text ?? "").replace(UUID_RE, "");
  const lines = s.split(/\r?\n/);
  const kept = lines.filter((line) => {
    const t = line.trim();
    if (!t) return true;
    return !BANNED_LINE_PATTERNS.some((re) => re.test(t));
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function dedupeGuardrailBody(body: string): string {
  const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const clause = line.replace(/^-+\s*/, "").replace(/\.$/, "").trim().toLowerCase();
    const key = clause.replace(/^do not say yet\s+/i, "").replace(/^do not\s+/i, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line.startsWith("-") ? line : `- ${line}`);
  }
  return out.join("\n");
}

function blockVariant(label: string): "lead" | "decisions" | "guardrails" | "default" {
  if (label === "Executive summary") return "lead";
  if (label === "Recommended decisions / next actions") return "decisions";
  if (label === "What not to say yet / uncertainty guardrails") return "guardrails";
  return "default";
}

function paragraphsFromBody(bodyTrimmed: string): string[] {
  if (!bodyTrimmed) return [];
  return bodyTrimmed.split(/\r?\n\r?\n+/).filter((b) => b.trim().length > 0);
}

function bodyToListItems(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^-+\s*/, "").trim());
}

function bodyFragmentsToHtml(rawBody: string): string {
  const sanitized = sanitizeExportText(rawBody);
  const parts = paragraphsFromBody(sanitized);
  if (!parts.length) return "<p>&nbsp;</p>";

  return parts
    .map((block) => {
      const lines = bodyToListItems(block);
      const allBullets = lines.length > 1 && lines.every((l) => block.includes(`- ${l}`) || block.trim().startsWith("-"));
      if (allBullets || (lines.length > 0 && block.trim().startsWith("-"))) {
        const items = lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("\n");
        return `<ul>\n${items}\n</ul>`;
      }
      const escaped = escapeHtml(block);
      const inner = escaped.split(/\r?\n/).join("<br />\n");
      return `<p>${inner}</p>`;
    })
    .join("\n");
}

export function getOrderedExecutiveBlocks(artifact: BriefArtifact) {
  return [...artifact.executive.blocks]
    .map((b, i) => ({
      label: executiveBriefExportBlockLabel(i, b.label),
      body: b.body,
      order: EXECUTIVE_BLOCK_ORDER[executiveBriefExportBlockLabel(i, b.label)] ?? 500 + i,
    }))
    .sort((a, b) => a.order - b.order);
}

/** Normalized, sanitized executive block body (guardrail dedupe applied at export). */
export function prepareExecutiveBlockBodyForExport(label: string, body: string): string {
  let bodyText = normalizeExportTerminology(body);
  if (blockVariant(label) === "guardrails") {
    bodyText = dedupeGuardrailBody(bodyText);
  }
  return sanitizeExportText(bodyText);
}

export function briefingPackFormatLabel(format: ExportFormat): string {
  return formatLabelForPackage(format);
}

export function briefingPackFormatGeneratedAt(d: Date): string {
  return formatShortDate(d);
}

export function briefingPackRecordBasisLines(ctx: BriefingPackContext, artifact: BriefArtifact): string[] {
  const lines = [
    "This pack is a circulation snapshot. The complete source register, observation detail, and live claims register remain in the Metis workspace for this issue.",
    `Sources linked: ${ctx.issue.sourcesCount ?? 0}`,
    `Open questions on tracker: ${ctx.issue.openGapsCount ?? 0}`,
  ];
  if (ctx.claimsCount != null) lines.push(`Claims on register: ${ctx.claimsCount}`);
  const claimsLine = parseClaimsSummaryFromArtifact(artifact);
  if (claimsLine) lines.push(claimsLine);
  const obsLine = observationsSummaryFromArtifact(artifact);
  if (obsLine) lines.push(`Observations: ${obsLine}`);
  return lines;
}

function orderExecutiveBlocks(artifact: BriefArtifact) {
  return getOrderedExecutiveBlocks(artifact);
}

function renderExecutiveBlockHtml(label: string, body: string): string {
  const normalizedLabel = normalizeExportTerminology(label);
  let bodyText = normalizeExportTerminology(body);
  if (blockVariant(label) === "guardrails") {
    bodyText = dedupeGuardrailBody(bodyText);
  }
  bodyText = sanitizeExportText(bodyText);
  const variant = blockVariant(label);
  const cardClass =
    variant === "lead"
      ? "section-card lead-block"
      : variant === "decisions"
        ? "section-card decision-block"
        : variant === "guardrails"
          ? "section-card guardrail-block"
          : "section-card";

  return `<div class="${cardClass}"><h3>${escapeHtml(normalizedLabel)}</h3>\n${bodyFragmentsToHtml(bodyText)}</div>`;
}

const MESSAGE_TEMPLATE_LABELS: Record<string, string> = {
  external_customer_resident_student: "External customer update",
  internal_staff_update: "Internal staff update",
  media_holding_line: "Media holding line",
};

export function messageVariantToBriefingPackMessage(
  templateId: string,
  artifact: MessageVariantArtifact,
  approvalStatus: string,
): BriefingPackMessage {
  const primary =
    artifact.sections.find((s) => s.id === "draft-message")?.body ??
    artifact.sections[0]?.body ??
    "";
  const supporting = artifact.sections
    .filter((s) => s.id !== "draft-message")
    .map((s) => ({ title: s.title, body: sanitizeExportText(s.body) }));

  return {
    templateLabel: MESSAGE_TEMPLATE_LABELS[templateId] ?? templateId,
    audienceLabel: artifact.metadata.audienceLabel,
    approvalStatus,
    primaryBody: sanitizeExportText(primary),
    supportingSections: supporting,
  };
}

function parseClaimsSummaryFromArtifact(artifact: BriefArtifact): string | null {
  const claimsBlock = artifact.executive.blocks.find((b) => b.label === "Claims and assumptions");
  if (!claimsBlock?.body.trim()) return null;
  const firstLine = claimsBlock.body.split(/\r?\n/).find((l) => /claims position:/i.test(l));
  return firstLine ? sanitizeExportText(firstLine.trim()) : null;
}

function observationsSummaryFromArtifact(artifact: BriefArtifact): string | null {
  const obs = artifact.executive.blocks.find((b) => b.label === "Observations");
  if (!obs?.body.trim()) return null;
  const lead = obs.body.split(/\n\n+/)[0]?.trim();
  return lead ? sanitizeExportText(lead) : null;
}

function renderRecordBasisHtml(ctx: BriefingPackContext, artifact: BriefArtifact): string {
  const claimsLine = parseClaimsSummaryFromArtifact(artifact);
  const obsLine = observationsSummaryFromArtifact(artifact);
  const items = [
    `<li><strong>Sources linked:</strong> ${ctx.issue.sourcesCount ?? 0}</li>`,
    `<li><strong>Open questions on tracker:</strong> ${ctx.issue.openGapsCount ?? 0}</li>`,
    ctx.claimsCount != null ? `<li><strong>Claims on register:</strong> ${ctx.claimsCount}</li>` : null,
    claimsLine ? `<li>${escapeHtml(claimsLine)}</li>` : null,
    obsLine ? `<li><strong>Observations:</strong> ${escapeHtml(obsLine)}</li>` : null,
  ].filter(Boolean);

  return `<div class="record-basis-card"><p>This pack is a circulation snapshot. The complete source register, observation detail, and live claims register remain in the Metis workspace for this issue.</p><ul>${items.join("")}</ul></div>`;
}

function renderMessageCardHtml(msg: BriefingPackMessage): string {
  const support = msg.supportingSections
    .map(
      (s) =>
        `<div class="message-support"><h5>${escapeHtml(s.title)}</h5>${bodyFragmentsToHtml(s.body)}</div>`,
    )
    .join("\n");

  return `<article class="message-card">
<header>
<h4>${escapeHtml(msg.templateLabel)}</h4>
<p class="message-meta">Audience: ${escapeHtml(msg.audienceLabel)} · ${escapeHtml(msg.approvalStatus)}</p>
</header>
<div class="message-primary">${bodyFragmentsToHtml(msg.primaryBody)}</div>
${support}
</article>`;
}

function formatLabelForPackage(format: ExportFormat): string {
  switch (format) {
    case "executive-brief":
      return "Executive briefing pack";
    case "full-issue-brief":
      return "Full issue briefing pack";
    case "board-note":
      return "Board-note pack";
    case "email-ready":
      return "Email-ready pack";
    default:
      return "Briefing pack";
  }
}

export function renderBriefingPackHtml(ctx: BriefingPackContext, artifact: BriefArtifact): string {
  const title = escapeHtml(normalizeExportTerminology(ctx.issue.title));
  const owner = escapeHtml((ctx.issue.ownerName ?? "Not assigned").trim() || "Not assigned");
  const status = escapeHtml(ctx.issue.status);
  const severity = escapeHtml(ctx.issue.severity);
  const packageLabel = escapeHtml(formatLabelForPackage(ctx.format));

  const executiveBlocks = orderExecutiveBlocks(artifact)
    .map((b) => renderExecutiveBlockHtml(b.label, b.body))
    .join("\n");

  const messagesHtml =
    ctx.messages.length > 0
      ? `<section class="pack-section page-break" aria-labelledby="pack-messages">
<h2 class="pack-heading" id="pack-messages">Message drafts</h2>
<p class="pack-subtitle">Copy-ready drafts from the current issue record. Review caveats are shown separately from primary copy.</p>
${ctx.messages.map(renderMessageCardHtml).join("\n")}
</section>`
      : "";

  const inner = `<div class="briefing-pack">
<header class="pack-cover">
<p class="pack-subtitle">${packageLabel} · ${escapeHtml(ctx.sourceBriefLabel)}</p>
<h1>${title}</h1>
<ul class="meta-grid">
<li><span class="meta-k">Generated</span><span class="meta-v">${escapeHtml(formatShortDate(ctx.generatedAt))}</span></li>
<li><span class="meta-k">Owner</span><span class="meta-v">${owner}</span></li>
<li><span class="meta-k">Status</span><span class="meta-v">${status}</span></li>
<li><span class="meta-k">Severity</span><span class="meta-v">${severity}</span></li>
<li><span class="meta-k">Circulation</span><span class="meta-v">${escapeHtml(normalizeExportTerminology(artifact.metadata.circulation))}</span></li>
</ul>
</header>
<section class="pack-section" aria-labelledby="pack-brief">
<p class="pack-part" id="pack-brief">Executive brief</p>
${executiveBlocks}
</section>
${messagesHtml}
<section class="pack-section page-break" aria-labelledby="pack-basis">
<h2 class="pack-heading" id="pack-basis">Record basis</h2>
${renderRecordBasisHtml(ctx, artifact)}
</section>
<footer class="pack-provenance">
<p>Prepared in Metis from ${escapeHtml(ctx.sourceBriefLabel)}. Draft for internal review — confirm facts, approvals, and audience fit before external circulation.</p>
</footer>
</div>`;

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${title} — briefing pack</title>
<style>${BRIEFING_PACK_DOCUMENT_STYLES}</style>
</head>
<body>
${inner}
</body>
</html>
`;
}

function sectionMarkdown(title: string, body: string): string {
  return `\n## ${title}\n\n${sanitizeExportText(body).trim()}\n`;
}

export function renderBriefingPackMarkdown(ctx: BriefingPackContext, artifact: BriefArtifact): string {
  const title = normalizeExportTerminology(ctx.issue.title);
  const lines: string[] = [
    `# ${title}`,
    "",
    `**${formatLabelForPackage(ctx.format)}** · ${ctx.sourceBriefLabel}`,
    "",
    `- **Generated:** ${formatShortDate(ctx.generatedAt)}`,
    `- **Owner:** ${ctx.issue.ownerName ?? "Not assigned"}`,
    `- **Status:** ${ctx.issue.status}`,
    `- **Severity:** ${ctx.issue.severity}`,
    `- **Circulation:** ${normalizeExportTerminology(artifact.metadata.circulation)}`,
    "",
    "# Executive brief",
    "",
  ];

  for (const b of orderExecutiveBlocks(artifact)) {
    let body = normalizeExportTerminology(b.body);
    if (blockVariant(b.label) === "guardrails") body = dedupeGuardrailBody(body);
    lines.push(sectionMarkdown(b.label, body));
  }

  if (ctx.messages.length) {
    lines.push("\n# Message drafts\n");
    for (const msg of ctx.messages) {
      lines.push(`\n## ${msg.templateLabel}\n`);
      lines.push(`*Audience: ${msg.audienceLabel} · ${msg.approvalStatus}*\n`);
      lines.push(sanitizeExportText(msg.primaryBody));
      for (const s of msg.supportingSections) {
        lines.push(sectionMarkdown(s.title, s.body));
      }
    }
  }

  lines.push("\n# Record basis\n");
  lines.push(
    "This pack is a circulation snapshot. The complete source register, observation detail, and live claims register remain in the Metis workspace for this issue.\n",
  );
  lines.push(`- Sources linked: ${ctx.issue.sourcesCount ?? 0}`);
  lines.push(`- Open questions on tracker: ${ctx.issue.openGapsCount ?? 0}`);
  if (ctx.claimsCount != null) lines.push(`- Claims on register: ${ctx.claimsCount}`);
  const claimsLine = parseClaimsSummaryFromArtifact(artifact);
  if (claimsLine) lines.push(`- ${claimsLine}`);
  const obsLine = observationsSummaryFromArtifact(artifact);
  if (obsLine) lines.push(`- Observations: ${obsLine}`);

  lines.push(
    `\n---\n\n*Prepared in Metis from ${ctx.sourceBriefLabel}. Draft for internal review before circulation.*\n`,
  );

  return lines.join("\n").trim() + "\n";
}

export function shouldUseBriefingPackRenderer(format: ExportFormat, mode: string): boolean {
  return format === "executive-brief" || mode === "executive";
}