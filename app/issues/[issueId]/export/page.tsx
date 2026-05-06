import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { CirculationEventTypeSchema, CirculationChannelSchema } from "@metis/shared/circulation";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { BriefModeSchema, BriefArtifactSchema, type BriefArtifact } from "@metis/shared/briefVersion";
import { ExportFormatSchema, type ExportFormat, type ExportOutputType } from "@metis/shared/export";
import { resolveBriefVersionForExport } from "@/lib/export/resolveBriefVersionForExport";
import { renderExportDeliverable } from "@/lib/export/renderExportPackage";
import { ExportActionsClient } from "@/app/issues/[issueId]/export/export-actions.client";

export const dynamic = "force-dynamic";

const packageOptions: Array<{
  id: ExportFormat;
  label: string;
  audience: string;
  description: string;
}> = [
  {
    id: "full-issue-brief",
    label: "Full issue brief",
    audience: "Corporate Affairs, Legal, COO staff",
    description: "Chronology, evidence, appendix",
  },
  {
    id: "executive-brief",
    label: "Executive brief",
    audience: "CEO, COO, GC",
    description: "Internal",
  },
  {
    id: "board-note",
    label: "Board-note summary",
    audience: "Board chair, company secretary",
    description: "Hold pending exposure wording",
  },
  {
    id: "email-ready",
    label: "Email-ready package",
    audience: "Circulation drafts",
    description: "Plain text only — cautious circulation wording without HTML layout.",
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
  const parsedUrlMode = BriefModeSchema.safeParse(modeRaw ?? "full");
  const urlMode = parsedUrlMode.success ? parsedUrlMode.data : ("full" as const);

  const formatRaw = typeof sp.format === "string" ? sp.format : Array.isArray(sp.format) ? sp.format[0] : undefined;
  const parsedFormat = ExportFormatSchema.safeParse(formatRaw ?? "executive-brief");
  const selectedFormat = parsedFormat.success ? parsedFormat.data : ("executive-brief" as const);

  const outputRaw = typeof sp.output === "string" ? sp.output : Array.isArray(sp.output) ? sp.output[0] : undefined;
  /** Delivery encoding for Markdown vs HTML preview/download (email-ready is always plain text). */
  const exportPreviewOutput: Exclude<ExportOutputType, "plain"> =
    selectedFormat === "email-ready"
      ? "markdown"
      : outputRaw === "html"
        ? "html"
        : "markdown";

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

  const resolved = await resolveBriefVersionForExport(issue.id, urlMode, selectedFormat);

  if (!resolved) {
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
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div className="space-y-1">
                  <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Package selection</h2>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    Prepare output requires a stored brief version.
                  </p>
                </div>
              }
              right={null}
            />
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <h3 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">No brief version yet</h3>
            <p className="max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
              Prepare output requires a stored brief version. Generate the first brief, then return here to package it for circulation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="w-fit rounded-full px-5">
                <Link href={`/issues/${issue.id}/brief?mode=${urlMode}`}>Open brief</Link>
              </Button>
              <Button asChild variant="outline" className="w-fit rounded-full px-5">
                <Link href={`/issues/${issue.id}/sources`}>Open sources</Link>
              </Button>
              <Button asChild variant="outline" className="w-fit rounded-full px-5">
                <Link href={`/issues/${issue.id}/gaps`}>Open questions</Link>
              </Button>
            </div>
            <ReviewRailCard
              title="Message variants"
              tone="info"
              meta={
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  You can still draft a reviewable external update from the issue record (no brief required).
                </p>
              }
            >
              <div className="grid gap-3">
                <Button asChild variant="outline" className="w-fit justify-start">
                  <Link href={`/issues/${issue.id}/messages`}>Open Messages</Link>
                </Button>
              </div>
            </ReviewRailCard>
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

  const { briefVersion, sourceMode, executiveBriefUsesFullBriefFallback } = resolved;

  const artifact = BriefArtifactSchema.parse(briefVersion.artifact) as BriefArtifact;
  const rendered = renderExportDeliverable({
    issue,
    mode: sourceMode,
    format: selectedFormat,
    artifact,
    outputType: exportPreviewOutput,
  });

  const downloadExtension =
    selectedFormat === "email-ready"
      ? ".txt"
      : rendered.mimeType === "text/html"
        ? ".html"
        : rendered.mimeType === "text/plain"
          ? ".txt"
          : ".md";

  const copyBehaviorShort =
    selectedFormat === "email-ready"
      ? "Plain text (not HTML)"
      : rendered.mimeType === "text/html"
        ? "Rich HTML + plain fallback"
        : rendered.mimeType === "text/markdown"
          ? "Markdown plain text"
          : "Plain text";

  const encodingLabel =
    rendered.mimeType === "text/html" ? "HTML" : rendered.mimeType === "text/plain" ? "Plain text" : "Markdown";

  const sourceBriefRevisionLabel = `${sourceMode === "full" ? "Full" : "Executive"} brief v${briefVersion.versionNumber}`;
  const generatedFromBriefLine = `Generated from ${sourceBriefRevisionLabel}.`;
  const packageFromBriefDescription =
    selectedFormat === "email-ready"
      ? `Plain text package from ${sourceBriefRevisionLabel}`
      : rendered.mimeType === "text/html"
        ? `HTML rendering from ${sourceBriefRevisionLabel}`
        : `Markdown rendering from ${sourceBriefRevisionLabel}`;

  // Wave 4: strict event semantics for export actions.
  const preparedEvent = CirculationEventTypeSchema.parse("prepared");
  const downloadedEvent = CirculationEventTypeSchema.parse("downloaded");
  const copiedEvent = CirculationEventTypeSchema.parse("copied");
  const fileChannel = CirculationChannelSchema.parse("file");
  const copyChannel = CirculationChannelSchema.parse("copy");
  const emailChannel = CirculationChannelSchema.parse("email");

  const exportSummaryMeta: { label: string; value: string }[] = [
    { label: "Export format", value: packageOptions.find((o) => o.id === selectedFormat)?.label ?? "—" },
    { label: "Encoding", value: encodingLabel },
    { label: "Download", value: downloadExtension },
    { label: "Copy", value: copyBehaviorShort },
    { label: "Source brief", value: sourceBriefRevisionLabel },
    { label: "Package", value: packageFromBriefDescription },
    { label: "Circulation", value: artifact.metadata.circulation },
    ...(urlMode !== sourceMode ? ([{ label: "Bookmark (URL)", value: urlMode === "full" ? "Full" : "Executive" }] as const) : []),
  ];

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
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SurfaceCard className="min-w-0 overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div className="space-y-1">
                  <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Prepare output</h2>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    <span className="text-[--metis-paper]">{generatedFromBriefLine}</span> Circulation packages are snapshots from that stored brief — not a separate
                    numbered export. Choose a package, an output format where applicable, then copy or download; review the preview before circulating.
                  </p>
                  <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                    Update the record first if needed:{" "}
                    <Link href={`/issues/${issue.id}/sources`} className="text-[--metis-brass-soft] underline-offset-4 hover:underline">
                      Sources
                    </Link>
                    {" · "}
                    <Link href={`/issues/${issue.id}/gaps`} className="text-[--metis-brass-soft] underline-offset-4 hover:underline">
                      Open questions
                    </Link>
                    {" · "}
                    <Link href={`/issues/${issue.id}/brief?mode=${sourceMode}`} className="text-[--metis-brass-soft] underline-offset-4 hover:underline">
                      Brief ({sourceMode === "full" ? "full" : "executive"})
                    </Link>
                    .
                  </p>
                </div>
              }
              right={
                <div className="hidden max-w-[16rem] text-right text-[0.72rem] leading-snug text-[--metis-paper-muted] sm:block">
                  <span className="font-medium text-[--metis-paper]">{packageOptions.find((o) => o.id === selectedFormat)?.label ?? "—"}</span>
                  <br />
                  {generatedFromBriefLine}
                </div>
              }
            />
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <section className="space-y-3 rounded-[1.25rem] border border-white/[0.08] bg-[rgba(255,255,255,0.025)] px-4 py-4 sm:px-5 sm:py-4 border-l-[3px] border-l-[rgba(224,183,111,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[rgba(255,255,255,0.07)] text-[0.65rem] font-semibold tabular-nums text-[--metis-brass-soft]"
                  aria-hidden
                >
                  1
                </span>
                <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Choose package</p>
              </div>
              <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                Names describe package shapes only — not live readiness scoring for your issue.
              </p>
              <div className="rounded-[1.1rem] border border-white/[0.09] bg-[rgba(0,0,0,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                {packageOptions.map((item) => {
                  const isSelected = item.id === selectedFormat;
                  return (
                    <Link
                      key={item.id}
                      href={`/issues/${issue.id}/export?mode=${urlMode}&format=${item.id}${
                        item.id === "email-ready" ? "" : `&output=${exportPreviewOutput}`
                      }`}
                      className={`block border-t border-white/10 px-4 py-3.5 first:border-t-0 sm:px-5 ${
                        isSelected
                          ? "bg-[rgba(224,183,111,0.12)] ring-2 ring-[--metis-brass]/35 ring-inset"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <DenseSection
                        title={
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[--metis-paper]">
                              {item.label}
                            </span>
                            {isSelected ? (
                              <Badge className="border-0 bg-[--metis-brass]/25 text-[--metis-brass-soft]">Selected package</Badge>
                            ) : null}
                          </div>
                        }
                        className="space-y-2 border-t-0 pt-0"
                        titleClassName="text-[0.62rem]"
                      >
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-6 text-[--metis-paper-muted]">{item.description}</p>
                            <p className="mt-1 text-xs text-[--metis-paper-muted]">
                              <span className="text-[--metis-paper]">Audience:</span> {item.audience}
                            </p>
                          </div>
                        </div>
                      </DenseSection>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[var(--metis-control-radius-md)] border border-dashed border-white/10 bg-transparent px-3 py-2">
                <CollapsibleSection
                  defaultOpen={false}
                  summary={
                    <div className="min-w-0">
                      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">What&apos;s included</p>
                      <p className="mt-0.5 text-[0.7rem] leading-snug text-[--metis-paper-muted]">Reference only — not a step in export. Illustrative inclusion list for package shapes.</p>
                    </div>
                  }
                >
                  <div className="grid gap-2 pt-2 sm:grid-cols-2">
                    {packageContents.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-[0.875rem] border border-white/8 bg-[rgba(255,255,255,0.03)] px-3 py-2"
                      >
                        <span className="text-xs text-[--metis-paper]">{item.label}</span>
                        <Badge
                          className={`border-0 text-[0.65rem] ${
                            item.included ? "bg-[rgba(18,84,58,0.62)] text-emerald-50" : "bg-white/8 text-[--metis-paper-muted]"
                          }`}
                        >
                          {item.included ? "Included" : "Hidden"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            </section>

            <ExportActionsClient
              issueId={issue.id}
              briefVersionId={briefVersion.id}
              selectedFormat={selectedFormat}
              exportPreviewOutput={exportPreviewOutput}
              urlMode={urlMode}
              briefSourceMode={sourceMode}
              sourceBriefRevisionLabel={sourceBriefRevisionLabel}
              executiveBriefUsesFullBriefFallback={executiveBriefUsesFullBriefFallback}
              docxBetaDownloadUrl={
                selectedFormat !== "email-ready"
                  ? `/api/issues/${issue.id}/export/docx?briefVersionId=${encodeURIComponent(briefVersion.id)}&format=${encodeURIComponent(selectedFormat)}`
                  : null
              }
              previewTitle={issue.title}
              previewContent={rendered.content}
              previewMimeType={rendered.mimeType}
              eventTypes={{ prepared: preparedEvent, downloaded: downloadedEvent, copied: copiedEvent }}
              channels={{ file: fileChannel, copy: copyChannel, email: emailChannel }}
            />

            <div className="rounded-[1rem] border border-dashed border-white/12 bg-[rgba(255,255,255,0.015)] px-4 py-3">
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Related</p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-[--metis-paper-muted]">
                Need message copy instead? Message variants live outside this export workflow.{" "}
                <Link className="text-[--metis-brass-soft] underline-offset-4 hover:underline" href={`/issues/${issue.id}/messages`}>
                  Open Messages
                </Link>
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard
              title="Export summary"
              tone="info"
              meta={
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Context for the current URL selection. Live preview stays in the main column.
                </p>
              }
            >
              <dl className="divide-y divide-white/[0.06] text-[0.68rem] leading-snug text-[--metis-paper-muted]">
                {exportSummaryMeta.map((row) => (
                  <div key={row.label} className="py-2.5 first:pt-0 last:pb-0">
                    <dt className="font-medium uppercase tracking-[0.12em] text-[--metis-ink-soft]">{row.label}</dt>
                    <dd className="mt-1 text-[--metis-paper]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </ReviewRailCard>

            <CollapsibleSection
              defaultOpen={false}
              className="border-[--metis-info-border] bg-[--metis-info-bg]"
              summary={
                <div className="min-w-0">
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[rgba(176,171,160,0.58)]">Recent circulation record</p>
                  <p className="mt-1 text-xs text-[--metis-paper-muted]">Last 5 actions.</p>
                </div>
              }
            >
              {recentCirculationEvents.length === 0 ? (
                <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-6 text-[--metis-paper-muted]">
                  No circulation actions logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {recentCirculationEvents.map((e) => (
                    <div key={e.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3">
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
            </CollapsibleSection>

            <CollapsibleSection
              defaultOpen={false}
              className="border-[--metis-info-border] bg-[--metis-info-bg]"
              summary={
                <div className="min-w-0">
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[rgba(176,171,160,0.58)]">Circulation checks</p>
                  <p className="mt-1 text-xs text-[--metis-paper-muted]">Illustrative package notes — not authoritative status for this issue.</p>
                </div>
              }
            >
              <div className="space-y-3">
                {packageOptions.map((item) => (
                  <div key={item.label} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                    <span className="text-sm font-medium text-[--metis-paper]">{item.label}</span>
                    <p className="text-sm leading-6 text-[--metis-paper-muted]">{item.description}</p>
                  </div>
                ))}
                <div className="flex items-start gap-3 border-t border-white/8 pt-4 text-sm leading-6 text-[--metis-paper-muted]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[--metis-brass]" />
                  <span>
                    {rendered.mimeType === "text/plain"
                      ? "Plain text package ready · download ends in .txt; copy is plain text only (no styled HTML)."
                      : rendered.mimeType === "text/html"
                        ? "HTML package ready · download ends in .html; copy tries formatted HTML plus a readable plain fallback if your browser supports it."
                        : "Markdown package ready · download ends in .md; copy is Markdown plain text."}
                  </span>
                </div>
              </div>
            </CollapsibleSection>

            <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)] px-4 py-3">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Related</p>
              <p className="mt-1 text-xs text-[--metis-paper-muted]">Generation and change tracking.</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <Link className="text-[--metis-brass-soft] underline-offset-4 hover:underline" href={`/issues/${issue.id}/brief?mode=${sourceMode}`}>
                  Open brief
                </Link>
                <Link className="text-[--metis-brass-soft] underline-offset-4 hover:underline" href={`/issues/${issue.id}/compare?mode=${urlMode}`}>
                  Open delta
                </Link>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

