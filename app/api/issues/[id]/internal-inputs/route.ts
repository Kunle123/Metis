import { NextResponse } from "next/server";

import { CreateInternalInputInputSchema, InternalInputConfidenceSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";

function serializeInternalInput(input: {
  id: string;
  issueId: string;
  role: string;
  name: string;
  response: string;
  confidence: string;
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
  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CreateInternalInputInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const confidenceParsed = InternalInputConfidenceSchema.safeParse(parsed.data.confidence);
  if (!confidenceParsed.success) {
    return NextResponse.json({ error: "Invalid confidence" }, { status: 400 });
  }

  const created = await prisma.internalInput.create({
    data: {
      issueId,
      role: parsed.data.role,
      name: parsed.data.name,
      response: parsed.data.response,
      confidence: confidenceParsed.data,
      linkedSection: parsed.data.linkedSection ?? null,
      visibility: parsed.data.visibility ?? null,
      timestampLabel: parsed.data.timestampLabel ?? null,
    },
  });

  return NextResponse.json(serializeInternalInput(created));
}
