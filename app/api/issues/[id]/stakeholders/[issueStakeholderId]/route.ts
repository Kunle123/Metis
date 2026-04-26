import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireMutation } from "@/lib/governance/requireMutation";
import {
  IssueStakeholderPrioritySchema,
  PatchIssueStakeholderInputSchema,
  StakeholderGroupSensitivitySchema,
} from "@metis/shared/stakeholder";

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string; issueStakeholderId: string }> }) {
  const gate = await requireAuth(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId, issueStakeholderId } = await params;
  const row = await prisma.issueStakeholder.findFirst({
    where: { id: issueStakeholderId, issueId },
    include: { stakeholderGroup: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeIssueStakeholder(row));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; issueStakeholderId: string }> },
) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId, issueStakeholderId } = await params;
  const existing = await prisma.issueStakeholder.findFirst({ where: { id: issueStakeholderId, issueId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json();
  const parsed = PatchIssueStakeholderInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const updated = await prisma.issueStakeholder.update({
    where: { id: issueStakeholderId },
    data: {
      priority: parsed.data.priority ?? undefined,
      needsToKnow: parsed.data.needsToKnow ?? undefined,
      issueRisk: parsed.data.issueRisk ?? undefined,
      channelGuidance: parsed.data.channelGuidance ?? undefined,
      toneAdjustment: parsed.data.toneAdjustment === undefined ? undefined : parsed.data.toneAdjustment,
      notes: parsed.data.notes === undefined ? undefined : parsed.data.notes,
    },
    include: { stakeholderGroup: true },
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/stakeholders");

  return NextResponse.json(serializeIssueStakeholder(updated));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; issueStakeholderId: string }> },
) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId, issueStakeholderId } = await params;

  const existing = await prisma.issueStakeholder.findFirst({ where: { id: issueStakeholderId, issueId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.issueStakeholder.delete({ where: { id: issueStakeholderId } });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/stakeholders");

  return NextResponse.json({ ok: true });
}

