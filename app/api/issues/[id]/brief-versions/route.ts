import { NextResponse } from "next/server";

import { BriefArtifactSchema, CreateBriefVersionInputSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { generateBriefFromIssue } from "@/lib/brief/generateBriefFromIssue";
import { rankInternalInputsForIssue, rankOpenGapsForIssue, rankSourcesForIssue } from "@/lib/evidence/rankEvidence";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";
import { synthesizeBriefAlternateWording, synthesizeBriefExecutiveSummary } from "@/lib/ai/synthesizeBrief";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CreateBriefVersionInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    const rankedSources = rankSourcesForIssue(sources);
    const rankedOpenGaps = rankOpenGapsForIssue(gaps, { onlyOpen: true });
    const rankedInputsForBrief = rankInternalInputsForIssue(internalInputs, { excludeFromBrief: true });
    const topObservations = rankedInputsForBrief.slice(0, 2).map((i) => ({
      role: i.role,
      name: i.name,
      confidence: i.confidence ?? null,
      linkedSection: i.linkedSection ?? null,
      response: String(i.response ?? "").slice(0, 360),
    }));

    const topSources = rankedSources.slice(0, 2).map((s) => ({
      sourceCode: s.sourceCode,
      tier: s.tier,
      title: s.title,
      linkedSection: s.linkedSection ?? null,
    }));

    const openTracker = rankedOpenGaps
      .slice(0, 5)
      .map((g) => ({
        severity: g.severity ?? null,
        linkedSection: (g as any).linkedSection ?? null,
        text: (g.prompt || g.title || "").trim(),
      }))
      .filter((x) => x.text.length);

    const openQuestionsIntake = String(issue.openQuestions ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 6);

    const audienceNote = String(issue.audience ?? "").trim();
    const audienceContextSummary = audienceNote
      ? `Audience note: ${audienceNote}`
      : "No specific audience note is recorded on the issue.";

    const synthesisInput = {
      issue: {
        title: issue.title,
        summary: issue.summary,
        context: issue.context ?? "",
        confirmedFacts: issue.confirmedFacts ?? "",
        openQuestionsIntake,
        audienceContextSummary,
      },
      topTrackerOpenQuestions: openTracker,
      topSources,
      topObservations,
      deterministicExecutiveSummaryBody: "",
    };

    const items = [];

    if (parsed.data.mode === "full") {
      const exec = artifactDeterministic.full.sections.find((s) => s.id === "executive-summary");
      if (!exec?.body?.trim()) return artifactDeterministic;

      synthesisInput.deterministicExecutiveSummaryBody = exec.body;
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

    synthesisInput.deterministicExecutiveSummaryBody = execBlock.body;
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
      actorLabel: user.email ?? null,
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

