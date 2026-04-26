import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireMutation } from "@/lib/governance/requireMutation";
import { CreateIssueStakeholderInputSchema, IssueStakeholderPrioritySchema, StakeholderGroupSensitivitySchema } from "@metis/shared/stakeholder";

function serializeIssueStakeholder(row: {
  id: string;
  issueId: string;
  stakeholderGroupId: string;
  priority: string;
  needsToKnow: string;
  issueRisk: string;
  channelGuidance: string;
  toneAdjustment: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  stakeholderGroup: {
    id: string;
    name: string;
    description: string | null;
    defaultSensitivity: string | null;
    defaultChannels: string | null;
    defaultToneGuidance: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}) {
  return {
    id: row.id,
    issueId: row.issueId,
    stakeholderGroupId: row.stakeholderGroupId,
    priority: IssueStakeholderPrioritySchema.parse(row.priority),
    needsToKnow: row.needsToKnow,
    issueRisk: row.issueRisk,
    channelGuidance: row.channelGuidance,
    toneAdjustment: row.toneAdjustment,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    group: {
      id: row.stakeholderGroup.id,
      name: row.stakeholderGroup.name,
      description: row.stakeholderGroup.description,
      defaultSensitivity: row.stakeholderGroup.defaultSensitivity
        ? StakeholderGroupSensitivitySchema.parse(row.stakeholderGroup.defaultSensitivity)
        : null,
      defaultChannels: row.stakeholderGroup.defaultChannels,
      defaultToneGuidance: row.stakeholderGroup.defaultToneGuidance,
      displayOrder: row.stakeholderGroup.displayOrder,
      isActive: row.stakeholderGroup.isActive,
      createdAt: row.stakeholderGroup.createdAt.toISOString(),
      updatedAt: row.stakeholderGroup.updatedAt.toISOString(),
    },
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId } = await params;
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.issueStakeholder.findMany({
    where: { issueId },
    include: { stakeholderGroup: true },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(rows.map(serializeIssueStakeholder));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId } = await params;
  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json();
  const parsed = CreateIssueStakeholderInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const group = await prisma.stakeholderGroup.findUnique({ where: { id: parsed.data.stakeholderGroupId } });
  if (!group) return NextResponse.json({ error: "Stakeholder group not found" }, { status: 404 });

  const created = await prisma.issueStakeholder.create({
    data: {
      issueId,
      stakeholderGroupId: parsed.data.stakeholderGroupId,
      priority: parsed.data.priority ?? "Normal",
      needsToKnow: parsed.data.needsToKnow ?? "",
      issueRisk: parsed.data.issueRisk ?? "",
      channelGuidance: parsed.data.channelGuidance ?? "",
      toneAdjustment: parsed.data.toneAdjustment ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: { stakeholderGroup: true },
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/stakeholders");

  return NextResponse.json(serializeIssueStakeholder(created));
}

