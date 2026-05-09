"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Link2, Lock, PencilLine, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfidencePill, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { formatObservationCode } from "@/lib/issueRecordCodes";
import type { InternalInput } from "@metis/shared/internalInput";

import { InternalInputCreateForm } from "./input-create-form";
import { CollapsibleFormPanel } from "../collapsible-form-panel";

const operatorRules = [
  { icon: Link2, text: "Section link required" },
  { icon: Lock, text: "Visibility set" },
  { icon: PencilLine, text: "Attributable wording" },
] as const;

function clampText(s: string, max = 220) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

const OBS_RECORD_BADGE_CLASS =
  "border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_58%,transparent)] text-[--metis-text-tertiary] font-normal tabular-nums tracking-[0.04em]";

export function InternalInputWorkspace({ issueId, inputs }: { issueId: string; inputs: InternalInput[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [excludedById, setExcludedById] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const i of inputs) init[i.id] = Boolean((i as any).excludedFromBrief);
    return init;
  });

  const excludedCount = useMemo(() => Object.values(excludedById).filter(Boolean).length, [excludedById]);
  const includedCount = useMemo(() => Math.max(0, inputs.length - excludedCount), [excludedCount, inputs.length]);

  async function toggleExcluded(id: string, next: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ excludedFromBrief: next }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const json = (await res.json()) as { excludedFromBrief?: boolean };
      setExcludedById((cur) => ({ ...cur, [id]: Boolean(json.excludedFromBrief) }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="min-w-0 overflow-hidden">
          <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div>
                  <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper] sm:text-[2rem]">Internal observations</h2>
                  <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                    Full list of internal observations. Normal capture happens in the workspace; use this for full-list review and management.
                  </p>
                </div>
              }
              right={
                inputs[0] ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <ConfidencePill level={inputs[0].confidence} />
                    <ReadinessPill state="Updated since last version" />
                  </div>
                ) : (
                  <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                    No observations yet
                  </Badge>
                )
              }
            >
              <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/issues/${issueId}`}>Back to workspace</Link>
                </Button>
              </div>
            </ReviewToolbar>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section aria-label="Observation overview" className="space-y-3">
              <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)] sm:px-5">
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Overview</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                    {inputs.length} total
                  </Badge>
                  <Badge className="border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_52%,transparent)] text-[--metis-status-success-fg]">
                    {includedCount} included in briefs
                  </Badge>
                  <Badge className="border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_52%,transparent)] text-[--metis-status-danger-fg]">
                    {excludedCount} excluded from briefs
                  </Badge>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 py-0 text-[--metis-brass-soft] hover:bg-transparent"
                  >
                    <Link href={`/issues/${issueId}/gaps`} className="underline underline-offset-4">
                      Use observations to resolve open questions
                    </Link>
                  </Button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[--metis-text-tertiary]">
                  Internal observations are attributable internal statements — not external source evidence. Confidence reflects internal readiness, not proof.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[Cormorant_Garamond] text-[1.75rem] leading-none text-[--metis-paper]">Saved observations ({inputs.length})</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                    {includedCount} included
                  </Badge>
                  <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                    {excludedCount} excluded
                  </Badge>
                </div>
              </div>
              {inputs.length === 0 ? (
                <p className="text-sm leading-6 text-[--metis-paper-muted]">No observations yet. Add one below or from the issue workspace.</p>
              ) : (
                <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_72%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
                  {inputs.map((input) => {
                    const expanded = openId === input.id;
                    const response = (input.response ?? "").trim();
                    const responsePreview = clampText(response, 240);
                    const linked = input.linkedSection ?? "—";
                    const visibility = input.visibility ?? "—";
                    const timestamp = input.timestampLabel ?? "—";
                    const isExcluded = Boolean(excludedById[input.id]);

                    return (
                      <div
                        key={input.id}
                        className={["border-t border-[--metis-outline-subtle] px-4 py-3 first:border-t-0 sm:px-5", !expanded ? "hover:bg-[color-mix(in_oklab,var(--metis-surface-elevated)_22%,transparent)]" : ""].join(" ")}
                      >
                        <DenseSection
                          title={
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={OBS_RECORD_BADGE_CLASS}>
                                {formatObservationCode(input.observationNumber) ?? `${input.id.slice(0, 8)}…`}
                              </Badge>
                              <span className="text-sm font-medium text-[--metis-paper]">
                                {input.role} · {input.name}
                              </span>
                            </div>
                          }
                          className="space-y-2 border-t-0 pt-0"
                          titleClassName="text-[0.62rem]"
                        >
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[--metis-paper-muted]">
                                <span className="text-[--metis-text-tertiary]">Timestamp:</span>
                                <span>{timestamp}</span>
                                <span className="text-[--metis-outline-strong]">•</span>
                                <span className="text-[--metis-text-tertiary]">Section:</span>
                                <span>{linked}</span>
                                <span className="text-[--metis-outline-strong]">•</span>
                                <span className="text-[--metis-text-tertiary]">Visibility:</span>
                                <span>{visibility}</span>
                              </div>

                              <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{responsePreview || "—"}</p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Badge
                                className={
                                  isExcluded
                                    ? "border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_52%,transparent)] text-[--metis-status-danger-fg]"
                                    : "border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_52%,transparent)] text-[--metis-status-success-fg]"
                                }
                              >
                                {isExcluded ? "Excluded from briefs" : "Included in briefs"}
                              </Badge>
                              <ConfidencePill level={input.confidence} />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busyId === input.id}
                                onClick={() => void toggleExcluded(input.id, !isExcluded)}
                                title="Excluded notes are kept in the record but omitted from generated briefs."
                              >
                                {isExcluded ? "Include in briefs" : "Exclude from briefs"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenId((cur) => (cur === input.id ? null : input.id))}
                                aria-expanded={expanded}
                                className="h-auto min-h-0 gap-2 hover:no-underline"
                              >
                                {expanded ? "Hide response" : "Full response"}
                                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="pt-1">
                              <CollapsibleSection
                                defaultOpen={true}
                                className="border-[--metis-info-border] bg-[--metis-info-bg] px-4 py-3"
                                summary={
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                                        Response
                                      </p>
                                      <p className="mt-1 text-xs text-[--metis-paper-muted]">Full text as captured.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[--metis-text-tertiary]">
                                      <span className="text-xs">Toggle</span>
                                      <ChevronDown className="h-4 w-4" />
                                    </div>
                                  </div>
                                }
                              >
                                <p className="whitespace-pre-wrap text-sm leading-7 text-[--metis-paper]">{response || "—"}</p>
                              </CollapsibleSection>
                            </div>
                          ) : null}
                        </DenseSection>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="border-t border-[--metis-outline-subtle] pt-8">
              <CollapsibleFormPanel
                title="Add observation"
                description="Creates a saved internal observation record. Use these to resolve open questions and curate brief outputs."
                addLabel="Add observation"
                form={<InternalInputCreateForm issueId={issueId} />}
                secondaryAction={
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/issues/${issueId}`}>Workspace</Link>
                  </Button>
                }
              >
                <div />
              </CollapsibleFormPanel>
              <p className="mt-3 text-xs leading-6 text-[--metis-text-tertiary]">
                Tip: notes capture and AI suggestions may be excluded from briefs by default until you curate them.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard title="Operator rules" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Output hygiene guidance for attributable notes.</p>}>
              <div className="space-y-3 text-sm leading-6 text-[--metis-paper-muted]">
                {operatorRules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-t border-[--metis-outline-subtle] pt-3 first:border-t-0 first:pt-0"
                    >
                      <Icon className="mt-2 h-4 w-4 text-[--metis-brass]" />
                      <p>{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </ReviewRailCard>

            <ReviewRailCard
              title="Current effect"
              tone="info"
              meta={
                <div className="space-y-2">
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    Observations are stored for attribution and can close clarification gaps when explicitly linked.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                      Status
                    </span>
                    <Badge
                      className={[
                        "rounded-lg border border-[--metis-status-info-border] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_52%,transparent)]",
                        "text-[--metis-status-info-fg] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]",
                        "px-2.5 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] whitespace-nowrap",
                      ].join(" ")}
                      title="This issue has new or edited observations compared with the last saved revision."
                    >
                      Updated since last version
                    </Badge>
                  </div>
                </div>
              }
            >
              <div />
            </ReviewRailCard>

            <ReviewRailCard title="Next" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Jump to related registers and outputs.</p>}>
              <div className="grid gap-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}`}>
                    Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/sources`}>
                    Sources
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/brief?mode=full`}>
                    <PlusCircle className="h-4 w-4" />
                    Open brief
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link className="inline-flex items-center justify-center gap-2" href={`/issues/${issueId}/gaps`}>
                    Review clarification gaps
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </ReviewRailCard>
          </div>
        </SurfaceCard>
      </div>
  );
}
