import assert from "node:assert";

import type { BriefArtifact } from "@metis/shared/briefVersion";

import { compareBriefArtifacts } from "./compareBriefVersions";

const metaBlock = () =>
  ({
    audience: null,
    circulation: "Internal" as const,
    lastRevisionLabel: "",
    openGapsLabel: "0",
  }) as const;

const emptyConfidence = () =>
  ({
    confidence: "Likely" as const,
    updatedAtLabel: "",
    evidenceRefs: [] as string[],
  }) as const;

type SectionId =
  | "executive-summary"
  | "chronology"
  | "confirmed-vs-unclear"
  | "narrative-map"
  | "implications"
  | "recommended-actions";

function fullSectionsBodies(bodies: Partial<Record<SectionId, string>>): BriefArtifact["full"]["sections"] {
  const ids: SectionId[] = [
    "executive-summary",
    "chronology",
    "confirmed-vs-unclear",
    "narrative-map",
    "implications",
    "recommended-actions",
  ];
  return ids.map((id) => ({
    id,
    title: id,
    body: bodies[id] ?? "",
    ...emptyConfidence(),
  }));
}

function minimalArtifact(args: {
  fullBodies?: Partial<Record<SectionId, string>>;
  blocks?: BriefArtifact["executive"]["blocks"];
  immediateActions?: string[];
}): BriefArtifact {
  return {
    lede: "",
    metadata: metaBlock(),
    full: { sections: fullSectionsBodies(args.fullBodies ?? {}) },
    executive: { blocks: args.blocks ?? [], immediateActions: args.immediateActions ?? [] },
  };
}

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`compareBriefVersions: OK — ${name}`);
  } catch (e) {
    console.error(`compareBriefVersions: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("full mode reads full sections for facts and recommendations", () => {
  const from = minimalArtifact({
    fullBodies: { "executive-summary": "- Old line", "recommended-actions": "- Do A" },
  });
  const to = minimalArtifact({
    fullBodies: {
      "executive-summary": "- Old line\n- New fact",
      "recommended-actions": "- Do A\n- Do B",
    },
  });
  const s = compareBriefArtifacts(from, to, "full");
  assert.ok(s.groups.find((g) => g.id === "new_facts")!.items.some((x) => x.includes("New fact")), "newline in exec summary cohort");
  assert.ok(s.groups.find((g) => g.id === "changed_recommendations")!.items.some((x) => x.includes("Do B")), "rec line added");
});

run("executive mode ignores full.section executive-summary when executive block unchanged", () => {
  const from = minimalArtifact({
    fullBodies: { "executive-summary": "- Full-only old story — unique string alpha" },
    blocks: [{ label: "Executive summary", body: "- Same exec line" }],
  });
  const to = minimalArtifact({
    fullBodies: { "executive-summary": "- Full-only new story — unique string omega" },
    blocks: [{ label: "Executive summary", body: "- Same exec line" }],
  });
  const s = compareBriefArtifacts(from, to, "executive");
  assert.deepEqual(s.groups.find((g) => g.id === "new_facts")!.items, [], "must not mirror full.section churn");
});

run("executive block text change yields non-empty summary", () => {
  const from = minimalArtifact({
    blocks: [{ label: "Executive summary", body: "- Stable\n- Carry" }],
  });
  const to = minimalArtifact({
    blocks: [{ label: "Executive summary", body: "- Stable\n- Carry\n- Leadership line" }],
  });
  const s = compareBriefArtifacts(from, to, "executive");
  const facts = s.groups.find((g) => g.id === "new_facts")!.items;
  assert.ok(facts.some((line) => line.includes("Leadership line")), facts.join("|"));
});

run("executive immediateActions addition is surfaced", () => {
  const from = minimalArtifact({
    blocks: [{ label: "Executive summary", body: "x" }],
    immediateActions: ["- Decide A"],
  });
  const to = minimalArtifact({
    blocks: [{ label: "Executive summary", body: "x" }],
    immediateActions: ["- Decide A", "- Decide B"],
  });
  const s = compareBriefArtifacts(from, to, "executive");
  const acts = s.groups.find((g) => g.id === "changed_recommendations")!.items;
  assert.ok(acts.includes("Decide B"), acts.join("|"));
});

run("other executive sections map to changed_assumptions cohort", () => {
  const from = minimalArtifact({
    blocks: [
      { label: "Executive summary", body: "intro" },
      { label: "Current assessment", body: "- Status: open" },
    ],
  });
  const to = minimalArtifact({
    blocks: [
      { label: "Executive summary", body: "intro" },
      { label: "Current assessment", body: "- Status: open\n- New assessment note" },
    ],
  });
  const s = compareBriefArtifacts(from, to, "executive");
  const asum = s.groups.find((g) => g.id === "changed_assumptions")!.items;
  assert.ok(asum.some((x) => x.includes("Current assessment") && x.includes("New assessment note")), asum.join("|"));
});

console.log("compareBriefVersions fixtures: OK");
