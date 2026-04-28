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
  type ExternalAudienceInput,
} from "@/lib/messages/generateExternalCustomerUpdate";
import {
  generateInternalStaffUpdateArtifact,
  type AudienceInput as InternalAudienceInput,
} from "@/lib/messages/generateInternalStaffUpdate";
import { revalidatePath } from "next/cache";

function serializeMessageVariant(row: {
  id: string;
  issueId: string;
  templateId: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: Date;
  stakeholderGroupId: string | null;
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
    stakeholderGroupId: row.stakeholderGroupId,
    issueStakeholderId: row.issueStakeholderId,
    audienceSnapshot: row.audienceSnapshot as Record<string, unknown>,
    artifact,
    createdAt: row.createdAt.toISOString(),
  };
}

/** One audience bucket: null = setup note from issue; non-null = organisation StakeholderGroup. */
function whereForLens(stakeholderGroupId: string | null): { stakeholderGroupId: string | null } {
  return { stakeholderGroupId };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);
  const templateRaw = url.searchParams.get("templateId") ?? "external_customer_resident_student";
  const parsedTemplate = MessageVariantTemplateIdSchema.safeParse(templateRaw);
  if (!parsedTemplate.success) {
    return NextResponse.json({ error: "Invalid templateId", issues: parsedTemplate.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lensParam = url.searchParams.get("lens");
  let scopedGroupId: string | null | undefined;
  if (lensParam === "issue" || lensParam === "") {
    scopedGroupId = null;
  } else if (lensParam) {
    const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lensParam);
    if (!ok) {
      return NextResponse.json({ error: "Invalid lens (use issue or a StakeholderGroup id)" }, { status: 400 });
    }
    const activeGroup = await prisma.stakeholderGroup.findFirst({ where: { id: lensParam, isActive: true } });
    if (activeGroup) {
      scopedGroupId = lensParam;
    } else {
      const legacy = await prisma.issueStakeholder.findFirst({ where: { id: lensParam, issueId } });
      if (!legacy) {
        return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
      }
      const groupForLegacy = await prisma.stakeholderGroup.findFirst({
        where: { id: legacy.stakeholderGroupId, isActive: true },
      });
      if (!groupForLegacy) {
        return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
      }
      scopedGroupId = legacy.stakeholderGroupId;
    }
  }

  const history = url.searchParams.get("history") === "1";
  const whereBase: Prisma.MessageVariantWhereInput = { issueId, templateId: parsedTemplate.data };
  const whereScoped: Prisma.MessageVariantWhereInput =
    scopedGroupId === undefined ? whereBase : { ...whereBase, ...whereForLens(scopedGroupId) };

  if (history) {
    const items = await prisma.messageVariant.findMany({
      where: whereScoped,
      orderBy: [{ versionNumber: "desc" }],
      take: 30,
    });
    return NextResponse.json({ items: items.map(serializeMessageVariant) });
  }

  const latest = await prisma.messageVariant.findFirst({
    where: whereScoped,
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

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stakeholderGroupId = parsed.data.stakeholderGroupId ?? null;

  let audience: ExternalAudienceInput;
  let internalAudience: InternalAudienceInput;
  let issueLens: IssueStakeholder | null = null;
  let group: StakeholderGroup | null = null;

  if (stakeholderGroupId) {
    group = await prisma.stakeholderGroup.findFirst({ where: { id: stakeholderGroupId, isActive: true } });
    if (!group) {
      return NextResponse.json({ error: "Audience group not found or inactive" }, { status: 404 });
    }
    issueLens = await prisma.issueStakeholder.findFirst({
      where: { issueId, stakeholderGroupId: group.id },
    });
    audience = { kind: "group", group, issueLens };
    internalAudience = { kind: "group", group, issueLens };
  } else {
    audience = { kind: "setup" };
    internalAudience = { kind: "setup" };
  }

  const [sources, gaps, internalInputs] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
  ]);

  const latestForLens = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: parsed.data.templateId, ...whereForLens(stakeholderGroupId) },
    orderBy: [{ versionNumber: "desc" }],
  });

  if (
    latestForLens &&
    latestForLens.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime() &&
    (latestForLens.stakeholderGroupId ?? null) === stakeholderGroupId
  ) {
    return NextResponse.json(serializeMessageVariant(latestForLens));
  }

  const globalLatest = await prisma.messageVariant.findFirst({
    where: { issueId, templateId: parsed.data.templateId },
    orderBy: [{ versionNumber: "desc" }],
  });
  const versionNumber = (globalLatest?.versionNumber ?? 0) + 1;

  const artifact = (() => {
    if (parsed.data.templateId === "external_customer_resident_student") {
      return generateExternalCustomerResidentStudentArtifact({ issue, sources, gaps, audience });
    }
    return generateInternalStaffUpdateArtifact({ issue, sources, gaps, internalInputs, audience: internalAudience });
  })();
  const audienceSnapshot = buildAudienceSnapshot(issue, audience);

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.messageVariant.create({
      data: {
        issueId,
        templateId: parsed.data.templateId,
        versionNumber,
        generatedFromIssueUpdatedAt: issue.updatedAt,
        stakeholderGroupId,
        issueStakeholderId: issueLens?.id ?? null,
        audienceSnapshot: audienceSnapshot as Prisma.InputJsonValue,
        artifact: artifact as Prisma.InputJsonValue,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.message_variant_created,
      summary: `Message variant ${row.versionNumber} (${row.templateId})`,
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
