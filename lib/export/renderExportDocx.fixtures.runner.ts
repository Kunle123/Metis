/**
 * Production DOCX helper checks (no brittle binary snapshots).
 * Run: `npm run test:export-docx`
 *
 * Writes sample files to `./tmp/export-spike/` when useful for manual inspection.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";

import type { ExportAuditAppendixInput } from "./buildExportAuditAppendix";
import type { BriefingPackContext } from "./briefingPack";
import { isExportDocxSupported, renderExportPackageDocx } from "./renderExportDocx";

const artifact = BriefArtifactSchema.parse({
  lede: "Executive lede paragraph.\n\nSecond graf with nuance.",
  metadata: { audience: null, circulation: "Internal", lastRevisionLabel: "2026-05-02", openGapsLabel: "3" },
  full: {
    sections: [
      {
        id: "executive-summary",
        title: "Executive summary",
        body: "Primary narrative.\n\nLine two.",
        confidence: "Likely",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
      {
        id: "recommended-actions",
        title: "Recommended actions",
        body: `- First action item
- Second action item`,
        confidence: "Likely",
        updatedAtLabel: "now",
        evidenceRefs: [],
      },
    ],
  },
  executive: {
    blocks: [
      { label: "Executive summary", body: "Consultation is under way on opening hours." },
      { label: "Current assessment", body: "Status: Active\nBriefing confidence: Provisional" },
      { label: "Record sufficiency", body: "Record is sufficient for internal briefing." },
      {
        label: "Recommended decisions / next actions",
        body: "1) Confirm proposed hours.\n2) Agree media holding line.",
      },
      { label: "Confirmed facts", body: "- Consultation is under review.\n- No final decision yet." },
      {
        label: "What not to say yet / uncertainty guardrails",
        body: "- Do not confirm final hours.\n- Do not confirm final hours.",
      },
    ],
    immediateActions: ["Confirm timeline", "Align legal review"],
  },
});

const appendixMarker = "Audit appendix reflects the issue record at export time.";
const internalWarn =
  "Internal observations are attributable internal records and may not be suitable for external circulation.";

const sampleAppendix: ExportAuditAppendixInput = {
  sources: [
    {
      sourceCode: "SRC-001",
      title: "Example source doc title",
      tier: "Primary",
      linkedSection: "Executive summary",
      reliability: "High",
    },
    { sourceCode: "", title: "Untitled source", tier: "Secondary", linkedSection: null, reliability: null },
    { sourceCode: "SRC-OFF", title: "Custom code source", tier: "Primary", linkedSection: "Chronology", reliability: "—" },
  ],
  gaps: [
    {
      gapNumber: 2,
      status: "Open",
      severity: "High",
      linkedSection: null,
      prompt: "What is the delivery window?",
      resolvedByInternalInputId: null,
    },
    {
      gapNumber: 0,
      status: "Open",
      severity: "Low",
      linkedSection: "Background",
      prompt: "Invalid gap number row",
      resolvedByInternalInputId: null,
    },
    {
      gapNumber: 3,
      status: "Resolved",
      severity: "Medium",
      linkedSection: "Risks",
      prompt: "Resolved question text",
      resolvedByInternalInputId: "obs-row-b",
    },
    {
      gapNumber: 4,
      status: "Resolved",
      severity: "Low",
      linkedSection: null,
      prompt: "Missing resolver row",
      resolvedByInternalInputId: "00000000-0000-0000-0000-000000000099",
    },
  ],
  internalInputs: [
    {
      id: "obs-row-b",
      observationNumber: 5,
      role: "Analyst",
      name: "Example Name",
      confidence: "Likely",
      linkedSection: "Recommended actions",
      excludedFromBrief: false,
      response: "Resolution note for Q-003.",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      observationNumber: 0,
      role: "Lead",
      name: "No ordinal",
      confidence: "Unclear",
      linkedSection: null,
      excludedFromBrief: true,
      response: "Sensitive note",
    },
  ],
};

const issueWithId = { title: "DOCX production sample issue", id: "11111111-1111-1111-1111-111111111111" } as const;

/** OOXML packages are zipped; extract `word/document.xml` for assertions (POSIX `unzip`). */
function docxDocumentXml(buf: Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), "metis-docx-fixture-"));
  try {
    const fp = join(dir, "package.docx");
    writeFileSync(fp, buf);
    return execFileSync("unzip", ["-p", fp, "word/document.xml"], { encoding: "utf8", maxBuffer: 20 << 20 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function docxFlattenedRuns(xml: string): string {
  const parts: string[] = [];
  const re = /<w:t\b[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    parts.push(m[1] ?? "");
  }
  return parts.join("");
}

async function main() {
  assert.equal(isExportDocxSupported("full-issue-brief"), true);
  assert.equal(isExportDocxSupported("executive-brief"), true);
  assert.equal(isExportDocxSupported("board-note"), true);
  assert.equal(isExportDocxSupported("email-ready"), false);

  await assert.rejects(
    async () =>
      renderExportPackageDocx({
        issue: issueWithId,
        mode: "full",
        format: "email-ready",
        artifact,
      }),
    /email-ready/,
  );

  const outDir = join(process.cwd(), "tmp", "export-spike");
  mkdirSync(outDir, { recursive: true });

  const fullBuf = await renderExportPackageDocx({
    issue: issueWithId,
    mode: "full",
    format: "full-issue-brief",
    artifact,
    auditAppendix: sampleAppendix,
  });
  assert.ok(fullBuf.byteLength > 1800);

  const fullXml = docxDocumentXml(fullBuf);
  const fullText = docxFlattenedRuns(fullXml);
  assert.ok(fullText.includes("Audit appendix"), "audit heading");
  assert.ok(fullText.includes(appendixMarker), "export-time disclaimer");
  assert.ok(fullText.includes(internalWarn), "internal observations warning");
  assert.ok(fullText.includes("SRC-001"));
  assert.ok(fullText.includes("Q-002"));
  assert.ok(fullText.includes("Q-003"));
  assert.ok(fullText.includes("Q-004"));
  assert.ok(fullText.includes("OBS-005"));
  assert.ok(fullText.includes("Question ref unavailable"), "fallback gap label");
  assert.ok(fullText.includes("Observation ref unavailable"), "fallback observation label");
  assert.ok(fullText.includes("Answered by OBS-005"));
  assert.ok(fullText.includes("Answered by restricted observation"));
  assert.ok(fullText.includes("SRC-OFF"), "non-numeric source code verbatim");
  assert.ok(fullText.includes("Source —"), "missing source code → Source");
  assert.ok(!fullText.includes("22222222-2222-2222-2222-222222222222"), "uuid not leaked in appendix");
  assert.ok(!fullText.includes("00000000-0000-0000-0000-000000000099"), "missing resolver uuid not leaked");

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

  const execPackBuf = await renderExportPackageDocx({
    issue: { title: briefingPackCtx.issue.title, id: issueWithId.id },
    mode: "executive",
    format: "executive-brief",
    artifact,
    briefingPack: briefingPackCtx,
  });
  assert.ok(execPackBuf.byteLength > 2500);
  const execPackText = docxFlattenedRuns(docxDocumentXml(execPackBuf));
  assert.ok(execPackText.includes("EXECUTIVE BRIEFING PACK"), "pack cover eyebrow");
  assert.ok(execPackText.includes("READ FIRST"), "read-first panel");
  assert.ok(execPackText.includes("ACTION"), "decisions panel eyebrow");
  assert.ok(execPackText.includes("DECISIONS NEEDED"), "decisions section title");
  assert.ok(execPackText.includes("COMMS GUARDRAILS") || execPackText.includes("Comms guardrails"), "guardrails section");
  assert.ok(execPackText.includes("Safe to say"), "guardrails safe column");
  assert.ok(execPackText.includes("Do not say yet"), "guardrails hold column");
  assert.ok(execPackText.includes("Message drafts"), "message drafts section");
  assert.ok(execPackText.includes("RECORD BASIS") || execPackText.includes("Record basis"), "record basis section");
  assert.ok(execPackText.includes("Prepared in Metis from"), "provenance footer");
  assert.ok(execPackText.includes("External customer update"), "message template label");
  assert.ok(execPackText.includes("Current assessment"), "assessment grid");
  assert.ok(execPackText.includes("Generated"), "cover metadata");
  assert.ok(!/feasibility qa/i.test(execPackText), "no dev QA strings");
  assert.ok(!execPackText.includes("44444444-4444-4444-4444-444444444444"), "no raw issue UUID");
  assert.equal(execPackText.includes(appendixMarker), false, "executive pack DOCX omits audit appendix");

  const execBuf = await renderExportPackageDocx({
    issue: issueWithId,
    mode: "executive",
    format: "executive-brief",
    artifact,
  });
  assert.ok(execBuf.byteLength > 1500);
  assert.equal(docxFlattenedRuns(docxDocumentXml(execBuf)).includes(appendixMarker), false, "executive DOCX omits audit appendix");

  const boardBuf = await renderExportPackageDocx({
    issue: issueWithId,
    mode: "full",
    format: "board-note",
    artifact,
  });
  assert.ok(boardBuf.byteLength > 1500);
  assert.equal(docxFlattenedRuns(docxDocumentXml(boardBuf)).includes(appendixMarker), false, "board DOCX omits audit appendix");

  writeFileSync(join(outDir, "prod-full-issue.docx"), fullBuf);
  writeFileSync(join(outDir, "prod-executive-pack.docx"), execPackBuf);
  writeFileSync(join(outDir, "prod-executive-legacy.docx"), execBuf);
  writeFileSync(join(outDir, "prod-board-note.docx"), boardBuf);

  console.log(`export DOCX production helper: ok — wrote 3 samples → ${outDir}`);
}

await main();
