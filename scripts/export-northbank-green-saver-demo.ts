/**
 * Deterministic JSON export for the external Northbank Green Saver demo.
 * Run: npm run demo:export:northbank
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildNorthbankBriefArtifact } from "@/lib/demo/northbank-green-saver/brief-artifacts";
import { buildNorthbankDataset } from "@/lib/demo/northbank-green-saver/build-dataset";
import { buildNorthbankMessageArtifact } from "@/lib/demo/northbank-green-saver/message-artifacts";
import { validateNorthbankDataset } from "@/lib/demo/northbank-green-saver/validate-export";
import { northbankClaims, northbankObservations, northbankSources } from "@/lib/demo/northbank-green-saver/issue-record";
import { northbankLabelFromAt } from "@/lib/demo/northbank-green-saver/timestamps";

const OUT_DIR = path.join(process.cwd(), "public/demo/northbank-green-saver");

async function writeJson(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(OUT_DIR, filename);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${filePath}`);
}

async function main(): Promise<void> {
  const dataset = buildNorthbankDataset();

  await mkdir(OUT_DIR, { recursive: true });

  const claimById = new Map(northbankClaims.map((c) => [c.id, c] as const));
  const sourceById = new Map(northbankSources.map((s) => [s.id, s] as const));

  const outputsWithArtifacts = dataset.outputs.map((o) => {
    const isMessageOutput = Boolean(o.metisMessageVariantId);
    const templateId = (o.templateId ?? "").trim();
    const messageArtifact =
      isMessageOutput && templateId
        ? buildNorthbankMessageArtifact({
            templateId: templateId as any,
            sectionTitle: o.title,
            body: o.body,
            mustAvoid: o.doNotSay,
            publicHeadline: "Northbank Green Saver",
            lastRevisionLabel: northbankLabelFromAt(o.generatedAt),
            openGapsLabel: o.openQuestionsAtGeneration.join(", ") || "None",
            audienceLabel: o.audience,
            toneNotes: "Regulated BAU launch readiness; factual, caveated, and non-campaign tone.",
          })
        : undefined;

    if (o.kind !== "executive_brief") return { ...o, ...(messageArtifact ? { messageArtifact } : {}) };
    const isLaterRevision = (o.versionNumber ?? 0) >= 2;
    const artifact = buildNorthbankBriefArtifact({
      lede: dataset.issue.currentControlledPosition,
      executiveSummary: o.body.split("\n").slice(0, 6).join(" ").trim(),
      lastRevisionLabel: northbankLabelFromAt(o.generatedAt),
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
      observationsBullets: northbankObservations.map((x) => x.title).slice(0, 6),
      audienceImplicationsBullets: [dataset.issue.audience ?? ""].filter(Boolean),
      recommendedActionsBullets: ["Maintain controlled posture; update as approvals land."],
      guardrailsBullets: [...o.caveatsAtGeneration, ...o.doNotSay],
      ...(isLaterRevision
        ? {
            whatChangedBullets: [
              "Updated position based on new approvals/records since prior revision.",
              "See comparison view for detailed diffs between executive brief versions.",
            ],
          }
        : {}),
    });
    return { ...o, briefArtifact: artifact, ...(messageArtifact ? { messageArtifact } : {}) };
  });

  const datasetForValidation = { ...dataset, outputs: outputsWithArtifacts };
  const validationErrors = validateNorthbankDataset(datasetForValidation);
  if (validationErrors.length > 0) {
    console.error("Northbank export validation failed:");
    for (const err of validationErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
  console.log("Northbank export validation: OK");

  await writeJson("issue.json", dataset.issue);
  await writeJson("inputs.json", dataset.incomingUpdates);
  await writeJson("sources.json", dataset.sources);
  await writeJson("claims.json", dataset.claims);
  await writeJson("open-questions.json", dataset.openQuestions);
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

  await writeJson("northbank-green-saver-demo-export.json", combined);
  console.log("Northbank Green Saver demo export complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
