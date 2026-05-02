/**
 * Production DOCX helper checks (no brittle binary snapshots).
 * Run: `npm run test:export-docx`
 *
 * Writes sample files to `./tmp/export-spike/` when useful for manual inspection.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";

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
      { label: "Situation", body: "Brief exec situation body." },
      { label: "Recommendation", body: "- Point one\n- Point two" },
    ],
    immediateActions: ["Confirm timeline", "Align legal review"],
  },
});

const issueStub = { title: "DOCX production sample issue" } as const;

async function main() {
  assert.equal(isExportDocxSupported("full-issue-brief"), true);
  assert.equal(isExportDocxSupported("executive-brief"), true);
  assert.equal(isExportDocxSupported("board-note"), true);
  assert.equal(isExportDocxSupported("email-ready"), false);

  await assert.rejects(
    async () =>
      renderExportPackageDocx({
        issue: issueStub,
        mode: "full",
        format: "email-ready",
        artifact,
      }),
    /email-ready/,
  );

  const outDir = join(process.cwd(), "tmp", "export-spike");
  mkdirSync(outDir, { recursive: true });

  const fullBuf = await renderExportPackageDocx({
    issue: issueStub,
    mode: "full",
    format: "full-issue-brief",
    artifact,
  });
  assert.ok(fullBuf.byteLength > 1500);

  const execBuf = await renderExportPackageDocx({
    issue: issueStub,
    mode: "executive",
    format: "executive-brief",
    artifact,
  });
  assert.ok(execBuf.byteLength > 1500);

  const boardBuf = await renderExportPackageDocx({
    issue: issueStub,
    mode: "full",
    format: "board-note",
    artifact,
  });
  assert.ok(boardBuf.byteLength > 1500);

  writeFileSync(join(outDir, "prod-full-issue.docx"), fullBuf);
  writeFileSync(join(outDir, "prod-executive.docx"), execBuf);
  writeFileSync(join(outDir, "prod-board-note.docx"), boardBuf);

  console.log(`export DOCX production helper: ok — wrote 3 samples → ${outDir}`);
}

await main();
