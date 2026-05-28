import { NORTHBANK_CLAIM_IDS } from "./ids";
import { northbankClaims, northbankObservations, northbankOpenQuestions } from "./issue-record";
import type { NorthbankDataset, NorthbankOutputExport } from "./types";
import { northbankAt } from "./timestamps";
import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

function recordAddedAtMs(dataset: NorthbankDataset, id: string): number | null {
  const input = dataset.incomingUpdates.find((u) => u.id === id);
  if (input) return northbankAt(input.addedToMetisAt).getTime();

  const source = dataset.sources.find((s) => s.id === id);
  if (source) return northbankAt(source.addedToMetisAt).getTime();

  const claim = northbankClaims.find((c) => c.id === id);
  if (claim) return northbankAt(claim.createdAt).getTime();

  const gap = northbankOpenQuestions.find((g) => g.id === id);
  if (gap) return northbankAt(gap.createdAt).getTime();

  const obs = northbankObservations.find((o) => o.id === id);
  if (obs) return northbankAt(obs.createdAt).getTime();

  return null;
}

function assertOutputTemporalIntegrity(output: NorthbankOutputExport, dataset: NorthbankDataset): string[] {
  const errors: string[] = [];
  const generatedMs = northbankAt(output.generatedAt).getTime();

  const checkIds = (ids: string[], label: string) => {
    for (const id of ids) {
      const addedMs = recordAddedAtMs(dataset, id);
      if (addedMs === null) {
        errors.push(`${output.title}: ${label} references unknown id ${id}`);
      } else if (addedMs > generatedMs) {
        errors.push(
          `${output.title}: ${label} includes ${id} added at ${new Date(addedMs).toISOString()} after generatedAt ${output.generatedAt}`,
        );
      }
    }
  };

  checkIds(output.linkedSourceIds, "linkedSourceIds");
  checkIds(output.linkedClaimIds, "linkedClaimIds");
  checkIds(output.includedRecordIds, "includedRecordIds");

  return errors;
}

function isBlankOrDash(body: unknown): boolean {
  if (typeof body !== "string") return true;
  const t = body.trim();
  if (!t) return true;
  return t === "—";
}

function validateExecutiveBriefArtifact(output: NorthbankOutputExport): string[] {
  const errors: string[] = [];
  if (output.kind !== "executive_brief") return errors;

  const artifactRaw = (output as any).briefArtifact;
  if (!artifactRaw) {
    errors.push(`${output.title}: briefArtifact missing on exported executive_brief output`);
    return errors;
  }

  const parsed = BriefArtifactSchema.safeParse(artifactRaw);
  if (!parsed.success) {
    errors.push(`${output.title}: briefArtifact failed BriefArtifactSchema validation`);
    return errors;
  }

  const artifact = parsed.data;
  const blocks = artifact.executive?.blocks ?? [];
  if (blocks.length < 5) {
    errors.push(`${output.title}: briefArtifact.executive.blocks must have >= 5 blocks (found ${blocks.length})`);
  }

  const preferred = [
    "Executive summary",
    "Current assessment",
    "Confirmed facts",
    "Open questions and unresolved needs",
    "Evidence base",
  ];
  const labels = new Set(blocks.map((b) => (typeof b?.label === "string" ? b.label.trim() : "")));
  for (const req of preferred) {
    if (![...labels].some((l) => l.toLowerCase() === req.toLowerCase())) {
      errors.push(`${output.title}: briefArtifact missing preferred executive block label "${req}"`);
    }
  }

  for (const b of blocks) {
    const label = typeof b?.label === "string" ? b.label.trim() : "(unlabelled)";
    if (isBlankOrDash(b?.body)) {
      errors.push(`${output.title}: executive block "${label}" has empty/placeholder body`);
    }
  }

  const sections = artifact.full?.sections ?? [];
  if (!sections.length) {
    errors.push(`${output.title}: briefArtifact.full.sections missing or empty`);
    return errors;
  }
  for (const s of sections) {
    const title = typeof s?.title === "string" ? s.title.trim() : s?.id ?? "(untitled)";
    if (isBlankOrDash(s?.body)) {
      errors.push(`${output.title}: full section "${title}" has empty/placeholder body`);
    }
  }

  if ((output.versionNumber ?? 0) >= 2) {
    const hasWhatChanged = blocks.some((b) => typeof b?.label === "string" && b.label.trim().toLowerCase() === "what changed");
    if (!hasWhatChanged) {
      errors.push(`${output.title}: V2+ executive brief should include a "What changed" block`);
    }
  }

  return errors;
}

function validateExecutiveBriefVersionsDiffer(dataset: NorthbankDataset): string[] {
  const errors: string[] = [];
  const execs = dataset.outputs.filter((o) => o.kind === "executive_brief").sort((a, b) => a.generatedAt.localeCompare(b.generatedAt));
  const v1 = execs.find((o) => (o.versionNumber ?? 0) === 1);
  const v2 = execs.find((o) => (o.versionNumber ?? 0) === 2);
  if (!v1 || !v2) return errors;

  if (v1.generatedAt === v2.generatedAt) {
    errors.push(`Executive briefs: V1 and V2 must have different generatedAt (both ${v1.generatedAt})`);
  }

  const a1 = (v1 as any).briefArtifact;
  const a2 = (v2 as any).briefArtifact;
  if (!a1 || !a2) return errors;

  const p1 = BriefArtifactSchema.safeParse(a1);
  const p2 = BriefArtifactSchema.safeParse(a2);
  if (!p1.success || !p2.success) return errors;

  const keyBodies = (artifact: any) =>
    (artifact.executive?.blocks ?? [])
      .map((b: any) => `${String(b?.label ?? "").trim()}::${String(b?.body ?? "").trim()}`)
      .join("\n")
      .trim();
  const k1 = keyBodies(p1.data);
  const k2 = keyBodies(p2.data);
  if (k1 === k2) {
    errors.push("Executive briefs: V2 briefArtifact executive block content duplicates V1");
  }

  return errors;
}

function validateMessageOutputGovernance(output: NorthbankOutputExport, dataset: NorthbankDataset): string[] {
  const errors: string[] = [];
  const isMessage = Boolean(output.metisMessageVariantId);
  if (!isMessage) return errors;

  const label = `${output.title}`;

  if (!output.audience?.trim()) errors.push(`${label}: message output missing audience`);
  if (!output.templateId?.trim()) errors.push(`${label}: message output missing templateId`);
  if (!output.status?.trim()) errors.push(`${label}: message output missing status`);
  if (output.versionNumber == null) errors.push(`${label}: message output missing versionNumber`);
  if (!output.basedOnSnapshotAt?.trim()) errors.push(`${label}: message output missing basedOnSnapshotAt`);
  if (!output.body?.trim()) errors.push(`${label}: message output body is empty`);

  const publicFacing =
    output.templateId === "media_holding_line" ||
    output.templateId === "external_customer_resident_student" ||
    output.templateId === "internal_staff_update";
  if (publicFacing && (!Array.isArray(output.doNotSay) || output.doNotSay.length === 0)) {
    errors.push(`${label}: public/staff/press-facing message should include doNotSay constraints`);
  }

  errors.push(...assertOutputTemporalIntegrity(output, dataset));

  const artifactRaw = (output as any).messageArtifact;
  if (!artifactRaw) {
    errors.push(`${label}: messageArtifact missing on exported message output`);
    return errors;
  }
  const parsed = MessageVariantArtifactSchema.safeParse(artifactRaw);
  if (!parsed.success) {
    errors.push(`${label}: messageArtifact failed MessageVariantArtifactSchema validation`);
    return errors;
  }
  if (parsed.data.templateId !== output.templateId) {
    errors.push(`${label}: messageArtifact.templateId (${parsed.data.templateId}) does not match output.templateId (${output.templateId})`);
  }
  const primary = parsed.data.sections?.[0];
  if (!primary?.body?.trim()) {
    errors.push(`${label}: messageArtifact primary section body is empty`);
  }

  const aiPolish = (output as any).aiPolish as
    | {
        enabled?: boolean;
      }
    | undefined;
  if (aiPolish?.enabled) {
    const draftBody = (output as any).draftBody;
    const aiPolishedBody = (output as any).aiPolishedBody;
    const wordingModeDefault = (output as any).wordingModeDefault;

    if (typeof draftBody !== "string" || !draftBody.trim()) errors.push(`${label}: ai polish enabled but draftBody missing/empty`);
    if (typeof aiPolishedBody !== "string" || !aiPolishedBody.trim())
      errors.push(`${label}: ai polish enabled but aiPolishedBody missing/empty`);
    if (typeof draftBody === "string" && typeof aiPolishedBody === "string" && draftBody.trim() === aiPolishedBody.trim()) {
      errors.push(`${label}: aiPolishedBody must differ from draftBody`);
    }
    if (wordingModeDefault !== "controlled_draft" && wordingModeDefault !== "ai_polished") {
      errors.push(`${label}: ai polish enabled but wordingModeDefault invalid/missing`);
    }

    // Light-touch: ensure AI-polished wording doesn't embed forbidden phrases outside explicit "Do not say" blocks.
    const stripDoNotSayBlock = (body: string): string => {
      const lines = body.split("\n");
      const idx = lines.findIndex((l) => l.trim().toLowerCase() === "do not say");
      return (idx === -1 ? lines : lines.slice(0, idx)).join("\n");
    };
    const forbiddenNeedles = (output.doNotSay ?? [])
      .map((s) =>
        String(s)
          .toLowerCase()
          .trim()
          .replace(/^do not\s+/, "")
          .replace(/^(say|state|confirm|give|quote|imply|engage with)\s+/, "")
          .replace(/[.]+$/g, "")
          .trim(),
      )
      .filter((s) => s.length >= 12);
    if (typeof aiPolishedBody === "string") {
      const hay = stripDoNotSayBlock(aiPolishedBody).toLowerCase();
      for (const needle of forbiddenNeedles) {
        if (hay.includes(needle)) {
          errors.push(`${label}: aiPolishedBody contains doNotSay-derived forbidden phrase "${needle}"`);
        }
      }
    }
  }

  return errors;
}

/** Metis issue-record codes must not appear in human-submitted incoming update text. */
const METIS_GENERATED_LABEL_IN_INPUT = /\b(SRC|CLM|OBS|Q)-\d{3}\b/;

function validateIncomingUpdateFullText(incomingUpdates: { title: string; fullText: string }[]): string[] {
  const errors: string[] = [];
  for (const input of incomingUpdates) {
    if (METIS_GENERATED_LABEL_IN_INPUT.test(input.fullText)) {
      errors.push(
        `${input.title}: incoming update fullText must not contain Metis-generated labels (SRC/CLM/Q/OBS-###)`,
      );
    }
  }
  return errors;
}

export function validateNorthbankDataset(dataset: NorthbankDataset): string[] {
  const errors: string[] = [];

  if (dataset.issue.exportKind !== "final_current_state") {
    errors.push("issue.exportKind must be final_current_state");
  }
  if (!dataset.issue.exportNote.toLowerCase().includes("point-in-time")) {
    errors.push("issue.exportNote should clarify this is not point-in-time state");
  }

  errors.push(...validateIncomingUpdateFullText(dataset.incomingUpdates));

  const q7 = dataset.openQuestions.find((q) => q.gapCode === "Q-007");
  if (q7?.status !== "Open") {
    errors.push("Q-007 post-launch watch should remain Open at final export");
  }

  for (const output of dataset.outputs) {
    errors.push(...assertOutputTemporalIntegrity(output, dataset));
    errors.push(...validateExecutiveBriefArtifact(output));
    errors.push(...validateMessageOutputGovernance(output, dataset));
  }

  const execV1 = dataset.outputs.find((o) => o.title === "Executive brief V1");
  if (execV1?.linkedClaimIds.includes(NORTHBANK_CLAIM_IDS.c10)) {
    errors.push("Executive Brief V1 must not include go/no-go claim CLM-010");
  }
  if (execV1?.linkedSourceIds.some((id) => dataset.sources.find((s) => s.id === id)?.sourceCode === "SRC-011")) {
    errors.push("Executive Brief V1 must not include pricing approval source");
  }

  errors.push(...validateExecutiveBriefVersionsDiffer(dataset));

  return errors;
}
