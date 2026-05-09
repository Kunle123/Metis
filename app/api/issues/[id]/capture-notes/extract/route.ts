import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { callExtractIssueNotesModel, ExtractIssueNotesError, MAX_CAPTURE_NOTES_CHARS, MIN_CAPTURE_NOTES_CHARS } from "@/lib/ai/extractIssueNotes";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";

const BodySchema = z.object({
  rawNotes: z.string().max(MAX_CAPTURE_NOTES_CHARS),
  meetingLabel: z.string().max(500).nullable().optional(),
});

function notesAiEnabled(): boolean {
  return process.env.NOTES_CAPTURE_AI_ENABLED?.trim() === "true";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!notesAiEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", issues: parsed.error.issues }, { status: 400 });
  }

  const rawNotes = parsed.data.rawNotes.trim();
  if (!rawNotes.length) {
    return NextResponse.json({ error: "Notes cannot be empty." }, { status: 400 });
  }
  if (rawNotes.length < MIN_CAPTURE_NOTES_CHARS) {
    return NextResponse.json(
      { error: `Notes must be at least ${MIN_CAPTURE_NOTES_CHARS} characters.` },
      { status: 400 },
    );
  }

  const issue = gated.issue;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json({ error: "AI assist is not configured." }, { status: 503 });
  }

  const meetingLabel =
    typeof parsed.data.meetingLabel === "string" && parsed.data.meetingLabel.trim().length
      ? parsed.data.meetingLabel.trim()
      : null;

  try {
    const out = await callExtractIssueNotesModel(rawNotes, meetingLabel, {
      issueTitle: issue.title,
      issueSummary: issue.summary,
    });
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof ExtractIssueNotesError) {
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
