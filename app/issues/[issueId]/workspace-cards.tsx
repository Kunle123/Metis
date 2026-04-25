"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";

type GapCardData = {
  id: string;
  prompt: string;
  whyItMatters: string | null;
  status: string | null;
  severity: string | null;
  stakeholder: string | null;
  section: string | null;
  createdAt: string;
};

type SourceCardData = {
  id: string;
  title: string | null;
  note: string | null;
  snippet: string | null;
  url: string | null;
  tier: string | null;
  section: string | null;
  reliability: string | null;
  observedAt: string | null;
  createdAt: string;
};

type ObservationCardData = {
  id: string;
  note: string;
  createdAt: string;
};

function clampText(s: string, max = 160) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function metaParts(parts: Array<string | null | undefined>) {
  return parts.filter((p) => (p ?? "").trim().length > 0) as string[];
}

function MetaLine({ parts }: { parts: Array<string | null | undefined> }) {
  const text = metaParts(parts).join(" · ");
  if (!text) return null;
  return <p className="text-xs text-white/50">{text}</p>;
}

function ActionButton({
  onClick,
  children,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ActionLink({
  href,
  children,
  target,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function CardShell({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-white/[0.04]"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2 text-white/40">
          <span className="text-xs">{expanded ? "Hide" : "View details"}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
    </div>
  );
}

export function WorkspaceGapCards({
  issueId,
  gaps,
}: {
  issueId: string;
  gaps: GapCardData[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {gaps.map((g) => {
        const expanded = openId === g.id;
        const preview = clampText(g.prompt, 140);

        return (
          <div key={g.id}>
            <CardShell
              expanded={expanded}
              onToggle={() => setOpenId((cur) => (cur === g.id ? null : g.id))}
            >
              <p className="text-sm font-medium text-white/90">{preview}</p>
              <div className="mt-1">
                <MetaLine
                  parts={[
                    g.status ? `Status: ${g.status}` : null,
                    g.severity ? `Severity: ${g.severity}` : null,
                    g.section ? `Section: ${g.section}` : null,
                    g.stakeholder ? `Stakeholder: ${g.stakeholder}` : null,
                  ]}
                />
              </div>

              {expanded ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-xs text-white/50">Question</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{g.prompt}</p>
                  </div>

                  {g.whyItMatters ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Why it matters</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                        {g.whyItMatters}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(g.prompt);
                        } catch {
                          // best-effort
                        }
                      }}
                    >
                      <Copy size={14} />
                      Copy question
                    </ActionButton>
                    <ActionLink href={`/issues/${issueId}/gaps#${g.id}`}>
                      Advanced view
                    </ActionLink>
                  </div>
                </div>
              ) : null}
            </CardShell>
          </div>
        );
      })}
    </div>
  );
}

export function WorkspaceSourceCards({
  issueId,
  sources,
}: {
  issueId: string;
  sources: SourceCardData[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, SourceCardData>();
    for (const s of sources) m.set(s.id, s);
    return m;
  }, [sources]);

  return (
    <div className="space-y-3">
      {sources.map((s) => {
        const expanded = openId === s.id;
        const title = (s.title ?? "").trim() || "Source";
        const notePreview = clampText(s.note ?? s.snippet ?? "", 160);
        const fullNote = (s.note ?? "").trim();
        const fullSnippet = (s.snippet ?? "").trim();

        return (
          <div key={s.id}>
            <CardShell
              expanded={expanded}
              onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
            >
              <p className="text-sm font-medium text-white/90">{title}</p>
              <div className="mt-1">
                <MetaLine
                  parts={[
                    s.tier ? `Tier: ${s.tier}` : null,
                    s.section ? `Section: ${s.section}` : null,
                    s.reliability ? `Reliability: ${s.reliability}` : null,
                    s.observedAt ? `Observed: ${new Date(s.observedAt).toLocaleString()}` : null,
                  ]}
                />
              </div>
              {notePreview ? (
                <p className="mt-2 text-sm text-white/75">{notePreview}</p>
              ) : (
                <p className="mt-2 text-sm text-white/50">No note recorded.</p>
              )}

              {expanded ? (
                <div className="mt-3 space-y-3">
                  {fullNote ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Note</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{fullNote}</p>
                    </div>
                  ) : null}

                  {fullSnippet ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Snippet</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{fullSnippet}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {s.url ? (
                      <ActionLink href={s.url} target="_blank">
                        <ExternalLink size={14} />
                        Open link
                      </ActionLink>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                        No link available
                      </span>
                    )}
                    <ActionLink href={`/issues/${issueId}/sources`}>Advanced view</ActionLink>
                  </div>
                </div>
              ) : null}
            </CardShell>
          </div>
        );
      })}
      {/* avoid unused var warning if tooling changes; keeping byId for easy future lookup */}
      {byId.size === -1 ? null : null}
    </div>
  );
}

export function WorkspaceObservationCards({ observations }: { observations: ObservationCardData[] }) {
  return (
    <div className="space-y-3">
      {observations.map((o) => (
        <div
          key={o.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <p className="whitespace-pre-wrap text-sm text-white/85">{o.note}</p>
          <p className="mt-2 text-xs text-white/45">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

