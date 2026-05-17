/**
 * No-browser checks for HTML export escaping and basic document shape.
 * Run: `npm run test:export-html`
 */
import assert from "node:assert/strict";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";

import type { ExportAuditAppendixInput } from "./buildExportAuditAppendix";
import type { BriefingPackContext } from "./briefingPack";
import { escapeHtml, renderExportPackage, renderExportPackageHtml } from "./renderExportPackage";

assert.equal(escapeHtml(`A & B <tag> "'`), "A &amp; B &lt;tag&gt; &quot;&#39;");

const minimalArtifact = BriefArtifactSchema.parse({
  lede: `Intro <style>x</style> and <script>bad()</script>`,
  metadata: { audience: null, circulation: "Internal", lastRevisionLabel: "now", openGapsLabel: "3" },
  full: {
    sections: [
      {
        id: "executive-summary",
        title: "Summary<b>",
        body: "First graf.\n\nSecond <iframe></iframe>",
        confidence: "Unclear",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
      {
        id: "recommended-actions",
        title: `Actions<img src=x onerror=alert(1)>`,
        body: `- item & one`,
        confidence: "Likely",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
    ],
  },
  executive: {
    blocks: [{ label: "Situation", body: "Exec line" }],
    immediateActions: ["Do something"],
  },
});

const md = renderExportPackageHtml({
  issue: { title: "Issue<title>" },
  mode: "full",
  format: "full-issue-brief",
  artifact: minimalArtifact,
}).content;

assert.match(md, /<article>/);
assert.match(md, /<\/article>/);
assert.ok(!/<script/i.test(md), "literal script angle-bracket leakage");
assert.ok(md.includes("&lt;script&gt;"), "escaped script markup");
assert.ok(md.includes("&lt;style&gt;"), "escaped style markup");
assert.ok(md.includes("&lt;iframe&gt;"), "escaped iframe markup");

const sampleAppendix: ExportAuditAppendixInput = {
  sources: [
    {
      sourceCode: "SRC-001",
      title: "Alpha & <beta>",
      tier: "Official",
      linkedSection: "Public narrative",
      reliability: "High",
    },
    { sourceCode: "CUSTOM-X", title: "Custom code row", tier: "Internal", linkedSection: null, reliability: null },
  ],
  gaps: [
    {
      gapNumber: 1,
      status: "Open",
      severity: "Important",
      linkedSection: "Procurement",
      prompt: "What is the timeline?",
      resolvedByInternalInputId: null,
    },
    {
      gapNumber: 2,
      status: "Resolved",
      severity: "Watch",
      linkedSection: null,
      prompt: "Done?",
      resolvedByInternalInputId: "00000000-0000-0000-0000-00000000feed",
    },
  ],
  internalInputs: [
    {
      id: "00000000-0000-0000-0000-00000000feed",
      observationNumber: 1,
      role: "Analyst",
      name: "Alex",
      confidence: "Likely",
      linkedSection: "Finance",
      excludedFromBrief: false,
      response: "Internal line with <tag>",
    },
  ],
};

const fullHtmlWithAppendix = renderExportPackageHtml({
  issue: { title: "Issue<title>" },
  mode: "full",
  format: "full-issue-brief",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;

assert.match(fullHtmlWithAppendix, /Audit appendix/);
assert.match(fullHtmlWithAppendix, /SRC-001/);
assert.match(fullHtmlWithAppendix, /CUSTOM-X/);
assert.match(fullHtmlWithAppendix, /Q-001/);
assert.match(fullHtmlWithAppendix, /OBS-001/);
assert.match(fullHtmlWithAppendix, /Answered by OBS-001/);
assert.match(fullHtmlWithAppendix, /Alpha &amp; &lt;beta&gt;/);
assert.match(fullHtmlWithAppendix, /Internal line with &lt;tag&gt;/);
assert.ok(!fullHtmlWithAppendix.includes("00000000-0000-0000-0000-00000000feed"), "appendix must not leak UUIDs");

const execHtmlWithAppendixIgnored = renderExportPackageHtml({
  issue: { title: "Exec" },
  mode: "executive",
  format: "executive-brief",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;
assert.ok(!execHtmlWithAppendixIgnored.includes("Audit appendix"), "executive HTML must not include audit appendix");

const boardHtml = renderExportPackageHtml({
  issue: { title: "Board" },
  mode: "full",
  format: "board-note",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;
assert.ok(!boardHtml.includes("Audit appendix"), "board-note must not include audit appendix");

const fullMdWithAppendix = renderExportPackage({
  issue: { title: "Md issue" },
  mode: "full",
  format: "full-issue-brief",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;
assert.match(fullMdWithAppendix, /## Audit appendix/);
assert.match(fullMdWithAppendix, /### Sources/);
assert.match(fullMdWithAppendix, /### Open questions/);
assert.match(fullMdWithAppendix, /### Internal observations/);
assert.ok(!fullMdWithAppendix.includes("00000000-0000-0000-0000-00000000feed"));

const execMd = renderExportPackage({
  issue: { title: "Md exec" },
  mode: "executive",
  format: "executive-brief",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;
assert.ok(!execMd.includes("## Audit appendix"));

const emailOut = renderExportPackage({
  issue: { title: "Email" },
  mode: "full",
  format: "email-ready",
  artifact: minimalArtifact,
  auditAppendix: sampleAppendix,
}).content;
assert.ok(!emailOut.includes("Audit appendix"));

const briefingPackCtx: BriefingPackContext = {
  issue: {
    title: "Consultation on Proposed Changes to Service Opening Hours",
    ownerName: "Comms lead",
    status: "Active",
    severity: "Medium",
    priority: "P2",
    updatedAt: new Date("2026-05-01T12:00:00Z"),
    sourcesCount: 4,
    openGapsCount: 2,
  },
  format: "executive-brief",
  sourceBriefLabel: "Executive brief v3",
  generatedAt: new Date("2026-05-16T09:00:00Z"),
  claimsCount: 5,
  messages: [
    {
      templateLabel: "External customer update",
      audienceLabel: "Service users",
      approvalStatus: "Draft — not approved",
      primaryBody: "We are consulting on proposed changes to opening hours.",
      supportingSections: [
        { title: "Review caveats", body: "Do not confirm final hours until consultation closes." },
      ],
    },
  ],
};

const executivePackArtifact = BriefArtifactSchema.parse({
  lede: "Lede",
  metadata: { audience: null, circulation: "Internal", lastRevisionLabel: "now", openGapsLabel: "2" },
  full: { sections: [] },
  executive: {
    blocks: [
      { label: "Executive summary", body: "Consultation is under way." },
      { label: "Record sufficiency", body: "Record is sufficient for internal briefing." },
      {
        label: "What not to say yet / uncertainty guardrails",
        body: "- Do not confirm final hours.\n- Do not confirm final hours.",
      },
      {
        label: "Claims and assumptions",
        body: "Claims position: 5 claims on register (2 need validation).",
      },
      { label: "Observations", body: "Three observations support the consultation narrative.\n\nDetail line two." },
    ],
    immediateActions: [],
  },
});

const packHtml = renderExportPackageHtml({
  issue: { title: briefingPackCtx.issue.title },
  mode: "executive",
  format: "executive-brief",
  artifact: executivePackArtifact,
  briefingPack: briefingPackCtx,
}).content;

assert.match(packHtml, /class="briefing-pack"/);
assert.match(packHtml, /color-scheme: light/);
assert.match(packHtml, /#ffffff/);
assert.match(packHtml, /Message drafts/);
assert.match(packHtml, /Record basis/);
assert.match(packHtml, /Executive brief/);
assert.match(packHtml, /External customer update/);
assert.match(packHtml, /guardrail-block/);
assert.ok(!packHtml.includes("feasibility qa"), "must strip dev/QA lines");
assert.ok(!packHtml.includes("44444444-4444-4444-4444-444444444444"), "must not leak UUIDs");
const guardrailBullets = (packHtml.match(/Do not confirm final hours/g) ?? []).length;
assert.ok(guardrailBullets <= 2, "guardrail bullets should be deduped in HTML export");

const packMd = renderExportPackage({
  issue: { title: briefingPackCtx.issue.title },
  mode: "executive",
  format: "executive-brief",
  artifact: executivePackArtifact,
  briefingPack: briefingPackCtx,
}).content;
assert.match(packMd, /# Message drafts/);
assert.match(packMd, /# Record basis/);
assert.ok(!packMd.includes("Generated from the current issue record"));

console.log("export HTML fixtures: ok");
