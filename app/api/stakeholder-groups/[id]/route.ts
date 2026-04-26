import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireMutation } from "@/lib/governance/requireMutation";
import { PatchStakeholderGroupInputSchema, StakeholderGroupSensitivitySchema } from "@metis/shared/stakeholder";

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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth(request);
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const group = await prisma.stakeholderGroup.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeGroup(group));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const existing = await prisma.stakeholderGroup.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json();
  const parsed = PatchStakeholderGroupInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const name = parsed.data.name?.trim();
  if (parsed.data.name !== undefined && (!name || !name.length)) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const updated = await prisma.stakeholderGroup.update({
    where: { id },
    data: {
      name: parsed.data.name === undefined ? undefined : name!,
      description: parsed.data.description === undefined ? undefined : parsed.data.description,
      defaultSensitivity: parsed.data.defaultSensitivity === undefined ? undefined : parsed.data.defaultSensitivity,
      defaultChannels: parsed.data.defaultChannels === undefined ? undefined : parsed.data.defaultChannels,
      defaultToneGuidance: parsed.data.defaultToneGuidance === undefined ? undefined : parsed.data.defaultToneGuidance,
      displayOrder: parsed.data.displayOrder === undefined ? undefined : parsed.data.displayOrder,
      isActive: parsed.data.isActive === undefined ? undefined : parsed.data.isActive,
    },
  });

  revalidatePath("/");
  revalidatePath("/stakeholders");

  return NextResponse.json(serializeGroup(updated));
}

