/**
 * Spike runner: generates sample `.docx` files locally (no API/UI).
 *
 * Run: `npm run spike:export-docx`
 *
 * Output: `./tmp/export-spike/*.docx` — gitignored. Asserts buffers are non-trivial OOXML payloads (no brittle binary snapshots).
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";

import { renderExportPackageDocxSpike } from "./renderExportDocxSpike";

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

const issueStub = { title: "DOCX spike sample issue" } as const;

async function main() {
  const outDir = join(process.cwd(), "tmp", "export-spike");
  mkdirSync(outDir, { recursive: true });

  const samples: Array<[string, Awaited<ReturnType<typeof renderExportPackageDocxSpike>>]> = [];

  samples.push([
    "spike-full-issue.docx",
    await renderExportPackageDocxSpike({
      issue: issueStub,
      mode: "full",
      format: "full-issue-brief",
      artifact,
    }),
  ]);

  samples.push([
    "spike-executive.docx",
    await renderExportPackageDocxSpike({
      issue: issueStub,
      mode: "executive",
      format: "executive-brief",
      artifact,
    }),
  ]);

  samples.push([
    "spike-board-note.docx",
    await renderExportPackageDocxSpike({
      issue: issueStub,
      mode: "full",
      format: "board-note",
      artifact,
    }),
  ]);

  samples.push([
    "spike-email-ready.docx",
    await renderExportPackageDocxSpike({
      issue: issueStub,
      mode: "full",
      format: "email-ready",
      artifact,
    }),
  ]);

  for (const [name, buf] of samples) {
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.byteLength > 1500, `expected non-trivial OOXML zip for ${name}`);
    writeFileSync(join(outDir, name), buf);
  }

  console.log(`export DOCX spike: wrote ${samples.length} files → ${outDir}`);
}

await main();
