/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Setup is intake support for the brief.
 * Keep one dominant intake surface, low narration, and only compact support.
 */
import { Link } from "wouter";
import { ArrowRight, Paperclip } from "lucide-react";
import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { setupFields, templateCards } from "@/lib/metis-data";

const coreFields = [
  { label: "Issue title", value: setupFields.title, type: "input" },
  { label: "Issue type", value: setupFields.issueType, type: "input" },
  { label: "Audience", value: setupFields.audience, type: "input" },
  { label: "Urgency", value: setupFields.urgency, type: "input" },
  { label: "Working line", value: setupFields.description, type: "textarea" },
] as const;

const evidenceFields = [
  { label: "Confirmed facts", value: setupFields.knownFacts, state: "Ready to circulate" as const },
  { label: "Open questions", value: setupFields.uncertainties, state: "Needs validation" as const },
] as const;

const supportingMaterial = [
  "Incident bridge summary — 07:10 CET",
  "Regional regulator guidance note",
  "Customer support volume export",
  "Prior board resilience note",
];

export default function Setup() {
  return (
    <MetisShell activePath="/setup" pageTitle="Issue Intake" readinessState="Ready for review">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[1.9rem] leading-none text-[--metis-paper]">Intake record</h2>
              <ReadinessPill state="Ready for review" />
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">
                {coreFields.map((field) => (
                  <div key={field.label} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                    <label className="mb-3 block text-sm font-medium text-[--metis-paper]">{field.label}</label>
                    {field.type === "textarea" ? (
                      <Textarea
                        readOnly
                        value={field.value}
                        className="min-h-[148px] rounded-[1.25rem] border-white/12 bg-[rgba(255,255,255,0.065)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
                      />
                    ) : (
                      <Input
                        readOnly
                        value={field.value}
                        className="h-12 rounded-[1.15rem] border-white/12 bg-[rgba(255,255,255,0.065)] text-[--metis-paper]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 border-t border-white/8 pt-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-5">
                {evidenceFields.map((field) => (
                  <div key={field.label} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">{field.label}</p>
                      <ReadinessPill state={field.state} />
                    </div>
                    <Textarea
                      readOnly
                      value={field.value}
                      className="min-h-[172px] rounded-[1.2rem] border-white/12 bg-[rgba(255,255,255,0.055)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
                    />
                  </div>
                ))}

                <div className="space-y-3 border-t border-white/8 pt-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Context</p>
                  <Textarea
                    readOnly
                    value={setupFields.context}
                    className="min-h-[154px] rounded-[1.2rem] border-white/12 bg-[rgba(255,255,255,0.055)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
                  />
                </div>
              </div>

              <div className="metis-surface metis-support-surface space-y-4 rounded-[1.45rem] border px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="space-y-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Attachments</p>
                  {supportingMaterial.map((item) => (
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
                      <span className="text-sm font-medium text-[--metis-paper]">{templateCards[0].name}</span>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{templateCards[0].estimatedSetup}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{templateCards[0].issueType}</p>
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
                <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Readiness</span>
                <ReadinessPill state="Ready for review" />
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/brief">
Open brief
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                Save draft
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
