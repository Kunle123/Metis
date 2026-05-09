import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireActiveOrganisationContext } from "@/lib/organisations/activeOrganisationContext";
import { requireActiveOrganisationWriteContext } from "@/lib/organisations/requireOrganisationCapability";
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
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const groups = await prisma.stakeholderGroup.findMany({
    where: { organisationId: ctx.organisation.id },
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(groups.map(serializeGroup));
}

export async function POST(request: Request) {
  const ctx = await requireActiveOrganisationWriteContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const json = await request.json();
  const parsed = CreateStakeholderGroupInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const nameTrimmed = parsed.data.name.trim();
  if (!nameTrimmed.length) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const created = await prisma.stakeholderGroup.create({
    data: {
      organisationId: ctx.organisation.id,
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
  revalidatePath("/audience-groups");

  return NextResponse.json(serializeGroup(created));
}

