/**
 * Deterministic JSON export for the external Bramley Junction timeline demo.
 * Run: npm run demo:export:bramley
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildBramleyBriefArtifact } from "@/lib/demo/bramley-junction/brief-artifacts";
import { buildBramleyDataset } from "@/lib/demo/bramley-junction/build-dataset";
import { buildBramleyMessageArtifact } from "@/lib/demo/bramley-junction/message-artifacts";
import { validateBramleyDataset } from "@/lib/demo/bramley-junction/validate-export";
import { bramleyClaims, bramleyObservations, bramleySources } from "@/lib/demo/bramley-junction/issue-record";
import { bramleyLabelFromAt } from "@/lib/demo/bramley-junction/timestamps";

const OUT_DIR = path.join(process.cwd(), "public/demo/bramley-junction");

async function writeJson(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(OUT_DIR, filename);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${filePath}`);
}

async function main(): Promise<void> {
  const dataset = buildBramleyDataset();

  await mkdir(OUT_DIR, { recursive: true });

  const claimById = new Map(bramleyClaims.map((c) => [c.id, c] as const));
  const sourceById = new Map(bramleySources.map((s) => [s.id, s] as const));

  const outputsWithArtifacts = dataset.outputs.map((o) => {
    const isMessageOutput = Boolean(o.metisMessageVariantId);
    const templateId = (o.templateId ?? "").trim();
    const messageArtifact =
      isMessageOutput && templateId
        ? buildBramleyMessageArtifact({
            templateId: templateId as any,
            sectionTitle: o.title,
            body: o.body,
            mustAvoid: o.doNotSay,
            publicHeadline: "Bramley Junction",
            lastRevisionLabel: bramleyLabelFromAt(o.generatedAt),
            openGapsLabel: o.openQuestionsAtGeneration.join(", ") || "None",
            audienceLabel: o.audience,
            toneNotes: "Controlled, factual, and caveated where uncertain; no speculation.",
          })
        : undefined;

    if (o.kind !== "executive_brief") return { ...o, ...(messageArtifact ? { messageArtifact } : {}) };
    const isLaterRevision = (o.versionNumber ?? 0) >= 2;
    const artifact = buildBramleyBriefArtifact({
      lede: dataset.issue.currentControlledPosition,
      executiveSummary: o.body.split("\n").slice(0, 6).join(" ").trim(),
      lastRevisionLabel: bramleyLabelFromAt(o.generatedAt),
      openGapsLabel: o.openQuestionsAtGeneration.join(", ") || "0",
      assessmentLines: [
        `Status: ${dataset.issue.status}`,
        `Severity: ${dataset.issue.severity}`,
        `Urgency: ${dataset.issue.priority}`,
        `Briefing posture: ${dataset.issue.operatorPosture}`,
        `Open questions: ${o.openQuestionsAtGeneration.join(", ") || "None"}`,
        `Issue owner: ${dataset.issue.ownerName ?? "—"}`,
      ],
      confirmedFactsBullets: (dataset.issue.confirmedFacts ?? "").split("\n").map((l) => l.replace(/^-+\s*/, "").trim()).filter(Boolean).slice(0, 8),
      openQuestionsBullets: o.openQuestionsAtGeneration,
      claimsAndAssumptionsBullets: o.linkedClaimIds.map((id) => {
        const c = claimById.get(id);
        return c ? `${c.claimCode}: ${c.text}` : `Claim ${id}`;
      }),
      evidenceBaseBullets: o.linkedSourceIds.map((id) => {
        const s = sourceById.get(id);
        return s ? `${s.sourceCode} — ${s.title} (${s.tier})` : `Source ${id}`;
      }),
      observationsBullets: bramleyObservations.map((x) => x.title).slice(0, 6),
      audienceImplicationsBullets: [dataset.issue.audience ?? ""].filter(Boolean),
      recommendedActionsBullets: ["Maintain controlled posture; update as sources change."],
      guardrailsBullets: [...o.caveatsAtGeneration, ...o.doNotSay],
      ...(isLaterRevision
        ? {
            whatChangedBullets: [
              "Updated position based on new records added since prior revision.",
              "See comparison view for detailed diffs between executive brief versions.",
            ],
          }
        : {}),
    });
    return { ...o, briefArtifact: artifact, ...(messageArtifact ? { messageArtifact } : {}) };
  });

  const datasetForValidation = { ...dataset, outputs: outputsWithArtifacts };
  const validationErrors = validateBramleyDataset(datasetForValidation);
  if (validationErrors.length > 0) {
    console.error("Bramley export validation failed:");
    for (const err of validationErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log("Bramley export validation: OK");

  await writeJson("issue.json", dataset.issue);
  await writeJson("inputs.json", dataset.incomingUpdates);
  await writeJson("sources.json", dataset.sources);
  await writeJson("claims.json", dataset.claims);
  await writeJson("questions.json", dataset.openQuestions);
  await writeJson("observations.json", dataset.observations);
  await writeJson("outputs.json", outputsWithArtifacts);
  await writeJson("circulation-events.json", dataset.circulationEvents);
  await writeJson("timeline-projection.json", dataset.timelineProjection);

  const combined = {
    issue: dataset.issue,
    incomingUpdates: dataset.incomingUpdates,
    sources: dataset.sources,
    claims: dataset.claims,
    openQuestions: dataset.openQuestions,
    observations: dataset.observations,
    outputs: outputsWithArtifacts,
    circulationEvents: dataset.circulationEvents,
    timelineProjection: dataset.timelineProjection,
  };

  await writeJson("bramley-junction-demo-export.json", combined);
  console.log("Bramley Junction demo export complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
