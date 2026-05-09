import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { CreateSourceInputSchema, SourceTierSchema } from "@metis/shared/source";
import { formatNumericSourceCode, parseNumericSourceCodeOrdinal } from "@/lib/issueRecordCodes";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { isMutationRole } from "@/lib/auth/session";

const tierOrder = ["Official", "Internal", "Major media", "Market signal"] as const;

function compareTier(a: string, b: string) {
  const ai = tierOrder.indexOf(a as (typeof tierOrder)[number]);
  const bi = tierOrder.indexOf(b as (typeof tierOrder)[number]);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
}

function nextSourceCode(existing: string[]) {
  let max = 0;
  for (const code of existing) {
    const n = parseNumericSourceCodeOrdinal(code);
    if (n != null) max = Math.max(max, n);
  }
  return formatNumericSourceCode(max + 1);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  const sources = await prisma.source.findMany({
    where: { issueId },
    orderBy: [{ createdAt: "desc" }],
  });

  sources.sort((a, b) => {
    const byTier = compareTier(a.tier, b.tier);
    if (byTier !== 0) return byTier;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return NextResponse.json(
    sources.map((s) => ({
      ...s,
      note: s.note ?? null,
      snippet: s.snippet ?? null,
      reliability: s.reliability ?? null,
      linkedSection: s.linkedSection ?? null,
      url: s.url ?? null,
      timestampLabel: s.timestampLabel ?? null,
      createdAt: s.createdAt.toISOString(),
    })),
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!isMutationRole(gated.ctx.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await request.json();
  const parsed = CreateSourceInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const titleTrimmed = parsed.data.title.trim();
  const noteTrimmed = (parsed.data.note ?? "").trim();

  if (!titleTrimmed.length || !noteTrimmed.length) {
    return NextResponse.json({ error: "Title and note are required." }, { status: 400 });
  }

  // validate tier is one of the known values even if Prisma stores string
  const tierParsed = SourceTierSchema.safeParse(parsed.data.tier);
  if (!tierParsed.success) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const existingCodes = await tx.source.findMany({
      where: { issueId },
      select: { sourceCode: true },
    });

    const code =
      parsed.data.sourceCode?.trim() && parsed.data.sourceCode.trim().length > 0
        ? parsed.data.sourceCode.trim()
        : nextSourceCode(existingCodes.map((e) => e.sourceCode));

    const source = await tx.source.create({
      data: {
        issueId,
        sourceCode: code,
        tier: parsed.data.tier,
        title: titleTrimmed,
        note: noteTrimmed,
        snippet: parsed.data.snippet ?? null,
        reliability: parsed.data.reliability ?? null,
        linkedSection: parsed.data.linkedSection ?? null,
        url: parsed.data.url ?? null,
        timestampLabel: parsed.data.timestampLabel ?? null,
      },
    });

    await tx.issue.update({
      where: { id: issueId },
      data: { sourcesCount: { increment: 1 } },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.source_created,
      summary: `Source ${source.sourceCode} created`,
      refType: "Source",
      refId: source.id,
      actorLabel: gated.ctx.user.email ?? null,
    });

    return source;
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);

  return NextResponse.json({
    ...created,
    note: created.note ?? null,
    snippet: created.snippet ?? null,
    reliability: created.reliability ?? null,
    linkedSection: created.linkedSection ?? null,
    url: created.url ?? null,
    timestampLabel: created.timestampLabel ?? null,
    createdAt: created.createdAt.toISOString(),
  });
}

