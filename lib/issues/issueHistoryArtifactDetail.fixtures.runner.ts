import assert from "node:assert";

import type { BriefArtifact } from "@metis/shared/briefVersion";

import {
  briefArtifactEvidenceRefs,
  briefArtifactToRecordSections,
  messageArtifactWording,
  parseMessageArtifact,
} from "./issueHistoryArtifactDetail";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueHistoryArtifactDetail: OK — ${name}`);
  } catch (e) {
    console.error(`issueHistoryArtifactDetail: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("briefArtifactToRecordSections puts executive blocks before full sections", () => {
  const artifact = {
    lede: "Working position",
    metadata: { audience: null, circulation: "Internal" as const, lastRevisionLabel: "Mon", openGapsLabel: "Q-001" },
    full: {
      sections: [{ id: "chronology" as const, title: "Chronology", body: "Timeline text", confidence: "Confirmed" as const, updatedAtLabel: "Mon", evidenceRefs: ["SRC-001"] }],
      executiveSummarySynthesis: undefined,
    },
    executive: { blocks: [{ label: "Summary", body: "Exec summary" }], immediateActions: ["Notify team"] },
  } satisfies BriefArtifact;

  const sections = briefArtifactToRecordSections(artifact);
  assert.equal(sections[0]?.heading, "Position");
  assert.equal(sections[1]?.heading, "Summary");
  assert.equal(sections.some((s) => s.heading === "Chronology"), true);
});

run("briefArtifactEvidenceRefs collects unique refs", () => {
  const artifact = {
    lede: "",
    metadata: { audience: null, circulation: "Internal" as const, lastRevisionLabel: "Mon", openGapsLabel: "" },
    full: {
      sections: [
        { id: "chronology" as const, title: "A", body: "a", confidence: "Confirmed" as const, updatedAtLabel: "Mon", evidenceRefs: ["SRC-001", "CLM-002"] },
        { id: "implications" as const, title: "B", body: "b", confidence: "Confirmed" as const, updatedAtLabel: "Mon", evidenceRefs: ["SRC-001", "Q-003"] },
      ],
      executiveSummarySynthesis: undefined,
    },
    executive: { blocks: [], immediateActions: [] },
  } satisfies BriefArtifact;

  const refs = briefArtifactEvidenceRefs(artifact);
  assert.deepEqual(refs.sort(), ["CLM-002", "Q-003", "SRC-001"]);
});

run("messageArtifactWording returns toggle only when bodies differ", () => {
  const artifact = parseMessageArtifact({
    templateId: "internal_staff_update",
    metadata: {
      publicHeadline: "Update",
      lastRevisionLabel: "Mon",
      openGapsLabel: "",
      audienceLabel: "Staff",
      lensSource: "issue_audience_only",
      issueLevelAudienceNote: null,
      aiComparisonAvailable: true,
      deterministicSectionBodiesById: { "draft-message": "Draft line one" },
    },
    sections: [{ id: "draft-message", title: "Message", body: "Polished line one" }],
    guardrails: { mustAvoid: [], toneNotes: "" },
  });
  assert.ok(artifact, "artifact should parse");
  const wording = messageArtifactWording(artifact!);
  assert.ok(wording);
  assert.equal(wording!.defaultMode, "ai_polished");
  assert.notEqual(wording!.draftBody, wording!.aiPolishedBody);
});

run("messageArtifactWording omitted when bodies match", () => {
  const artifact = parseMessageArtifact({
    templateId: "media_holding_line",
    metadata: {
      publicHeadline: "Line",
      lastRevisionLabel: "Mon",
      openGapsLabel: "",
      audienceLabel: "Media",
      lensSource: "issue_audience_only",
      issueLevelAudienceNote: null,
      aiComparisonAvailable: true,
      deterministicSectionBodiesById: { "holding-line": "Same text" },
    },
    sections: [{ id: "holding-line", title: "Line", body: "Same text" }],
    guardrails: { mustAvoid: ["speculation"], toneNotes: "Calm" },
  });
  assert.ok(artifact, "artifact should parse");
  assert.equal(messageArtifactWording(artifact!), undefined);
});

console.log("issueHistoryArtifactDetail: all tests passed");
