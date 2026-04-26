import Link from "next/link";
import { ArrowRight, Link2, Lock, PencilLine, PlusCircle } from "lucide-react";

import { ConfidencePill, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InternalInput } from "@metis/shared/internalInput";

import { InternalInputCreateForm } from "./input-create-form";
import { CollapsibleFormPanel } from "../collapsible-form-panel";

const operatorRules = [
  { icon: Link2, text: "Section link required" },
  { icon: Lock, text: "Visibility set" },
  { icon: PencilLine, text: "Attributable wording" },
] as const;

export function InternalInputWorkspace({ issueId, inputs }: { issueId: string; inputs: InternalInput[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard>
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper] sm:text-[2rem]">Attributable records</h2>
                <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                  Full list of internal observations. Normal capture happens in the workspace; use this for full-list review and management.
                </p>
              </div>
              {inputs[0] ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidencePill level={inputs[0].confidence} />
                  <ReadinessPill state="Updated since last version" />
                </div>
              ) : (
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">No observations yet</Badge>
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
              >
                <Link href={`/issues/${issueId}`}>Back to workspace</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[Cormorant_Garamond] text-[1.75rem] leading-none text-[--metis-paper]">Observations</h3>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{inputs.length} records</Badge>
              </div>
              {inputs.length === 0 ? (
                <p className="text-sm leading-6 text-[--metis-paper-muted]">No observations yet. Add one below or from the issue workspace.</p>
              ) : (
                <div className="space-y-3">
                  {inputs.map((input) => (
                    <article key={input.id} className="rounded-[1.15rem] border border-white/8 bg-[rgba(255,255,255,0.035)] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{input.id}</Badge>
                            <h4 className="text-sm font-medium text-[--metis-paper]">
                              {input.role} · {input.name}
                            </h4>
                          </div>
                          <p className="mt-2 text-[0.72rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                            {input.timestampLabel ?? "—"} · {input.linkedSection ?? "—"} · {input.visibility ?? "—"}
                          </p>
                        </div>
                        <ConfidencePill level={input.confidence} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[--metis-paper-muted]">{input.response}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="border-t border-white/8 pt-8">
              <CollapsibleFormPanel
                title="Add observation"
                description="For bulk or secondary capture. Prefer the workspace for routine attributable notes."
                addLabel="Add observation"
                form={<InternalInputCreateForm issueId={issueId} />}
                secondaryAction={
                  <Button asChild variant="outline" className="h-10 rounded-full px-4">
                    <Link href={`/issues/${issueId}`}>Workspace</Link>
                  </Button>
                }
              >
                <div />
              </CollapsibleFormPanel>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface">
          <div className="divide-y divide-white/8">
            <div className="px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="space-y-4 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.18)] px-4 py-4">
                {operatorRules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <Icon className="mt-2 h-4 w-4 text-[--metis-brass]" />
                      <p>{item.text}</p>
                    </div>
                  );
                })}
                <div className="space-y-3 border-t border-white/8 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Current effect</span>
                    <ReadinessPill state="Updated since last version" />
                  </div>
                  <p>Observations are stored for attribution and can close clarification gaps when explicitly linked.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issueId}/brief?mode=full`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issueId}/gaps`}>
                  Review clarification gaps
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
  );
}
