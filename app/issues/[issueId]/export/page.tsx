import Link from "next/link";
import { CheckCircle2, Copy, Download, Eye, FileText, Mail, RefreshCcw } from "lucide-react";

import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CirculationEventTypeSchema, CirculationChannelSchema } from "@metis/shared/circulation";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { BriefModeSchema, BriefArtifactSchema, type BriefMode, type BriefArtifact } from "@metis/shared/briefVersion";
import { ExportFormatSchema, type ExportFormat } from "@metis/shared/export";
import { renderExportPackage } from "@/lib/export/renderExportPackage";

export const dynamic = "force-dynamic";

const packageOptions: Array<{
  id: ExportFormat;
  label: string;
  state: "Ready for review" | "Needs validation" | "Ready to circulate";
  audience: string;
  description: string;
}> = [
  {
    id: "full-issue-brief",
    label: "Full issue brief",
    state: "Ready for review",
    audience: "Corporate Affairs, Legal, COO staff",
    description: "Chronology, evidence, appendix",
  },
  {
    id: "executive-brief",
    label: "Executive brief",
    state: "Ready for review",
    audience: "CEO, COO, GC",
    description: "Internal",
  },
  {
    id: "board-note",
    label: "Board-note summary",
    state: "Needs validation",
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

export default async function IssueExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ issueId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { issueId } = await params;
  const sp = (await searchParams) ?? {};

  const modeRaw = typeof sp.mode === "string" ? sp.mode : Array.isArray(sp.mode) ? sp.mode[0] : undefined;
  const parsedMode = BriefModeSchema.safeParse(modeRaw ?? "full");
  const mode = parsedMode.success ? parsedMode.data : ("full" as const);

  const formatRaw = typeof sp.format === "string" ? sp.format : Array.isArray(sp.format) ? sp.format[0] : undefined;
  const parsedFormat = ExportFormatSchema.safeParse(formatRaw ?? "executive-brief");
  const selectedFormat = parsedFormat.success ? parsedFormat.data : ("executive-brief" as const);

  const issue = await getIssueById(issueId);
  if (!issue) {
    return (
      <MetisShell activePath="/export" pageTitle="Circulation Package" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId: issue.id, mode },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return (
      <MetisShell
        activePath="/export"
        pageTitle="Circulation Package"
        issueRoutePrefix={`/issues/${issue.id}`}
        activeIssue={{
          title: issue.title,
          severity: issue.severity,
          openGapsCount: issue.openGapsCount,
          updatedAt: issue.updatedAt,
        }}
      >
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Package selection</h2>
              <div className="flex flex-wrap items-center gap-2">
                <ReadinessPill state="Ready for review" />
                <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">—</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <h3 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">No brief version yet</h3>
            <p className="max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
              Prepare output requires a stored brief version. Generate the first brief, then return here to package it for circulation.
            </p>
            <Button asChild className="w-fit rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
              <Link href={`/issues/${issue.id}/brief?mode=${mode}`}>Open brief</Link>
            </Button>
          </div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const recentCirculationEvents = await prisma.circulationEvent.findMany({
    where: { issueId: issue.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const artifact = BriefArtifactSchema.parse(latest.artifact) as BriefArtifact;
  const rendered = renderExportPackage({ issue, mode, format: selectedFormat, artifact });

  // Wave 4: strict event semantics for export actions.
  const preparedEvent = CirculationEventTypeSchema.parse("prepared");
  const downloadedEvent = CirculationEventTypeSchema.parse("downloaded");
  const copiedEvent = CirculationEventTypeSchema.parse("copied");
  const fileChannel = CirculationChannelSchema.parse("file");
  const copyChannel = CirculationChannelSchema.parse("copy");
  const emailChannel = CirculationChannelSchema.parse("email");

  return (
    <MetisShell
      activePath="/export"
      pageTitle="Circulation Package"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Package selection</h2>
              <div className="flex flex-wrap items-center gap-2">
                <ReadinessPill state="Ready for review" />
                <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">
                  {packageOptions.find((o) => o.id === selectedFormat)?.label ?? "—"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="space-y-4">
              <div className="space-y-4">
                {packageOptions.map((item) => {
                  const isSelected = item.id === selectedFormat;
                  return (
                    <Link
                      key={item.id}
                      href={`/issues/${issue.id}/export?mode=${mode}&format=${item.id}`}
                      className={`block rounded-[1.35rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
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
                    </Link>
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
              <form action={`/api/issues/${issue.id}/export`} method="post">
                <input type="hidden" name="briefVersionId" value={latest.id} />
                <input type="hidden" name="format" value={selectedFormat} />
                <input type="hidden" name="logEvent.eventType" value={downloadedEvent} />
                <input type="hidden" name="logEvent.channel" value={fileChannel} />
                <Button type="submit" className="w-full justify-start rounded-[1rem] bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                  <Download className="mr-2 h-4 w-4" />
                  Download package file
                </Button>
              </form>

              <form action={`/api/issues/${issue.id}/export`} method="post">
                <input type="hidden" name="briefVersionId" value={latest.id} />
                <input type="hidden" name="format" value={selectedFormat} />
                <input type="hidden" name="logEvent.eventType" value={copiedEvent} />
                <input type="hidden" name="logEvent.channel" value={copyChannel} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-start rounded-[1rem] border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
                >
                  <Copy className="mr-2 h-4 w-4 text-[--metis-brass]" />
                  Copy executive brief text
                </Button>
              </form>

              <form action={`/api/issues/${issue.id}/export`} method="post">
                <input type="hidden" name="briefVersionId" value={latest.id} />
                <input type="hidden" name="format" value="email-ready" />
                <input type="hidden" name="logEvent.eventType" value={preparedEvent} />
                <input type="hidden" name="logEvent.channel" value={emailChannel} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-start rounded-[1rem] border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
                >
                  <Mail className="mr-2 h-4 w-4 text-[--metis-brass]" />
                  Copy email-ready package
                </Button>
              </form>
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
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[rgba(36,31,23,0.72)]">
                      {packageOptions.find((o) => o.id === selectedFormat)?.label ?? "Preview"}
                    </p>
                    <h3 className="mt-2 font-[Cormorant_Garamond] text-3xl text-[rgba(36,31,23,0.92)]">{issue.title}</h3>
                  </div>
                  <FileText className="h-5 w-5 text-[--metis-brass]" />
                </div>
                <div className="mt-5 space-y-3 text-sm leading-7 text-[rgba(36,31,23,0.78)]">
                  <p>{artifact.lede}</p>
                  <p>{artifact.metadata.circulation} circulation.</p>
                  <p>v{latest.versionNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[rgba(176,171,160,0.58)]">Recent circulation record</p>
              {recentCirculationEvents.length === 0 ? (
                <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[--metis-paper-muted]">
                  No circulation actions logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCirculationEvents.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">
                            {e.eventType}
                            {e.channel ? ` · ${e.channel}` : ""}
                            {e.postureState ? ` · ${e.postureState}` : ""}
                          </p>
                          {e.audienceLabel ? (
                            <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">{e.audienceLabel}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                          {e.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 px-5 py-5">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[rgba(176,171,160,0.58)]">Circulation checks</p>
              {packageOptions.map((item) => (
                <div key={item.label} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[--metis-paper]">{item.label}</span>
                    <ReadinessPill state={item.state} />
                  </div>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">{item.description}</p>
                </div>
              ))}
              <div className="flex items-start gap-3 border-t border-white/8 pt-4 text-sm leading-6 text-[--metis-paper-muted]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[--metis-brass]" />
                <span>{rendered.mimeType === "text/plain" ? "Plain text package ready." : "Markdown package ready."}</span>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href={`/issues/${issue.id}/brief?mode=${mode}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href={`/issues/${issue.id}/compare?mode=${mode}`}>
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

