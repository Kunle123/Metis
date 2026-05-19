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
import { COMPACT_EXEC_PACK_LAYOUT_MARKER } from "./compactExecutivePackDocx";
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

  const consultationPackArtifact = BriefArtifactSchema.parse({
    lede: "Consultation on opening hours is under review.",
    metadata: {
      audience: null,
      circulation: "Internal",
      lastRevisionLabel: "2026-05-16",
      openGapsLabel: "2 open in tracker",
    },
    full: artifact.full,
    executive: {
      blocks: [
        {
          label: "Executive summary",
          body: "The current record supports an internal briefing on consultation process risk. Consultation options are under review.",
        },
        {
          label: "Current assessment",
          body: "Status: Ready for internal briefing with caveats\nBriefing confidence: Provisional\nExternal position: Provisional\nBriefing posture: Holding\nOpen questions: 2 on the issue record · 2 open in tracker\nIssue owner: Comms lead",
        },
        {
          label: "Record sufficiency",
          body: "External position remains provisional until equality assessment completes.",
        },
        {
          label: "Recommended decisions / next actions",
          body: "1) Confirm the proposed opening-hours option before any external line.\n2) Agree the cadence packaged with this briefing.",
        },
        {
          label: "Confirmed facts",
          body: "- Consultation options for service opening hours are under review.\n- No final decision has been made on the proposed opening-hours change.",
        },
        {
          label: "Claims and assumptions",
          body: "Claims position: 2 confirmed · 1 needs validation.\n\n### Confirmed claims\n- CLM-001: Consultation options are under review.\n\n### Needs validation\n- CLM-004: The change will save money without reducing service quality.",
        },
        {
          label: "Open questions and unresolved needs",
          body: "- What precise opening-hours option is being proposed for consultation?\n- When will the equality impact assessment be available?",
        },
        {
          label: "What not to say yet / uncertainty guardrails",
          body: "Do not say yet:\n- What the final opening hours will be.\n- That the service will close early from next month.\n\nDo not confirm final hours.",
        },
      ],
      immediateActions: [],
    },
  });

  const execPackBuf = await renderExportPackageDocx({
    issue: { title: briefingPackCtx.issue.title, id: issueWithId.id },
    mode: "executive",
    format: "executive-brief",
    artifact: consultationPackArtifact,
    briefingPack: briefingPackCtx,
  });
  assert.ok(execPackBuf.byteLength > 2000);
  const execPackXml = docxDocumentXml(execPackBuf);
  const execPackText = docxFlattenedRuns(execPackXml);
  assert.ok(execPackText.includes("EXECUTIVE BRIEFING PACK"), "pack cover eyebrow");
  assert.ok(execPackText.includes(COMPACT_EXEC_PACK_LAYOUT_MARKER), "compact layout marker proves briefing-pack renderer");
  assert.ok(execPackText.includes("Read first"), "compact read-first strip");
  assert.ok(!execPackText.includes("READ FIRST · CURRENT POSITION"), "old tall read-first eyebrow absent");
  assert.ok(!execPackText.includes("ACTION ·"), "old decisions eyebrow absent");
  assert.ok(execPackText.includes("Decisions needed"), "decisions section title");
  assert.ok(execPackText.includes("COMMS GUARDRAILS") || execPackText.includes("Comms guardrails"), "guardrails section");
  assert.ok(execPackText.includes("Safe to say"), "guardrails safe column");
  assert.ok(execPackText.includes("Do not say yet"), "guardrails hold column");
  assert.ok(execPackText.includes("KEY MESSAGE LINES") || execPackText.includes("Key message lines"), "message section");
  assert.ok(execPackText.includes("RECORD BASIS") || execPackText.includes("Record basis"), "record basis section");
  assert.ok(execPackText.includes("Prepared in Metis from"), "provenance footer");
  assert.ok(execPackText.includes("External customer update"), "message template label");
  assert.ok(execPackText.includes("Current status"), "status grid");
  assert.ok(execPackText.includes("Generated"), "cover metadata");
  assert.ok(!/feasibility qa/i.test(execPackText), "no dev QA strings");
  assert.ok(!execPackText.includes("44444444-4444-4444-4444-444444444444"), "no raw issue UUID");
  assert.equal(execPackText.includes(appendixMarker), false, "executive pack DOCX omits audit appendix");
  assert.ok(!/Owner — and deadline/i.test(execPackText), "no malformed owner fragments");
  assert.ok(!/Owner — for the cadence/i.test(execPackText), "no malformed owner fragments");
  assert.ok(!execPackText.includes("Claims and assumptions"), "no full claims register dump");
  assert.ok(!execPackText.includes("Evidence base"), "no evidence dump in executive pack");
  const consultReviewCount = execPackText.split("Consultation options are under review").length - 1;
  assert.ok(consultReviewCount <= 2, "confirmed facts should not repeat as a large wall");
  assert.ok(execPackText.includes("–"), "compact dash rows instead of broken Word numbering");
  const repeatedNumberedList =
    (execPackXml.match(/<w:numPr>/g) ?? []).length > 0 &&
    /1\.\s+Consultation options[\s\S]*1\.\s+No final decision/i.test(execPackText);
  assert.ok(!repeatedNumberedList, "confirmed facts must not render as repeated 1. list items");
  const safeIdx = execPackText.indexOf("Safe to say");
  const holdIdx = execPackText.indexOf("Do not say yet");
  assert.ok(safeIdx >= 0 && holdIdx > safeIdx, "guardrail columns ordered");
  const safeRegion = execPackText.slice(safeIdx, holdIdx);
  assert.ok(!/do not confirm final hours/i.test(safeRegion), "unsafe lines must not appear under Safe to say");
  assert.ok(!/final opening hours/i.test(safeRegion), "do-not-say topics must not appear under Safe to say");
  const pageBreaks = (execPackXml.match(/<w:br[^>]*w:type="page"/g) ?? []).length;
  assert.ok(pageBreaks >= 1 && pageBreaks <= 2, "compact pack uses one page break between decision and circulation views");

  const execBuf = await renderExportPackageDocx({
    issue: issueWithId,
    mode: "executive",
    format: "executive-brief",
    artifact,
  });
  assert.ok(execBuf.byteLength > 1500);
  const legacyExecText = docxFlattenedRuns(docxDocumentXml(execBuf));
  assert.equal(legacyExecText.includes(appendixMarker), false, "executive DOCX omits audit appendix");
  assert.ok(
    !legacyExecText.includes(COMPACT_EXEC_PACK_LAYOUT_MARKER),
    "legacy executive DOCX path (no briefingPack) must not use compact pack renderer",
  );

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
