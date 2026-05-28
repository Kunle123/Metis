import { NextResponse } from "next/server";

import { loadIssueHistoryEventDetail } from "@/lib/issues/buildIssueHistoryProjection";
import { issueHistoryPerfStart } from "@/lib/issues/issueHistoryPerf";
import type { IssueHistoryEventCard } from "@/lib/issues/issueHistoryTypes";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const endRoute = issueHistoryPerfStart("GET /api/issues/[id]/history-detail");
  const { id: issueId } = await params;
  const url = new URL(request.url);

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) {
    endRoute();
    return gated;
  }

  const card: Pick<IssueHistoryEventCard, "id" | "linkedRecordType" | "linkedRecordId" | "modalType"> = {
    id: url.searchParams.get("eventId") ?? "",
    linkedRecordType: url.searchParams.get("linkedRecordType") ?? "",
    linkedRecordId: url.searchParams.get("linkedRecordId") ?? "",
    modalType: url.searchParams.get("modalType") ?? "",
  };

  if (!card.linkedRecordType || !card.linkedRecordId || !card.modalType) {
    endRoute();
    return NextResponse.json({ error: "Missing card identifiers" }, { status: 400 });
  }

  const modal = await loadIssueHistoryEventDetail(issueId, card, {
    membershipRole: gated.ctx.membership.role,
    userId: gated.ctx.user.id,
  });

  endRoute();
  return NextResponse.json({ modal });
}
