import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { CreateGapInputSchema, GapSeveritySchema, GapStatusSchema } from "@metis/shared/gap";
import { prisma } from "@/lib/db/prisma";
import { isOpenGapStatus } from "@/lib/gaps/openGapsCount";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";

function serializeGap(gap: {
  id: string;
  issueId: string;
  title: string;
  whyItMatters: string;
  stakeholder: string;
  linkedSection: string | null;
  severity: string;
  status: string;
  prompt: string;
  resolvedByInternalInputId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: gap.id,
    issueId: gap.issueId,
    title: gap.title,
    whyItMatters: gap.whyItMatters,
    stakeholder: gap.stakeholder,
    linkedSection: gap.linkedSection,
    severity: GapSeveritySchema.parse(gap.severity),
    status: GapStatusSchema.parse(gap.status),
    prompt: gap.prompt,
    resolvedByInternalInputId: gap.resolvedByInternalInputId,
    createdAt: gap.createdAt.toISOString(),
    updatedAt: gap.updatedAt.toISOString(),
  };
}

function sortGapsForUi<T extends { status: string; severity: string; createdAt: Date }>(gaps: T[]): T[] {
  const severityRank = (s: string) => {
    if (s === "Critical") return 0;
    if (s === "Important") return 1;
    if (s === "Watch") return 2;
    return 9;
  };

  return [...gaps].sort((a, b) => {
    const ao = isOpenGapStatus(a.status) ? 0 : 1;
    const bo = isOpenGapStatus(b.status) ? 0 : 1;
    if (ao !== bo) return ao - bo;

    const as = severityRank(a.severity);
    const bs = severityRank(b.severity);
    if (as !== bs) return as - bs;

    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const gaps = await prisma.gap.findMany({
    where: { issueId },
  });

  return NextResponse.json(sortGapsForUi(gaps).map(serializeGap));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CreateGapInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const titleTrimmed = parsed.data.title.trim();
  const whyItMattersTrimmed = parsed.data.whyItMatters.trim();
  const stakeholderTrimmed = parsed.data.stakeholder.trim();
  const linkedSectionTrimmed = (parsed.data.linkedSection ?? "").trim();
  const promptTrimmed = parsed.data.prompt.trim();

  if (!titleTrimmed.length || !whyItMattersTrimmed.length || !stakeholderTrimmed.length || !promptTrimmed.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status = parsed.data.status ?? "Open";
  const severityParsed = GapSeveritySchema.safeParse(parsed.data.severity);
  const statusParsed = GapStatusSchema.safeParse(status);
  if (!severityParsed.success || !statusParsed.success) {
    return NextResponse.json({ error: "Invalid gap fields" }, { status: 400 });
  }

  if (statusParsed.data === "Resolved") {
    return NextResponse.json({ error: "Gaps cannot be created as Resolved without internal input linkage" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const gap = await tx.gap.create({
      data: {
        issueId,
        title: titleTrimmed,
        whyItMatters: whyItMattersTrimmed,
        stakeholder: stakeholderTrimmed,
        linkedSection: linkedSectionTrimmed.length ? linkedSectionTrimmed : null,
        severity: severityParsed.data,
        status: statusParsed.data,
        prompt: promptTrimmed,
        resolvedByInternalInputId: null,
      },
    });

    if (isOpenGapStatus(gap.status)) {
      await tx.issue.update({
        where: { id: issueId },
        data: { openGapsCount: { increment: 1 } },
      });
    }

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.gap_created,
      summary: "Gap created",
      refType: "Gap",
      refId: gap.id,
      actorLabel: user.email ?? null,
    });

    return gap;
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);

  return NextResponse.json(serializeGap(created));
}
