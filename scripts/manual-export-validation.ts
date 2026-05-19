/**
 * Manual export validation for feasibility issue 4444…
 * Run: npm run db:seed && npx tsx scripts/manual-export-validation.ts
 */
import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

import { generateBriefFromIssue } from "@/lib/brief/generateBriefFromIssue";
import { prisma } from "@/lib/db/prisma";
import { FEASIBILITY_SERVICE_HOURS_ISSUE_ID } from "@/db/prisma/seedFeasibilityServiceHours";

const STAKEHOLDER_GROUP_IDS = {
  serviceUsers: "44444444-a001-4001-8001-000000000001",
  councillors: "44444444-a002-4002-8002-000000000002",
  staff: "44444444-a003-4003-8003-000000000003",
} as const;
import { loadBriefingPackContext } from "@/lib/export/loadBriefingPackContext";
import { renderBriefingPackHtml } from "@/lib/export/briefingPack";
import { resolveBriefVersionForExport } from "@/lib/export/resolveBriefVersionForExport";
import { generateExternalCustomerResidentStudentArtifact } from "@/lib/messages/generateExternalCustomerUpdate";
import { generateInternalStaffUpdateArtifact } from "@/lib/messages/generateInternalStaffUpdate";

const ISSUE_ID = FEASIBILITY_SERVICE_HOURS_ISSUE_ID;

const BANNED = [
  /feasibility qa/i,
  /\bdev seed\b/i,
  /dev\/staging/i,
  /generated from the current issue record/i,
  /what we are doing/i,
  /use the contact channels your organisation has published/i,
  /intended to test whether metis/i,
  /not production content/i,
];

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

async function ensureExecutiveBrief() {
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: ISSUE_ID } });
  const [sources, gaps, internalInputs, claims, messageVariantsWithAudience] = await Promise.all([
    prisma.source.findMany({ where: { issueId: ISSUE_ID }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId: ISSUE_ID }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId: ISSUE_ID }, orderBy: [{ createdAt: "desc" }] }),
    prisma.claim.findMany({ where: { issueId: ISSUE_ID }, orderBy: [{ claimNumber: "asc" }] }),
    prisma.messageVariant.findMany({
      where: { issueId: ISSUE_ID, stakeholderGroupId: { not: null } },
      select: { stakeholderGroupId: true, stakeholderGroup: { select: { name: true } } },
    }),
  ]);

  const messageAudienceGroupNames: string[] = [];
  const seen = new Set<string>();
  for (const row of messageVariantsWithAudience) {
    const gid = row.stakeholderGroupId;
    if (!gid || seen.has(gid)) continue;
    seen.add(gid);
    const name = row.stakeholderGroup?.name?.trim();
    if (name) messageAudienceGroupNames.push(name);
  }

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId: ISSUE_ID, mode: "executive" },
    orderBy: { createdAt: "desc" },
  });
  if (latest && latest.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime()) {
    return latest;
  }

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const artifact = generateBriefFromIssue(
    { issue, sources, gaps, internalInputs, claims, messageAudienceGroupNames },
    "executive",
  );

  return prisma.briefVersion.create({
    data: {
      issueId: ISSUE_ID,
      mode: "executive",
      versionNumber,
      generatedFromIssueUpdatedAt: issue.updatedAt,
      artifact,
    },
  });
}

async function ensureMessage(
  templateId: "external_customer_resident_student" | "internal_staff_update",
  stakeholderGroupId: string,
) {
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: ISSUE_ID } });
  const group = await prisma.stakeholderGroup.findUniqueOrThrow({ where: { id: stakeholderGroupId } });
  const [sources, gaps, internalInputs, claims] = await Promise.all([
    prisma.source.findMany({ where: { issueId: ISSUE_ID } }),
    prisma.gap.findMany({ where: { issueId: ISSUE_ID } }),
    prisma.internalInput.findMany({ where: { issueId: ISSUE_ID } }),
    prisma.claim.findMany({ where: { issueId: ISSUE_ID }, orderBy: [{ claimNumber: "asc" }] }),
  ]);

  const audience = { kind: "group" as const, group, issueLens: null };
  const artifact =
    templateId === "external_customer_resident_student"
      ? generateExternalCustomerResidentStudentArtifact({ issue, sources, gaps, claims, audience })
      : generateInternalStaffUpdateArtifact({ issue, sources, gaps, internalInputs, claims, audience });

  const globalLatest = await prisma.messageVariant.findFirst({
    where: { issueId: ISSUE_ID, templateId },
    orderBy: [{ versionNumber: "desc" }],
  });
  const versionNumber = (globalLatest?.versionNumber ?? 0) + 1;

  return prisma.messageVariant.create({
    data: {
      issueId: ISSUE_ID,
      templateId,
      versionNumber,
      generatedFromIssueUpdatedAt: issue.updatedAt,
      stakeholderGroupId,
      issueStakeholderId: null,
      audienceSnapshot: { groupName: group.name },
      artifact,
      approvalStatus: "draft",
    },
  });
}

function checkHtml(html: string) {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const hits = BANNED.filter((re) => re.test(plain));
  const uuids = [...new Set((plain.match(UUID_RE) ?? []))];
  const guardrailDup =
    (html.match(/do not confirm final hours/gi) ?? []).length > 2 ||
    (html.match(/do not say yet/gi) ?? []).length > 8;

  return {
    hasBriefingPack: html.includes('class="briefing-pack"'),
    hasCover: html.includes("pack-cover") && html.includes("meta-grid"),
    hasExecutive: html.includes("Executive brief"),
    hasMessages: html.includes("Message drafts"),
    hasRecordBasis: html.includes("Record basis"),
    lightSurface: html.includes("#ffffff") && html.includes("color-scheme: light"),
    darkInk: html.includes("--doc-ink") || html.includes("#141418"),
    hasPrintStyles: html.includes("@media print"),
    bannedHits: hits.map(String),
    uuidCount: uuids.length,
    uuidsSample: uuids.slice(0, 3),
    guardrailSuspectDup: guardrailDup,
    messageCards: (html.match(/class="message-card"/g) ?? []).length,
  };
}

async function main() {
  console.log("Seeding artefacts for export validation…\n");
  await ensureExecutiveBrief();
  await ensureMessage("external_customer_resident_student", STAKEHOLDER_GROUP_IDS.serviceUsers);
  await ensureMessage("external_customer_resident_student", STAKEHOLDER_GROUP_IDS.councillors);
  await ensureMessage("internal_staff_update", STAKEHOLDER_GROUP_IDS.staff);

  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: ISSUE_ID } });
  const resolved = await resolveBriefVersionForExport(ISSUE_ID, "executive", "executive-brief");
  if (!resolved) throw new Error("No brief for export");

  const artifact = BriefArtifactSchema.parse(resolved.briefVersion.artifact);
  const sourceBriefLabel = `Executive brief v${resolved.briefVersion.versionNumber}`;
  const briefingPack = await loadBriefingPackContext(issue, {
    format: "executive-brief",
    sourceBriefLabel,
  });

  const html = renderBriefingPackHtml(briefingPack, artifact);
  const checks = checkHtml(html);

  console.log("Issue:", issue.title);
  console.log("Brief:", sourceBriefLabel);
  console.log("Messages in pack:", briefingPack.messages.length);
  for (const m of briefingPack.messages) {
    console.log(`  - ${m.templateLabel} · ${m.audienceLabel}`);
  }
  console.log("\nHTML checks:");
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }

  const execSummary = artifact.executive.blocks.find((b) => b.label.includes("Executive summary"));
  if (execSummary) {
    const lead = execSummary.body.slice(0, 200).replace(/\n/g, " ");
    console.log("\nExecutive summary (lead):", lead, "…");
  }

  const allOk =
    checks.hasBriefingPack &&
    checks.hasCover &&
    checks.hasExecutive &&
    checks.hasMessages &&
    checks.hasRecordBasis &&
    checks.lightSurface &&
    checks.bannedHits.length === 0 &&
    checks.uuidCount === 0;

  console.log(allOk ? "\n✓ Manual export validation PASSED" : "\n✗ Manual export validation FAILED");
  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
