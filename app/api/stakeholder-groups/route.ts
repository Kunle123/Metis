import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireMutation } from "@/lib/governance/requireMutation";
import { CreateStakeholderGroupInputSchema, StakeholderGroupSensitivitySchema } from "@metis/shared/stakeholder";

function serializeGroup(g: {
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
}) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    defaultSensitivity: g.defaultSensitivity ? StakeholderGroupSensitivitySchema.parse(g.defaultSensitivity) : null,
    defaultChannels: g.defaultChannels,
    defaultToneGuidance: g.defaultToneGuidance,
    displayOrder: g.displayOrder,
    isActive: g.isActive,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const gate = await requireAuth(request);
  if (gate instanceof NextResponse) return gate;

  const groups = await prisma.stakeholderGroup.findMany({
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(groups.map(serializeGroup));
}

export async function POST(request: Request) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const json = await request.json();
  const parsed = CreateStakeholderGroupInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const nameTrimmed = parsed.data.name.trim();
  if (!nameTrimmed.length) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const created = await prisma.stakeholderGroup.create({
    data: {
      name: nameTrimmed,
      description: parsed.data.description ?? null,
      defaultSensitivity: parsed.data.defaultSensitivity ?? null,
      defaultChannels: parsed.data.defaultChannels ?? null,
      defaultToneGuidance: parsed.data.defaultToneGuidance ?? null,
      displayOrder: parsed.data.displayOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/");
  revalidatePath("/stakeholders");

  return NextResponse.json(serializeGroup(created));
}

