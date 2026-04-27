import { NextResponse } from "next/server";
import type { IssueStakeholder, StakeholderGroup } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  CreateMessageVariantInputSchema,
  MessageVariantArtifactSchema,
  MessageVariantTemplateIdSchema,
  type MessageVariantTemplateId,
} from "@metis/shared/messageVariant";
import { prisma } from "@/lib/db/prisma";
import { requireMutation } from "@/lib/governance/requireMutation";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import {
  buildAudienceSnapshot,
  generateExternalCustomerResidentStudentArtifact,
} from "@/lib/messages/generateExternalCustomerUpdate";
import { revalidatePath } from "next/cache";

const TEMPLATE: MessageVariantTemplateId = "external_customer_resident_student";

function serializeMessageVariant(row: {
  id: string;
  issueId: string;
  templateId: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: Date;
  issueStakeholderId: string | null;
  audienceSnapshot: unknown;
  artifact: unknown;
  createdAt: Date;
}) {
  const artifact = MessageVariantArtifactSchema.parse(row.artifact);
  return {
    id: row.id,
    issueId: row.issueId,
    templateId: row.templateId,
    versionNumber: row.versionNumber,
    generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt.toISOString(),
    issueStakeholderId: row.issueStakeholderId,
    audienceSnapshot: row.audienceSnapshot as Record<string, unknown>,
    artifact,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);
  const templateRaw = url.searchParams.get("templateId") ?? TEMPLATE;
  const parsedTemplate = MessageVariantTemplateIdSchema.safeParse(templateRaw);
  if (!parsedTemplate.success) {
    return NextResponse.json({ error: "Invalid templateId", issues: parsedTemplate.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = url.searchParams.get("history") === "1";
  if (history) {
    const items = await prisma.messageVariant.findMany({
      where: { issueId, templateId: parsedTemplate.data },
      orderBy: [{ versionNumber: "desc" }],
      take: 30,
    });
    return NextResponse.json({ items: items.map(serializeMessageVariant) });
  }

  const latest = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: parsedTemplate.data },
    orderBy: [{ versionNumber: "desc" }],
  });

  return NextResponse.json({ latest: latest ? serializeMessageVariant(latest) : null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = CreateMessageVariantInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  if (parsed.data.templateId !== TEMPLATE) {
    return NextResponse.json({ error: "Unsupported templateId" }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stakeholderId = parsed.data.issueStakeholderId ?? null;
  let issueStakeholder: (IssueStakeholder & { stakeholderGroup: StakeholderGroup }) | null = null;
  if (stakeholderId) {
    issueStakeholder = await prisma.issueStakeholder.findFirst({
      where: { id: stakeholderId, issueId },
      include: { stakeholderGroup: true },
    });
    if (!issueStakeholder) {
      return NextResponse.json({ error: "Issue stakeholder not found for this issue" }, { status: 404 });
    }
  }

  const [sources, gaps] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
  ]);

  const latest = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: TEMPLATE },
    orderBy: [{ versionNumber: "desc" }],
  });

  if (
    latest &&
    latest.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime() &&
    (latest.issueStakeholderId ?? null) === stakeholderId
  ) {
    return NextResponse.json(serializeMessageVariant(latest));
  }

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const artifact = generateExternalCustomerResidentStudentArtifact({
    issue,
    sources,
    gaps,
    issueStakeholder,
  });
  const audienceSnapshot = buildAudienceSnapshot(issue, issueStakeholder);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.messageVariant.create({
      data: {
        issueId,
        templateId: TEMPLATE,
        versionNumber,
        generatedFromIssueUpdatedAt: issue.updatedAt,
        issueStakeholderId: stakeholderId,
        audienceSnapshot: audienceSnapshot as Prisma.InputJsonValue,
        artifact: artifact as Prisma.InputJsonValue,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.message_variant_created,
      summary: `Message variant ${row.versionNumber} (${TEMPLATE})`,
      refType: "MessageVariant",
      refId: row.id,
    });

    return row;
  });

  revalidatePath(`/issues/${issueId}/messages`);
  revalidatePath(`/issues/${issueId}/export`);
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/");

  return NextResponse.json(serializeMessageVariant(created));
}
