import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { CreateInternalInputInputSchema, InternalInputConfidenceSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { isMutationRole } from "@/lib/auth/session";
import { internalInputDbRowToWire } from "@/lib/internalInputs/internalInputWireFormat";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  const inputs = await prisma.internalInput.findMany({
    where: { issueId },
    orderBy: [{ createdAt: "desc" }],
  });

  const wired = inputs.map((i) => internalInputDbRowToWire(i)).filter((row): row is NonNullable<typeof row> => row !== null);

  return NextResponse.json(wired);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!isMutationRole(gated.ctx.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await request.json();
  const parsed = CreateInternalInputInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const roleTrimmed = parsed.data.role.trim();
  const nameTrimmed = parsed.data.name.trim();
  const responseTrimmed = parsed.data.response.trim();

  if (!roleTrimmed.length || !nameTrimmed.length || !responseTrimmed.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const confidenceParsed = InternalInputConfidenceSchema.safeParse(parsed.data.confidence);
  if (!confidenceParsed.success) {
    return NextResponse.json({ error: "Invalid confidence" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const issueRow = await tx.issue.update({
      where: { id: issueId },
      data: { observationCodeSeq: { increment: 1 } },
      select: { observationCodeSeq: true },
    });
    const observationNumber = issueRow.observationCodeSeq;

    const input = await tx.internalInput.create({
      data: {
        issueId,
        observationNumber,
        role: roleTrimmed,
        name: nameTrimmed,
        response: responseTrimmed,
        confidence: confidenceParsed.data,
        excludedFromBrief: parsed.data.excludedFromBrief ?? false,
        linkedSection: parsed.data.linkedSection ?? null,
        visibility: parsed.data.visibility ?? null,
        timestampLabel: parsed.data.timestampLabel ?? null,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.internal_input_created,
      summary: "Internal input created",
      refType: "InternalInput",
      refId: input.id,
      actorLabel: gated.ctx.user.email ?? null,
    });

    return input;
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);

  const wired = internalInputDbRowToWire(created);
  if (!wired) {
    return NextResponse.json({ error: "Internal serialization failed", id: created.id }, { status: 500 });
  }

  return NextResponse.json(wired);
}
