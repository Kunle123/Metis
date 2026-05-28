"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { IssueHistoryTimelinePayload } from "@/lib/issues/issueHistoryTypes";

import { IssueHistorySkeleton } from "./IssueHistorySkeleton";
import { IssueHistoryTimeline } from "./IssueHistoryTimeline.client";

import "./issue-history-timeline.css";

type Props = {
  issueId: string;
  issueTitle: string;
  controlledPositionHeadline: string;
  controlledPositionDetail: string;
};

export function IssueHistoryPageClient({
  issueId,
  issueTitle,
  controlledPositionHeadline,
  controlledPositionDetail,
}: Props) {
  const [payload, setPayload] = useState<IssueHistoryTimelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/history-timeline`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : `Failed to load history (${res.status})`);
      }
      const data = (await res.json()) as IssueHistoryTimelinePayload;
      setPayload(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    }
  }, [issueId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div
        className="rounded-[1.1rem] border border-[--metis-outline-subtle] px-6 py-12 text-center"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <p className="text-sm text-[--metis-paper-muted]">{error}</p>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-[--metis-brass] underline"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!payload) {
    return <IssueHistorySkeleton />;
  }

  return (
    <>
      {payload.truncation.capped ? (
        <div
          className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-4 py-2 text-sm"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <span className="text-[--metis-paper-muted]">
            Showing latest {payload.truncation.showingEvents} of {payload.truncation.totalEvents} events on the
            timeline.
          </span>
          <Link href={`/issues/${issueId}/activity`} className="font-medium text-[--metis-brass] hover:underline">
            View full Activity log →
          </Link>
        </div>
      ) : null}
      <IssueHistoryTimeline
        issueId={issueId}
        issueTitle={payload.issueTitle || issueTitle}
        controlledPositionHeadline={payload.controlledPositionHeadline || controlledPositionHeadline}
        controlledPositionDetail={payload.controlledPositionDetail || controlledPositionDetail}
        events={payload.events}
      />
    </>
  );
}
