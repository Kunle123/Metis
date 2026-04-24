import Link from "next/link";
import { ArrowRight, Paperclip } from "lucide-react";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setupPlaceholderAttachments, setupPlaceholderTemplate } from "./setup-templates";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  return (
    <MetisShell activePath="/setup" pageTitle="New issue">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[1.9rem] leading-none text-[--metis-paper]">Issue record</h2>
              <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Draft</Badge>
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="grid gap-6 border-t border-white/8 pt-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-5">
                <SetupForm />
              </div>

              <div className="metis-surface metis-support-surface space-y-4 rounded-[1.45rem] border px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="space-y-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Attachments</p>
                  {setupPlaceholderAttachments.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-[--metis-paper-muted]">
                      <Paperclip className="h-4 w-4 shrink-0 text-[--metis-brass]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/8 pt-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Template</p>
                  <div className="mt-3 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.18)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[--metis-paper]">{setupPlaceholderTemplate.name}</span>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{setupPlaceholderTemplate.estimatedSetup}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{setupPlaceholderTemplate.issueType}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Next step</span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Create issue</Badge>
              </div>
              <p className="mt-3">
                After creating the issue, add sources, clarification gaps, and internal input to strengthen the brief.
              </p>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/brief">
                  Open brief
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button disabled variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] opacity-60">
                Save draft (placeholder)
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

