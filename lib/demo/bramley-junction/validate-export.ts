import { bramleyClaims, bramleyObservations, bramleyOpenQuestions } from "./issue-record";
import type { BramleyDataset, BramleyOutputExport } from "./types";
import { bramleyAt } from "./timestamps";
import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

function recordAddedAtMs(dataset: BramleyDataset, id: string): number | null {
  const input = dataset.incomingUpdates.find((u) => u.id === id);
  if (input) return bramleyAt(input.addedToMetisAt).getTime();

  const source = dataset.sources.find((s) => s.id === id);
  if (source) return bramleyAt(source.addedToMetisAt).getTime();

  const claim = bramleyClaims.find((c) => c.id === id);
  if (claim) return bramleyAt(claim.createdAt).getTime();

  const gap = bramleyOpenQuestions.find((g) => g.id === id);
  if (gap) return bramleyAt(gap.createdAt).getTime();

  const obs = bramleyObservations.find((o) => o.id === id);
  if (obs) return bramleyAt(obs.createdAt).getTime();

  return null;
}

function assertOutputTemporalIntegrity(output: BramleyOutputExport, dataset: BramleyDataset): string[] {
  const errors: string[] = [];
  const generatedMs = bramleyAt(output.generatedAt).getTime();

  const checkIds = (ids: string[], label: string) => {
    for (const id of ids) {
      const addedMs = recordAddedAtMs(dataset, id);
      if (addedMs === null) {
        errors.push(`${output.title}: ${label} references unknown id ${id}`);
      } else if (addedMs > generatedMs) {
        errors.push(
          `${output.title}: ${label} includes ${id} added to Metis at ${new Date(addedMs).toISOString()} after generatedAt ${output.generatedAt}`,
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

function validateExecutiveBriefArtifact(output: BramleyOutputExport): string[] {
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

function validateExecutiveBriefVersionsDiffer(dataset: BramleyDataset): string[] {
  const errors: string[] = [];
  const execs = dataset.outputs.filter((o) => o.kind === "executive_brief").sort((a, b) => a.generatedAt.localeCompare(b.generatedAt));
  if (execs.length < 2) return errors;
  const v1 = execs[0]!;
  const v2 = execs[1]!;

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

function validateMessageOutputGovernance(output: BramleyOutputExport, dataset: BramleyDataset): string[] {
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

  // Temporal integrity is already checked via linked/included IDs, but keep message-specific alias.
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
  return errors;
}

/** Returns validation errors; empty array means pass. */
export function validateBramleyDataset(dataset: BramleyDataset): string[] {
  const errors: string[] = [];

  if (dataset.issue.exportKind !== "final_current_state") {
    errors.push("issue.exportKind must be final_current_state");
  }
  if (!dataset.issue.exportNote.includes("point-in-time")) {
    errors.push("issue.exportNote should clarify this is not point-in-time state");
  }

  const q6 = dataset.openQuestions.find((q) => q.gapCode === "Q-006");
  if (q6?.status === "Open" && q6.resolvedByIncomingUpdateId) {
    errors.push("Q-006 is Open but has resolvedByIncomingUpdateId");
  }

  const q4 = dataset.openQuestions.find((q) => q.gapCode === "Q-004");
  if (q4 && bramleyAt(q4.resolvedAt ?? "").getTime() >= bramleyAt("2026-05-11T08:12:00").getTime()) {
    errors.push("Q-004 should resolve before main entrance reopening");
  }

  const q5 = dataset.openQuestions.find((q) => q.gapCode === "Q-005");
  if (!q5?.partiallyAnsweredAt) {
    errors.push("Q-005 should have partiallyAnsweredAt");
  }

  const social = dataset.sources.find((s) => s.sourceCode === "SRC-008");
  if (social?.tier === "Major media") {
    errors.push("SRC-008 tier should not be Major media");
  }

  const press = dataset.sources.find((s) => s.sourceCode === "SRC-009");
  if (press?.tier === "Major media") {
    errors.push("SRC-009 tier should not be Major media");
  }

  for (const output of dataset.outputs) {
    errors.push(...assertOutputTemporalIntegrity(output, dataset));
    errors.push(...validateExecutiveBriefArtifact(output));
    errors.push(...validateMessageOutputGovernance(output, dataset));
  }

  errors.push(...validateExecutiveBriefVersionsDiffer(dataset));

  return errors;
}
