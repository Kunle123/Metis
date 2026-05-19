import { NextResponse } from "next/server";

import { isIssueWritable } from "@/lib/issues/issueLifecycle";

import { requireActiveOrgIssue } from "./requireActiveOrgIssue";

/** Active org issue that accepts register mutations (not archived or deleted). */
export async function requireWritableOrgIssue(request: Request, issueId: string) {
  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  if (!isIssueWritable(gated.issue)) {
    return NextResponse.json(
      { error: "This issue is archived. Reopen it before adding or changing record material." },
      { status: 403 },
    );
  }

  return gated;
}
