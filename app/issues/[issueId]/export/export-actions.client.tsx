"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Download, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ExportFormat } from "@metis/shared/export";
import type { CirculationChannel, CirculationEventType } from "@metis/shared/circulation";
import { ArtifactExportResponseSchema } from "@metis/shared/circulation";

import { htmlExportToPlainClipboardFallback } from "@/lib/export/htmlToPlainClipboardFallback";

type PreviewMime = "text/markdown" | "text/plain" | "text/html";
/** Step 2 URL query `output=` for brief packages — email-ready omits output. */
export type ExportUrlOutput = "markdown" | "html" | "docx";
type DeliverTab = "markdown" | "html";

type Props = {
  issueId: string;
  briefVersionId: string;
  selectedFormat: ExportFormat;
  /** Query `output` for Markdown vs HTML vs DOCX; email-ready does not persist output in URL. */
  urlExportOutput: ExportUrlOutput;
  /** Brief mode preserved in bookmarks / navigation (query param `mode`). */
  urlMode: "full" | "executive";
  /** Stored BriefVersion.mode powering this package preview and download/copy. */
  briefSourceMode: "full" | "executive";
  /** e.g. "Full brief v3" — stored source revision for copy (not an export package version). */
  sourceBriefRevisionLabel: string;
  executiveBriefUsesFullBriefFallback: boolean;
  previewTitle: string;
  previewContent: string;
  previewMimeType: PreviewMime;
  /** When DOCX is selected, show placeholder instead of an empty `<pre>`/iframe. */
  previewIsDocxPlaceholder: boolean;
  eventTypes: { prepared: CirculationEventType; downloaded: CirculationEventType; copied: CirculationEventType };
  channels: { file: CirculationChannel; copy: CirculationChannel; email: CirculationChannel };
  /** Same-origin GET URL for binary DOCX download, or null for email-ready. */
  docxDownloadUrl: string | null;
};

function formatLabel(previewMimeType: PreviewMime, docx: boolean) {
  if (docx) return "DOCX";
  if (previewMimeType === "text/plain") return "Plain text";
  if (previewMimeType === "text/html") return "HTML";
  return "Markdown";
}

function downloadText({ filename, mimeType, content }: { filename: string; mimeType: string; content: string }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fallbackExt = mimeType === "text/html" ? "metis-export.html" : mimeType === "text/plain" ? "metis-export.txt" : "metis-export.md";
  a.download = filename || fallbackExt;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function postExport({
  issueId,
  briefVersionId,
  format,
  outputTypeForBody,
  logEvent,
}: {
  issueId: string;
  briefVersionId: string;
  format: ExportFormat;
  /** When omitted, server defaults non-email formats to Markdown. */
  outputTypeForBody?: DeliverTab;
  logEvent?: { eventType: CirculationEventType; channel?: CirculationChannel };
}) {
  const payload: Record<string, unknown> = {
    briefVersionId,
    format,
    ...(format !== "email-ready" ? { outputType: outputTypeForBody ?? "markdown" } : {}),
    ...(logEvent ? { logEvent } : {}),
  };
  const res = await fetch(`/api/issues/${issueId}/export`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = ArtifactExportResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

type ClipboardHtmlResult = "formatted_html" | "plain_text_fallback" | "plain_text_only";

/** HTML export: prefers `ClipboardItem` with both MIME types where supported (e.g. Chromium, Safari); otherwise plain clipboard text. */
async function writePackageToClipboard(mimeType: string, content: string): Promise<ClipboardHtmlResult> {
  if (mimeType !== "text/html") {
    await navigator.clipboard.writeText(content);
    return "plain_text_only";
  }
  const plain = htmlExportToPlainClipboardFallback(content);
  if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function") {
    try {
      const htmlBlob = new Blob([content], { type: "text/html" });
      const plainBlob = new Blob([plain], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": plainBlob,
        }),
      ]);
      return "formatted_html";
    } catch {
      /* e.g. Firefox custom MIME denial — fall through */
    }
  }
  await navigator.clipboard.writeText(plain);
  return "plain_text_fallback";
}

/** Shared shells — surface rhythm only; does not change structure or behavior. */
const STEP_PANEL =
  "rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4 sm:px-5 sm:py-4 border-l-[3px] border-l-[color-mix(in_oklab,var(--metis-brass)_55%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_24%,transparent)]";

const SECONDARY_PATH =
  "rounded-[var(--metis-control-radius-md)] border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-4 py-3";

const PREVIEW_SHELL =
  "rounded-[var(--metis-control-radius-md)] border border-[--metis-outline-subtle] bg-[--metis-frame-soft] px-4 py-4 sm:px-5 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--metis-outline-strong)_30%,transparent)]";

/** Wraps optional email-ready plain-text shortcut; not numbered like steps 1–4. */
const OPTIONAL_OUTPUTS_GROUP =
  "rounded-[var(--metis-control-radius-md)] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)] px-4 py-4 space-y-4 max-w-xl";

function stepLabel(n: string, title: string) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[0.65rem] font-semibold tabular-nums text-[--metis-brass-soft]"
        aria-hidden
      >
        {n}
      </span>
      <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">{title}</p>
    </div>
  );
}

export function ExportActionsClient(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "download" | "copy" | "email">(null);
  const [message, setMessage] = useState<null | { tone: "ok" | "bad"; text: string }>(null);
  const [expanded, setExpanded] = useState(false);

  const deliveryForPost: DeliverTab | undefined =
    props.selectedFormat === "email-ready"
      ? undefined
      : props.urlExportOutput === "docx"
        ? undefined
        : props.urlExportOutput;

  const navigateDelivery = (next: ExportUrlOutput) => {
    const q = new URLSearchParams({
      mode: props.urlMode,
      format: props.selectedFormat,
      output: next,
    });
    /** `replace` + `scroll: false` avoids snapping to top when toggling output format (Markdown/HTML/DOCX). */
    router.replace(`/issues/${props.issueId}/export?${q.toString()}`, { scroll: false });
  };

  const copyLabel = useMemo(() => {
    if (props.urlExportOutput === "docx") return "Copy not available for DOCX";
    if (props.selectedFormat === "email-ready") return "Copy email-ready package";
    if (props.previewMimeType === "text/html") return "Copy package (HTML + plain)";
    return "Copy package (Markdown)";
  }, [props.previewMimeType, props.selectedFormat, props.urlExportOutput]);

  const PreviewBody = ({
    mime,
    docxPlaceholder,
    title,
    content,
    lightOnDark,
    expanded: isExpanded,
  }: {
    mime: PreviewMime;
    docxPlaceholder: boolean;
    title: string;
    content: string;
    lightOnDark: boolean;
    expanded: boolean;
  }) => {
    if (docxPlaceholder) {
      return (
        <div className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] px-4 py-5 text-sm leading-6">
          <p className="font-medium text-[--metis-text-primary]">DOCX preview is not available.</p>
          <p className="mt-2 text-[--metis-text-secondary]">
            Download the Word document to review formatting. Clipboard copy is not available for DOCX on this page.
          </p>
        </div>
      );
    }
    if (mime === "text/html") {
      return (
        <div
          className={`${isExpanded ? "h-[min(calc(100vh-140px),52rem)]" : "max-h-[52vh]"} min-h-[220px] w-full overflow-hidden rounded-[1rem] border border-[--metis-outline-subtle] bg-white`}
        >
          <iframe title={title} className="h-full min-h-[200px] w-full border-0" srcDoc={content} sandbox="" />
        </div>
      );
    }
    return (
      <pre className={`whitespace-pre-wrap text-xs leading-6 ${lightOnDark ? "text-[--metis-text-primary]" : "text-[--metis-text-primary]"}`}>
        {content}
      </pre>
    );
  };

  const doDownload = async (format: ExportFormat, channel: CirculationChannel) => {
    setMessage(null);
    setBusy("download");
    try {
      const out = await postExport({
        issueId: props.issueId,
        briefVersionId: props.briefVersionId,
        format,
        outputTypeForBody: format === "email-ready" ? undefined : deliveryForPost,
        logEvent: { eventType: props.eventTypes.downloaded, channel },
      });
      if (!out) throw new Error("export_failed");
      downloadText({ filename: out.filename, mimeType: out.mimeType, content: out.content });
      setMessage({ tone: "ok", text: "Downloaded." });
    } catch {
      setMessage({ tone: "bad", text: "Download failed. Try again." });
    } finally {
      setBusy(null);
    }
  };

  const doCopy = async (format: ExportFormat, channel: CirculationChannel) => {
    setMessage(null);
    setBusy(format === "email-ready" ? "email" : "copy");
    try {
      const out = await postExport({
        issueId: props.issueId,
        briefVersionId: props.briefVersionId,
        format,
        outputTypeForBody: format === "email-ready" ? undefined : deliveryForPost,
        logEvent: { eventType: props.eventTypes.copied, channel },
      });
      if (!out) throw new Error("export_failed");
      const result = await writePackageToClipboard(out.mimeType, out.content);
      if (result === "formatted_html") {
        setMessage({ tone: "ok", text: "Formatted HTML copied." });
      } else if (result === "plain_text_fallback") {
        setMessage({ tone: "ok", text: "Plain text copied." });
      } else {
        setMessage({ tone: "ok", text: "Copied to clipboard." });
      }
    } catch {
      setMessage({ tone: "bad", text: "Copy failed. Try again or check clipboard permissions." });
    } finally {
      setBusy(null);
    }
  };

  const showEmailReadySecondary = props.selectedFormat !== "email-ready";
  const showOptionalOutputsSection = showEmailReadySecondary;
  const docxFlow = props.urlExportOutput === "docx" && Boolean(props.docxDownloadUrl);

  return (
    <div className="space-y-6">
      <div className={`${STEP_PANEL} space-y-5`}>
        {/* Step 2 — Output format */}
        <div className="space-y-2">
          {stepLabel("2", "Choose output format")}
          {props.selectedFormat !== "email-ready" ? (
            <div className="max-w-xl space-y-3">
              <SegmentedControl<ExportUrlOutput>
                label="Output format"
                value={props.urlExportOutput}
                disabled={busy !== null}
                allowLabelWrap
                className="min-w-0"
                options={
                  props.docxDownloadUrl
                    ? [
                        { id: "markdown", label: "Markdown" },
                        { id: "html", label: "HTML" },
                        { id: "docx", label: "DOCX" },
                      ]
                    : [
                        { id: "markdown", label: "Markdown" },
                        { id: "html", label: "HTML" },
                        { id: "docx", label: "DOCX", disabled: true },
                      ]
                }
                onChange={(next) => navigateDelivery(next)}
              />
              <ul className="list-inside list-disc space-y-1.5 text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                <li>
                  <span className="font-medium text-[--metis-text-primary]">Markdown</span> — best for editing or pasting into internal docs.
                </li>
                <li>
                  <span className="font-medium text-[--metis-text-primary]">HTML</span> — best for browser preview or publishing.
                </li>
                <li>
                  <span className="font-medium text-[--metis-text-primary]">DOCX</span> — best for sharing as a Word document (download only; no preview here).
                </li>
              </ul>
              <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                Copy and download snapshots are generated from{" "}
                <span className="text-[--metis-text-primary]">{props.sourceBriefRevisionLabel}</span>. Full issue brief includes the Audit appendix in Markdown,
                HTML, and DOCX; Executive brief and Board note have no appendix.
              </p>
            </div>
          ) : (
            <div className="max-w-xl space-y-2">
              <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
                This package is <span className="text-[--metis-text-primary]">plain text only</span> — not HTML or Word. Copy and download use the email-ready
                circulation draft from <span className="text-[--metis-text-primary]">{props.sourceBriefRevisionLabel}</span>.
              </p>
              <p className="text-[0.72rem] leading-snug text-[--metis-status-neutral-fg]">
                Email-ready is plain text only. Switch to Full issue brief, Executive brief, or Board note above for Markdown, HTML, or DOCX.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[--metis-outline-subtle]" aria-hidden />

        {/* Step 3 — Copy / download (current package only) */}
        <div className="space-y-2">
          {stepLabel("3", "Copy / download")}
          {docxFlow ? (
            <section className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Button asChild className="w-full justify-start">
                <a href={props.docxDownloadUrl!}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Word document
                </a>
              </Button>
              <Button type="button" variant="outline" className="w-full justify-start" disabled aria-label={copyLabel}>
                <Copy className="mr-2 h-4 w-4 text-[--metis-text-tertiary]" />
                {copyLabel}
              </Button>
            </section>
          ) : (
            <section className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="w-full justify-start"
                disabled={busy !== null}
                onClick={() => doDownload(props.selectedFormat, props.channels.file)}
              >
                <Download className="mr-2 h-4 w-4" />
                {busy === "download" ? "Preparing…" : "Download package file"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={busy !== null}
                onClick={() => doCopy(props.selectedFormat, props.channels.copy)}
              >
                <Copy className="mr-2 h-4 w-4 text-[--metis-brass]" />
                {busy === "copy" || (props.selectedFormat === "email-ready" && busy === "email") ? "Copying…" : copyLabel}
              </Button>
            </section>
          )}
          {props.urlExportOutput === "docx" && !props.docxDownloadUrl ? (
            <p className="max-w-xl text-xs text-[--metis-status-warning-fg]">DOCX is not available for this package.</p>
          ) : null}
        </div>
      </div>

      {message ? (
        <div
          className={`flex max-w-xl items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-sm ${
            message.tone === "ok"
              ? "border-[--metis-status-success-border] bg-[--metis-status-success-bg] text-[--metis-status-success-fg]"
              : "border-[--metis-status-danger-border] bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : null}
            <span>{message.text}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 text-current" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {showOptionalOutputsSection ? (
        <section className={OPTIONAL_OUTPUTS_GROUP} aria-label="Additional output options">
          <div className="space-y-1">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Additional output options</p>
            <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
              <span className="text-[--metis-paper]">Optional</span> — you have already finished the main flow after copy or download. Use these only if you need an
              extra format.
            </p>
          </div>

          {/* Email-ready: optional plain-text alternative package */}
          {showEmailReadySecondary ? (
            <div className={`${SECONDARY_PATH} space-y-2`}>
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Email-ready · plain circulation draft</p>
              <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
                <span className="text-[--metis-paper]">Optional alternative</span> — copies plain text from the separate{" "}
                <span className="text-[--metis-paper]">Email-ready package</span>, not another encoding of your current Markdown, HTML, or DOCX selection. Same
                clipboard action as switching to that package in step 1; skip this if your current package is enough.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start sm:w-fit"
                disabled={busy !== null}
                onClick={() => doCopy("email-ready", props.channels.email)}
              >
                <Mail className="mr-2 h-4 w-4 text-[--metis-brass]" />
                {busy === "email" && showEmailReadySecondary ? "Preparing…" : "Copy email-ready package"}
              </Button>
            </div>
          ) : null}

        </section>
      ) : null}

      {props.executiveBriefUsesFullBriefFallback ? (
        <ReviewRailCard
          tone="info"
          title="Executive brief not generated yet"
          meta={
            <p className="text-sm leading-6 text-[--metis-paper-muted]">
              This preview uses {props.sourceBriefRevisionLabel}&apos;s excerpt blocks until you generate or regenerate an Executive brief revision.
            </p>
          }
        >
          <Button asChild className="w-fit justify-start">
            <Link href={`/issues/${props.issueId}/brief?mode=executive`}>Generate Executive brief</Link>
          </Button>
        </ReviewRailCard>
      ) : null}

      {/* Step 4 — recommended review before circulating */}
      <section className={PREVIEW_SHELL} aria-labelledby="export-review-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div id="export-review-heading">{stepLabel("4", "Review before circulating")}</div>
            <p className="text-xs text-[--metis-paper-muted]">
              <span className="text-[--metis-paper]">Recommended:</span>{" "}
              {props.previewIsDocxPlaceholder
                ? "DOCX has no in-page preview — download the Word document to review."
                : <>
                    check this preview matches what you intend to circulate
                    {props.selectedFormat === "email-ready" ? " (plain text for this package)." : "."}
                  </>}{" "}
              {props.previewIsDocxPlaceholder
                ? null
                : props.executiveBriefUsesFullBriefFallback
                  ? `Shown from ${props.sourceBriefRevisionLabel} snapshot blocks until you generate or regenerate an Executive brief.`
                  : `Matches the package and format you chose for ${props.sourceBriefRevisionLabel}.`}{` `}
              {!props.previewIsDocxPlaceholder ? <>Export details remain in the summary panel →</> : null}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {!props.previewIsDocxPlaceholder ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (props.previewMimeType === "text/html") {
                    const frame = document.querySelector<HTMLIFrameElement>('iframe[title^="Review"]');
                    frame?.contentWindow?.print();
                  } else {
                    window.print();
                  }
                }}
              >
                Print
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
              Expand
            </Button>
          </div>
        </div>

        <div className="mt-4 max-h-[52vh] overflow-auto rounded-[1rem] border border-[--metis-outline-subtle] bg-white p-0 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
          <PreviewBody
            mime={props.previewMimeType}
            docxPlaceholder={props.previewIsDocxPlaceholder}
            title={`Review · ${props.previewTitle}`}
            content={props.previewContent}
            lightOnDark={false}
            expanded={false}
          />
        </div>
      </section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3 border-b border-[--metis-outline-subtle] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[--metis-text-primary]">{props.previewTitle}</p>
                <p className="mt-1 text-xs text-[--metis-text-secondary]">
                  {formatLabel(props.previewMimeType, props.previewIsDocxPlaceholder)} · {props.sourceBriefRevisionLabel}
                  {props.urlMode !== props.briefSourceMode ? ` · Bookmark mode: ${props.urlMode === "full" ? "Full" : "Executive"}` : ""}
                  {props.selectedFormat === "email-ready" ? " · Email-ready preview is plain text only." : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {docxFlow ? (
                  <>
                    <Button type="button" variant="outline" size="sm" disabled>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button asChild size="sm">
                      <a href={props.docxDownloadUrl!}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Word
                      </a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => doCopy(props.selectedFormat, props.channels.copy)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button type="button" size="sm" onClick={() => doDownload(props.selectedFormat, props.channels.file)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PreviewBody
                mime={props.previewMimeType}
                docxPlaceholder={props.previewIsDocxPlaceholder}
                title={`Expanded review · ${props.previewTitle}`}
                content={props.previewContent}
                lightOnDark
                expanded
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
