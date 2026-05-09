import { NextResponse } from "next/server";

import { BriefArtifactSchema, CreateBriefVersionInputSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { generateBriefFromIssue } from "@/lib/brief/generateBriefFromIssue";
import { buildBriefSynthesisInput } from "@/lib/brief/buildBriefSynthesisInput";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { synthesizeBriefAlternateWording, synthesizeBriefExecutiveSummary } from "@/lib/ai/synthesizeBrief";

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

  const [sources, gaps, internalInputs, messageVariantsWithAudience] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
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

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId, mode: parsed.data.mode },
    orderBy: { createdAt: "desc" },
  });

  if (latest && latest.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime()) {
    return NextResponse.json({
      ...latest,
      generatedFromIssueUpdatedAt: latest.generatedFromIssueUpdatedAt.toISOString(),
      createdAt: latest.createdAt.toISOString(),
    });
  }

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const artifactDeterministic = generateBriefFromIssue(
    { issue, sources, gaps, internalInputs, messageAudienceGroupNames },
    parsed.data.mode,
  );

  const synthesisEnabled = process.env.BRIEF_AI_SYNTHESIS_ENABLED === "true";

  const artifact = await (async () => {
    if (parsed.data.mode !== "full" && parsed.data.mode !== "executive") return artifactDeterministic;

    if (!synthesisEnabled) return artifactDeterministic;

    const attemptedAtIso = new Date().toISOString();

    const items = [];

    if (parsed.data.mode === "full") {
      const exec = artifactDeterministic.full.sections.find((s) => s.id === "executive-summary");
      if (!exec?.body?.trim()) return artifactDeterministic;

      const synthesisInput = buildBriefSynthesisInput({
        issue,
        sources,
        gaps,
        internalInputs,
        deterministicExecutiveSummaryBody: exec.body,
      });
      const rewrite = await synthesizeBriefExecutiveSummary(synthesisInput);

      const fullTarget = { mode: "full" as const, kind: "section" as const, id: "executive-summary" };
      if (rewrite?.rewrite?.trim()) {
        items.push({
          target: fullTarget,
          status: "succeeded" as const,
          attemptedAtIso,
          aiAlternateBody: rewrite.rewrite,
          ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
        });
      } else {
        items.push({
          target: fullTarget,
          status: "failed" as const,
          attemptedAtIso,
        });
      }

      const updated = {
        ...artifactDeterministic,
        alternateWording: { items },
        full: {
          ...artifactDeterministic.full,
          // Legacy: keep existing Full-only field for back-compat while also writing unified metadata.
          executiveSummarySynthesis: rewrite?.rewrite?.trim()
            ? {
                status: "succeeded" as const,
                attemptedAtIso,
                aiEnhancedBody: rewrite.rewrite,
                ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
              }
            : {
                status: "failed" as const,
                attemptedAtIso,
              },
        },
      };

      const validated = BriefArtifactSchema.safeParse(updated);
      if (!validated.success) return artifactDeterministic;
      return validated.data;
    }

    const execBlock = artifactDeterministic.executive.blocks.find((b) => b.label.trim() === "Executive summary");
    if (!execBlock?.body?.trim()) return artifactDeterministic;

    const synthesisInput = buildBriefSynthesisInput({
      issue,
      sources,
      gaps,
      internalInputs,
      deterministicExecutiveSummaryBody: execBlock.body,
    });
    const rewrite = await synthesizeBriefAlternateWording({
      input: synthesisInput,
      targetLabel: 'Executive brief “Executive summary” block',
    });

    const execTarget = { mode: "executive" as const, kind: "block" as const, id: "Executive summary" };
    if (rewrite?.rewrite?.trim()) {
      items.push({
        target: execTarget,
        status: "succeeded" as const,
        attemptedAtIso,
        aiAlternateBody: rewrite.rewrite,
        ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
      });
    } else {
      items.push({
        target: execTarget,
        status: "failed" as const,
        attemptedAtIso,
      });
    }

    const updated = {
      ...artifactDeterministic,
      alternateWording: { items },
    };
    const validated = BriefArtifactSchema.safeParse(updated);
    if (!validated.success) return artifactDeterministic;
    return validated.data;
  })();

  const created = await prisma.$transaction(async (tx) => {
    const briefVersion = await tx.briefVersion.create({
      data: {
        issueId,
        mode: parsed.data.mode,
        versionNumber,
        generatedFromIssueUpdatedAt: issue.updatedAt,
        artifact,
      },
    });

    const briefModeLabel = parsed.data.mode === "executive" ? "Executive" : "Full";
    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.brief_version_created,
      summary: `${briefModeLabel} brief v${briefVersion.versionNumber} created`,
      refType: "BriefVersion",
      refId: briefVersion.id,
      actorLabel: gated.ctx.user.email ?? null,
    });

    // `writeIssueActivity` updates `Issue.lastActivityAt`, which bumps `Issue.updatedAt` (@updatedAt).
    // Align stored freshness with the issue row as it exists after that write so the new brief is not "Stale".
    const issueRow = await tx.issue.findUniqueOrThrow({
      where: { id: issueId },
      select: { updatedAt: true },
    });

    return tx.briefVersion.update({
      where: { id: briefVersion.id },
      data: { generatedFromIssueUpdatedAt: issueRow.updatedAt },
    });
  });

  return NextResponse.json({
    ...created,
    generatedFromIssueUpdatedAt: created.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: created.createdAt.toISOString(),
  });
}

