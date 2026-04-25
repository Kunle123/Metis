import { NextResponse } from "next/server";
import { z } from "zod";

import { StructureSetupError, StructureSetupResponseSchema, callStructureSetupModel } from "@/lib/ai/structureSetupNotes";
import { requireMutation } from "@/lib/governance/requireMutation";

const BodySchema = z.object({
  rawNotes: z.string().max(32_000),
});

export async function POST(request: Request) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawNotes = parsed.data.rawNotes.trim();
  if (!rawNotes.length) {
    return NextResponse.json({ error: "Notes cannot be empty." }, { status: 400 });
  }

  try {
    const out = await callStructureSetupModel(rawNotes);
    const validated = StructureSetupResponseSchema.safeParse(out);
    if (!validated.success) {
      return NextResponse.json({ error: "Could not validate suggestions." }, { status: 502 });
    }
    return NextResponse.json(validated.data);
  } catch (e) {
    if (e instanceof StructureSetupError) {
      if (e.code === "invalid_input") {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
      if (e.code === "unavailable") {
        return NextResponse.json({ error: e.message }, { status: 503 });
      }
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
