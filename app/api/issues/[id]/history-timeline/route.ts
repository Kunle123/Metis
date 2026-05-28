import { NextResponse } from "next/server";

import { buildIssueHistoryTimeline } from "@/lib/issues/buildIssueHistoryProjection";
import { issueHistoryPerfLog, issueHistoryPerfStart } from "@/lib/issues/issueHistoryPerf";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const endRoute = issueHistoryPerfStart("GET /api/issues/[id]/history-timeline");
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) {
    endRoute();
    return gated;
  }

  const payload = await buildIssueHistoryTimeline(issueId, {
    membershipRole: gated.ctx.membership.role,
    userId: gated.ctx.user.id,
  });

  issueHistoryPerfLog("history-timeline response", {
    eventCount: payload.events.length,
    approxBytes: JSON.stringify(payload).length,
  });

  endRoute();
  return NextResponse.json(payload);
}
