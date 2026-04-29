import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { CreateInternalInputInputSchema, InternalInputConfidenceSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";

function serializeInternalInput(input: {
  id: string;
  issueId: string;
  role: string;
  name: string;
  response: string;
  confidence: string;
  excludedFromBrief: boolean;
  linkedSection: string | null;
  visibility: string | null;
  timestampLabel: string | null;
  createdAt: Date;
}) {
  return {
    id: input.id,
    issueId: input.issueId,
    role: input.role,
    name: input.name,
    response: input.response,
    confidence: InternalInputConfidenceSchema.parse(input.confidence),
    excludedFromBrief: input.excludedFromBrief,
    linkedSection: input.linkedSection,
    visibility: input.visibility,
    timestampLabel: input.timestampLabel,
    createdAt: input.createdAt.toISOString(),
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inputs = await prisma.internalInput.findMany({
    where: { issueId },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(inputs.map((i) => serializeInternalInput(i)));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId } = await params;
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

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const confidenceParsed = InternalInputConfidenceSchema.safeParse(parsed.data.confidence);
  if (!confidenceParsed.success) {
    return NextResponse.json({ error: "Invalid confidence" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const input = await tx.internalInput.create({
      data: {
        issueId,
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
      actorLabel: user.email ?? null,
    });

    return input;
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);

  return NextResponse.json(serializeInternalInput(created));
}
