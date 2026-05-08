import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { PatchInternalInputInputSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";
import { requireMutation } from "@/lib/governance/requireMutation";
import { internalInputDbRowToWire } from "@/lib/internalInputs/internalInputWireFormat";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; internalInputId: string }> }) {
  const { id: issueId, internalInputId } = await params;

  const input = await prisma.internalInput.findFirst({
    where: { id: internalInputId, issueId },
  });

  if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wired = internalInputDbRowToWire(input);
  if (!wired) {
    return NextResponse.json({ error: "Malformed internal input record", id: input.id }, { status: 422 });
  }

  return NextResponse.json(wired);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; internalInputId: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId, internalInputId } = await params;
  const json = await request.json();
  const parsed = PatchInternalInputInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const input = await prisma.internalInput.findFirst({
    where: { id: internalInputId, issueId },
  });
  if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.internalInput.update({
    where: { id: internalInputId },
    data: {
      excludedFromBrief: parsed.data.excludedFromBrief ?? input.excludedFromBrief,
    },
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/input`);
  revalidatePath(`/issues/${issueId}/brief`);

  const wired = internalInputDbRowToWire(updated);
  if (!wired) {
    return NextResponse.json({ error: "Malformed internal input record", id: updated.id }, { status: 422 });
  }

  return NextResponse.json(wired);
}
