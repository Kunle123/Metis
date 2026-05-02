"use client";

import { useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activityDisplayRefType,
  activityDisplaySummary,
  activityKindLabel,
  activitySearchBlob,
  formatActivityTimestamp,
  shortActivityRefId,
  type SerializedActivityRow,
} from "@/lib/issues/activityTimelineDisplay";

const SELECT_CLASS =
  "h-[var(--metis-control-height-md)] min-w-0 flex-1 sm:min-w-[11rem] sm:flex-none max-w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 disabled:opacity-50";

type Props = { items: SerializedActivityRow[] };

export function ActivityTimelineClient({ items }: Props) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [actor, setActor] = useState("");

  const kindOptions = useMemo(() => {
    const uniq = [...new Set(items.map((i) => i.kind))];
    uniq.sort((a, b) => activityKindLabel(a).localeCompare(activityKindLabel(b)));
    return uniq;
  }, [items]);

  const actorOptions = useMemo(() => {
    const labels = items.map((i) => i.actorLabel).filter((l): l is string => Boolean(l?.trim()));
    const uniq = [...new Set(labels.map((l) => l.trim()))];
    uniq.sort((a, b) => a.localeCompare(b));
    return uniq;
  }, [items]);

  const qNorm = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return items.filter((row) => {
      if (kind && row.kind !== kind) return false;
      if (actor && (row.actorLabel ?? "").trim() !== actor) return false;
      if (!qNorm) return true;
      return activitySearchBlob(row).includes(qNorm);
    });
  }, [items, kind, actor, qNorm]);

  const hasFilters = Boolean(qNorm || kind || actor);

  const reset = () => {
    setQuery("");
    setKind("");
    setActor("");
  };

  if (items.length === 0) {
    return (
      <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-5 text-sm leading-7 text-[--metis-paper-muted]">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.03)] p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="relative min-w-[min(100%,16rem)] flex-1 lg:max-w-xl">
          <label htmlFor="activity-timeline-search" className="sr-only">
            Search activity timeline
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--metis-paper-muted]"
            aria-hidden
          />
          <Input
            id="activity-timeline-search"
            type="search"
            autoComplete="off"
            placeholder="Search summary, type, actor, references…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="activity-timeline-type" className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
              Type
            </label>
            <select
              id="activity-timeline-type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className={SELECT_CLASS}
              aria-label="Filter by activity type"
            >
              <option value="">All types</option>
              {kindOptions.map((k) => (
                <option key={k} value={k}>
                  {activityKindLabel(k)}
                </option>
              ))}
            </select>
          </div>
          {actorOptions.length > 0 ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="activity-timeline-actor" className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                Actor
              </label>
              <select
                id="activity-timeline-actor"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className={SELECT_CLASS}
                aria-label="Filter by actor"
              >
                <option value="">All actors</option>
                {actorOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-md"
            onClick={reset}
            disabled={!hasFilters}
            aria-disabled={!hasFilters}
          >
            <RotateCcw className="mr-2 h-[var(--metis-icon-size-sm)] w-[var(--metis-icon-size-sm)]" aria-hidden />
            Clear
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-5 text-sm leading-7 text-[--metis-paper-muted]">
          <p className="font-medium text-[--metis-paper]">No matching activity</p>
          <p className="mt-2">
            Nothing in this timeline matches your search or filters. This timeline only shows key briefing actions — it is not a full edit history.
            Adjust filters or{" "}
            <button type="button" className="text-[--metis-brass-soft] underline underline-offset-2 hover:opacity-90" onClick={reset}>
              clear filters
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                  {activityKindLabel(a.kind)}
                </p>
                <p className="shrink-0 text-[0.68rem] tabular-nums text-[--metis-ink-soft]" title={a.createdAt}>
                  {formatActivityTimestamp(a.createdAt)}
                </p>
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-[--metis-paper]">{activityDisplaySummary(a.kind, a.summary)}</p>
              {a.actorLabel ? (
                <p className="mt-1.5 text-xs leading-5 text-[--metis-paper-muted]">
                  <span className="text-[--metis-ink-soft]">Actor</span>
                  {" · "}
                  {a.actorLabel}
                </p>
              ) : null}
              {a.refType || a.refId ? (
                <p className="mt-1 text-xs leading-5 text-[--metis-paper-muted]">
                  {a.refType ? (
                    <span className="font-mono text-[0.7rem] text-[rgba(176,171,160,0.85)]">{activityDisplayRefType(a.refType)}</span>
                  ) : (
                    <span className="font-mono text-[0.7rem] text-[rgba(176,171,160,0.85)]">Ref</span>
                  )}
                  {a.refId ? (
                    <>
                      {" · "}
                      <span className="font-mono text-[0.7rem]">{shortActivityRefId(a.refId)}</span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
