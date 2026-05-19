import { NextResponse } from "next/server";

import { BriefArtifactSchema, CreateBriefVersionInputSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { buildPairedBriefArtifact } from "@/lib/brief/buildPairedBriefArtifact";
import { enrichBriefArtifactWithAi } from "@/lib/brief/enrichBriefArtifactWithAi";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

const BRIEF_MODES = ["full", "executive"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await request.json();
  const parsed = CreateBriefVersionInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const issue = gated.issue;

  const genViewer = { membershipRole: gated.ctx.membership.role, userId: gated.ctx.user.id };
  const [sources, gaps, internalInputs, claims, messageVariantsWithAudience] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({
      where: prismaWhereInternalInputsVisibleToViewer(issueId, genViewer),
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.claim.findMany({ where: { issueId }, orderBy: [{ claimNumber: "asc" }] }),
    prisma.messageVariant.findMany({
      where: { issueId, stakeholderGroupId: { not: null } },
      select: {
        stakeholderGroupId: true,
        stakeholderGroup: { select: { name: true } },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const seenStakeholderGroupIds = new Set<string>();
  const messageAudienceGroupNames: string[] = [];
  for (const row of messageVariantsWithAudience) {
    const gid = row.stakeholderGroupId;
    if (!gid || seenStakeholderGroupIds.has(gid)) continue;
    seenStakeholderGroupIds.add(gid);
    const rawName = row.stakeholderGroup?.name;
    if (typeof rawName !== "string") continue;
    const trimmed = rawName.trim();
    if (trimmed) messageAudienceGroupNames.push(trimmed);
  }

  const [latestFull, latestExecutive] = await Promise.all(
    BRIEF_MODES.map((mode) =>
      prisma.briefVersion.findFirst({
        where: { issueId, mode },
        orderBy: { createdAt: "desc" },
      }),
    ),
  );

  const requestedMode = parsed.data.mode;
  const returnExisting =
    latestFull &&
    latestExecutive &&
    latestFull.versionNumber === latestExecutive.versionNumber &&
    latestFull.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime() &&
    latestExecutive.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime();

  if (returnExisting) {
    const existing = requestedMode === "executive" ? latestExecutive : latestFull;
    return NextResponse.json({
      ...existing,
      generatedFromIssueUpdatedAt: existing.generatedFromIssueUpdatedAt.toISOString(),
      createdAt: existing.createdAt.toISOString(),
    });
  }

  const versionNumber = Math.max(latestFull?.versionNumber ?? 0, latestExecutive?.versionNumber ?? 0) + 1;

  const artifactDeterministic = buildPairedBriefArtifact({
    issue,
    sources,
    gaps,
    internalInputs,
    claims,
    messageAudienceGroupNames,
  });

  const synthesisEnabled = process.env.BRIEF_AI_SYNTHESIS_ENABLED === "true";

  const artifact = await (async () => {
    if (!synthesisEnabled) return artifactDeterministic;

    const enriched = await enrichBriefArtifactWithAi(artifactDeterministic, {
      issue,
      sources,
      gaps,
      internalInputs,
      claims,
    });
    const validated = BriefArtifactSchema.safeParse(enriched);
    return validated.success ? validated.data : artifactDeterministic;
  })();

  const created = await prisma.$transaction(async (tx) => {
    const rows = await Promise.all(
      BRIEF_MODES.map((mode) =>
        tx.briefVersion.create({
          data: {
            issueId,
            mode,
            versionNumber,
            generatedFromIssueUpdatedAt: issue.updatedAt,
            artifact,
          },
        }),
      ),
    );

    const primary = rows.find((r) => r.mode === requestedMode) ?? rows[0]!;

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.brief_version_created,
      summary: `Brief v${versionNumber} created (Executive + Full)`,
      refType: "BriefVersion",
      refId: primary.id,
      actorLabel: gated.ctx.user.email ?? null,
    });

    const issueRow = await tx.issue.findUniqueOrThrow({
      where: { id: issueId },
      select: { updatedAt: true },
    });

    const alignedAt = issueRow.updatedAt;
    await Promise.all(
      rows.map((row) =>
        tx.briefVersion.update({
          where: { id: row.id },
          data: { generatedFromIssueUpdatedAt: alignedAt },
        }),
      ),
    );

    return rows.find((r) => r.mode === requestedMode) ?? rows[0]!;
  });

  return NextResponse.json({
    ...created,
    generatedFromIssueUpdatedAt: created.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: created.createdAt.toISOString(),
  });
}
