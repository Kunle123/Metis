import { NextResponse } from "next/server";

import { BriefArtifactSchema, CreateBriefVersionInputSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { generateBriefFromIssue } from "@/lib/brief/generateBriefFromIssue";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";
import { synthesizeBriefExecutiveSummary } from "@/lib/ai/synthesizeBrief";

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

  const [sources, gaps, internalInputs] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
  ]);

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
    { issue, sources, gaps, internalInputs },
    parsed.data.mode,
  );

  const artifact = await (async () => {
    if (parsed.data.mode !== "full") return artifactDeterministic;

    const exec = artifactDeterministic.full.sections.find((s) => s.id === "executive-summary");
    if (!exec?.body?.trim()) return artifactDeterministic;

    const internalInputsForBrief = internalInputs.filter((i: any) => !Boolean((i as any).excludedFromBrief));
    const topObservations = internalInputsForBrief.slice(0, 2).map((i) => ({
      role: i.role,
      name: i.name,
      confidence: i.confidence ?? null,
      linkedSection: i.linkedSection ?? null,
      response: String(i.response ?? "").slice(0, 360),
    }));

    const topSources = sources.slice(0, 2).map((s) => ({
      sourceCode: s.sourceCode,
      tier: s.tier,
      title: s.title,
      linkedSection: s.linkedSection ?? null,
    }));

    const openTracker = gaps
      .filter((g) => g.status === "Open")
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

    const rewrite = await synthesizeBriefExecutiveSummary({
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
      deterministicExecutiveSummaryBody: exec.body,
    });

    if (!rewrite?.rewrite?.trim()) return artifactDeterministic;

    const updated = {
      ...artifactDeterministic,
      full: {
        ...artifactDeterministic.full,
        sections: artifactDeterministic.full.sections.map((s) =>
          s.id === "executive-summary" ? { ...s, body: rewrite.rewrite } : s,
        ),
      },
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

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.brief_version_created,
      summary: `Brief version ${briefVersion.versionNumber} created`,
      refType: "BriefVersion",
      refId: briefVersion.id,
      actorLabel: user.email ?? null,
    });

    return briefVersion;
  });

  return NextResponse.json({
    ...created,
    generatedFromIssueUpdatedAt: created.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: created.createdAt.toISOString(),
  });
}

