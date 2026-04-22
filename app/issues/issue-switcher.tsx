"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type IssueListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export type IssueSwitcherRouteKind = "brief" | "compare" | "sources" | "gaps" | "input";

function hrefForIssueRoute(issueId: string, routeKind: IssueSwitcherRouteKind) {
  switch (routeKind) {
    case "brief":
      return `/issues/${issueId}/brief?mode=full`;
    case "compare":
      return `/issues/${issueId}/compare?mode=full`;
    case "sources":
      return `/issues/${issueId}/sources`;
    case "gaps":
      return `/issues/${issueId}/gaps`;
    case "input":
      return `/issues/${issueId}/input`;
  }
}

export function IssueSwitcher({
  initialIssueId,
  routeKind,
}: {
  initialIssueId?: string;
  routeKind: IssueSwitcherRouteKind;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<IssueListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!issues) return [];
    const q = query.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter((i) => i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
  }, [issues, query]);

  async function loadIssues() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/issues", { cache: "no-store" });
      const data = (await res.json()) as Array<{ id: string; title: string; updatedAt: string }>;
      setIssues(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(0,0,0,0.14)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Issue context</p>
            <p className="mt-1 text-sm text-[--metis-paper]">{initialIssueId ? `Selected: ${initialIssueId}` : "No issue selected"}</p>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
            onClick={loadIssues}
            disabled={isLoading}
          >
            {issues ? "Refresh list" : isLoading ? "Loading…" : "Load issues"}
          </Button>
        </div>

        {issues ? (
          <>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or id"
              className="h-11 rounded-full border-white/10 bg-white/[0.04] text-[--metis-paper]"
            />
            <div className="max-h-[280px] overflow-auto rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.02)]">
              <div className="divide-y divide-white/8">
                {filtered.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => router.push(hrefForIssueRoute(i.id, routeKind))}
                    className="w-full px-4 py-3 text-left transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[--metis-paper]">{i.title}</p>
                        <p className="mt-1 truncate text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">{i.id}</p>
                      </div>
                      <p className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                        {new Date(i.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

