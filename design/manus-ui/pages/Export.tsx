/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Export is circulation packaging for the briefing artifact.
 * Keep one dominant packaging surface and one compact preview rail.
 */
import { Link } from "wouter";
import { CheckCircle2, Copy, Download, Eye, FileText, Mail, RefreshCcw } from "lucide-react";
import { MetisShell, ReadinessPill, SectionEyebrow, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportFormats } from "@/lib/metis-data";

const packageOptions = [
  {
    id: "full-issue-brief",
    label: "Full issue brief",
    state: "Ready for review" as const,
    audience: "Corporate Affairs, Legal, COO staff",
    description: "Chronology, evidence, appendix",
  },
  {
    id: "executive-brief",
    label: "Executive brief",
    state: "Ready for review" as const,
    audience: "CEO, COO, GC",
    description: "Internal",
  },
  {
    id: "board-note",
    label: "Board-note summary",
    state: "Needs validation" as const,
    audience: "Board chair, company secretary",
    description: "Hold pending exposure wording",
  },
];

const packageContents = [
  { label: "Executive summary", included: true },
  { label: "Chronology", included: true },
  { label: "Confirmed vs unclear", included: true },
  { label: "Recommended actions", included: true },
  { label: "Source appendix", included: true },
  { label: "Confidence labels", included: false },
];

const circulationChecks = [
  {
    label: "Executive brief",
    state: "Ready for review" as const,
    detail: "Internal only",
  },
  {
    label: "Full issue brief",
    state: "Ready for review" as const,
    detail: "Available",
  },
  {
    label: "Board-note summary",
    state: "Needs validation" as const,
    detail: "Hold on threshold wording",
  },
  {
    label: "Email-ready summary",
    state: "Ready to circulate" as const,
    detail: "Ready for send",
  },
];

const selectedFormat = exportFormats.find((format) => format.id === "executive-brief") ?? exportFormats[1];

export default function ExportPage() {
  return (
    <MetisShell activePath="/export" pageTitle="Circulation Package" readinessState="Ready for review">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Package selection</h2>
              <div className="flex flex-wrap items-center gap-2">
                <ReadinessPill state="Ready for review" />
                <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{selectedFormat.label}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="space-y-4">

              <div className="space-y-4">
                {packageOptions.map((item) => {
                  const isSelected = item.id === "executive-brief";
                  return (
                    <div
                      key={item.id}
                      className={`rounded-[1.35rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                        isSelected
                          ? "border-[rgba(224,183,111,0.32)] bg-[linear-gradient(180deg,rgba(224,183,111,0.16),rgba(255,255,255,0.045))]"
                          : "border-white/10 bg-[rgba(255,255,255,0.055)]"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-medium text-[--metis-paper]">{item.label}</h4>
                            {isSelected ? <Badge className="border-0 bg-[--metis-brass]/15 text-[--metis-brass-soft]">Selected</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{item.description}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2 lg:items-end">
                          <ReadinessPill state={item.state} />
                          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">{item.audience}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4 border-t border-white/8 pt-8">
              <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.7)]">Package contents</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {packageContents.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3">
                    <span className="text-sm text-[--metis-paper]">{item.label}</span>
                    <Badge className={`border-0 ${item.included ? "bg-[rgba(18,84,58,0.62)] text-emerald-50" : "bg-white/8 text-[--metis-paper-muted]"}`}>
                      {item.included ? "Included" : "Hidden"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 border-t border-white/8 pt-8 sm:grid-cols-3">
              <Button className="justify-start rounded-[1rem] bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Download className="mr-2 h-4 w-4" />
                Export file
              </Button>
              <Button variant="outline" className="justify-start rounded-[1rem] border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Copy className="mr-2 h-4 w-4 text-[--metis-brass]" />
                Copy executive text
              </Button>
              <Button variant="outline" className="justify-start rounded-[1rem] border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Mail className="mr-2 h-4 w-4 text-[--metis-brass]" />
                Email-ready package
              </Button>
            </section>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="space-y-3 px-5 py-5">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Preview</p>
              <div className="rounded-[1.6rem] border border-[--metis-brass]/20 bg-[linear-gradient(180deg,rgba(255,251,242,0.98),rgba(250,246,237,0.96))] p-5 text-[--metis-dark] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between gap-4 border-b border-[rgba(36,31,23,0.08)] pb-4">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(36,31,23,0.5)]">Executive brief</p>
                    <h3 className="mt-2 font-[Cormorant_Garamond] text-3xl">European customer portal outage following security containment</h3>
                  </div>
                  <FileText className="h-5 w-5 text-[--metis-brass]" />
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7">
                  <p>Confirmed disruption. Unauthorized access unconfirmed.</p>
                  <p>Internal circulation.</p>
                  <p>Board note held pending exposure validation.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[rgba(176,171,160,0.58)]">Circulation checks</p>
              {circulationChecks.map((item) => (
                <div key={item.label} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[--metis-paper]">{item.label}</span>
                    <ReadinessPill state={item.state} />
                  </div>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">{item.detail}</p>
                </div>
              ))}
              <div className="flex items-start gap-3 border-t border-white/8 pt-4 text-sm leading-6 text-[--metis-paper-muted]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[--metis-brass]" />
                <span>Executive brief open. Board note held pending exposure validation.</span>
              </div>
            </div>


            <div className="grid gap-3 px-5 py-5">
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/brief">
                  <Eye className="mr-2 h-4 w-4" />
Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/compare">
                  <RefreshCcw className="mr-2 h-4 w-4" />
Open delta
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
