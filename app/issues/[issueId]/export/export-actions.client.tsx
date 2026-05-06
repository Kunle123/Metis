"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Download, FileText, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { ExportFormat } from "@metis/shared/export";
import type { CirculationChannel, CirculationEventType } from "@metis/shared/circulation";
import { ArtifactExportResponseSchema } from "@metis/shared/circulation";

import { htmlExportToPlainClipboardFallback } from "@/lib/export/htmlToPlainClipboardFallback";

type PreviewMime = "text/markdown" | "text/plain" | "text/html";
type DeliverTab = "markdown" | "html";

type Props = {
  issueId: string;
  briefVersionId: string;
  selectedFormat: ExportFormat;
  /** Resolved delivery for brief packages (Markdown vs HTML preview); email-ready ignores this server-side. */
  exportPreviewOutput: DeliverTab;
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
  eventTypes: { prepared: CirculationEventType; downloaded: CirculationEventType; copied: CirculationEventType };
  channels: { file: CirculationChannel; copy: CirculationChannel; email: CirculationChannel };
  /** Same-origin GET URL for binary DOCX beta download, or null for email-ready / unavailable. */
  docxBetaDownloadUrl: string | null;
};

function formatLabel(previewMimeType: PreviewMime) {
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
  "rounded-[1.25rem] border border-white/[0.08] bg-[rgba(255,255,255,0.025)] px-4 py-4 sm:px-5 sm:py-4 border-l-[3px] border-l-[rgba(224,183,111,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

const SECONDARY_PATH =
  "rounded-[var(--metis-control-radius-md)] border border-dashed border-white/15 bg-[rgba(18,86,118,0.12)] px-4 py-3";

const ADDITIONAL_DOWNLOAD =
  "rounded-[var(--metis-control-radius-md)] border border-white/[0.1] bg-[rgba(255,255,255,0.03)] px-4 py-3 border-l-2 border-l-white/25";

const PREVIEW_SHELL =
  "rounded-[var(--metis-control-radius-md)] border border-white/12 bg-[rgba(0,0,0,0.14)] px-4 py-4 sm:px-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";

/** Wraps optional email-ready + DOCX; not numbered like steps 1–4. */
const OPTIONAL_OUTPUTS_GROUP =
  "rounded-[var(--metis-control-radius-md)] border border-white/[0.06] bg-[rgba(255,255,255,0.015)] px-4 py-4 space-y-4 max-w-xl";

function stepLabel(n: string, title: string) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[rgba(255,255,255,0.07)] text-[0.65rem] font-semibold tabular-nums text-[--metis-brass-soft]"
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

  const deliveryForPost = props.selectedFormat === "email-ready" ? undefined : props.exportPreviewOutput;

  const navigateDelivery = (next: DeliverTab) => {
    const q = new URLSearchParams({
      mode: props.urlMode,
      format: props.selectedFormat,
      output: next,
    });
    router.push(`/issues/${props.issueId}/export?${q.toString()}`);
  };

  const copyLabel = useMemo(() => {
    if (props.selectedFormat === "email-ready") return "Copy email-ready package";
    if (props.previewMimeType === "text/html") return "Copy package (HTML + plain)";
    return "Copy package (Markdown)";
  }, [props.previewMimeType, props.selectedFormat]);

  const PreviewBody = ({
    mime,
    title,
    content,
    lightOnDark,
    expanded: isExpanded,
  }: {
    mime: PreviewMime;
    title: string;
    content: string;
    lightOnDark: boolean;
    expanded: boolean;
  }) => {
    if (mime === "text/html") {
      return (
        <div
          className={`${isExpanded ? "h-[min(calc(100vh-140px),52rem)]" : "max-h-[52vh]"} min-h-[220px] w-full overflow-hidden rounded-[1rem] border border-white/10 bg-white`}
        >
          <iframe title={title} className="h-full min-h-[200px] w-full border-0" srcDoc={content} sandbox="" />
        </div>
      );
    }
    return (
      <pre className={`whitespace-pre-wrap text-xs leading-6 ${lightOnDark ? "text-white/90" : "text-[rgba(255,255,255,0.9)]"}`}>{content}</pre>
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
  const showOptionalOutputsSection = showEmailReadySecondary || Boolean(props.docxBetaDownloadUrl);

  return (
    <div className="space-y-6">
      <div className={`${STEP_PANEL} space-y-5`}>
        {/* Step 2 — Output format */}
        <div className="space-y-2">
          {stepLabel("2", "Output format")}
          {props.selectedFormat !== "email-ready" ? (
            <div className="max-w-xl space-y-2">
              <SegmentedControl<DeliverTab>
                label="Output format"
                value={props.exportPreviewOutput}
                disabled={busy !== null}
                options={[
                  { id: "markdown", label: "Markdown" },
                  { id: "html", label: "HTML" },
                ]}
                onChange={(next) => navigateDelivery(next)}
              />
              <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
                Download and copy create a stored package snapshot from <span className="text-[--metis-paper]">{props.sourceBriefRevisionLabel}</span>.{" "}
                <span className="text-[--metis-paper]">Markdown</span> — portable source.{" "}
                <span className="text-[--metis-paper]">HTML</span> — formatted for browser or rich paste; copy tries HTML with a plain-text fallback.
              </p>
            </div>
          ) : (
            <p className="max-w-xl text-xs leading-relaxed text-[--metis-paper-muted]">
              This package is <span className="text-[--metis-paper]">plain text only</span> (not Markdown/HTML encoding). Copy and download use the email-ready
              circulation draft from <span className="text-[--metis-paper]">{props.sourceBriefRevisionLabel}</span>.
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.08]" aria-hidden />

        {/* Step 3 — Copy / download (current package only) */}
        <div className="space-y-2">
          {stepLabel("3", "Copy / download")}
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
        </div>
      </div>

      {message ? (
        <div
          className={`flex max-w-xl items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-sm ${
            message.tone === "ok"
              ? "border-emerald-400/25 bg-[rgba(18,83,58,0.35)] text-emerald-50"
              : "border-rose-400/25 bg-[rgba(118,27,46,0.35)] text-rose-50"
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
                <span className="text-[--metis-paper]">Email-ready package</span>, not another encoding of your current Markdown/HTML selection. Same clipboard
                action as switching to that package in step 1; skip this if your current package is enough.
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

          {/* DOCX: optional on-demand Word file — outside main package flow */}
          {props.docxBetaDownloadUrl ? (
            <div className={`${ADDITIONAL_DOWNLOAD} space-y-2`}>
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Word · DOCX beta (on-demand)</p>
              <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
                <span className="text-[--metis-paper]">Optional additional download</span> — Word-compatible file built on demand from{" "}
                <span className="text-[--metis-paper]">{props.sourceBriefRevisionLabel}</span>.{" "}
                <span className="text-[--metis-paper]">Not part of</span> the main Markdown/HTML copy and download path on this page; formatting may differ from
                previews.
                Stored export packages and circulation logging for this page apply to Markdown/HTML/plain actions —{" "}
                <span className="text-[--metis-paper]">not</span> this beta file.
              </p>
              <Button asChild variant="outline" className="w-fit justify-start">
                <a href={props.docxBetaDownloadUrl}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download DOCX beta
                </a>
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
              <span className="text-[--metis-paper]">Recommended:</span> check this preview matches what you intend to circulate{props.selectedFormat === "email-ready" ? " (plain text for this package)" : ""}.{` `}
              {props.executiveBriefUsesFullBriefFallback
                ? `Shown from ${props.sourceBriefRevisionLabel} snapshot blocks until you generate or regenerate an Executive brief.`
                : `Matches the package and format you chose for ${props.sourceBriefRevisionLabel}.`}{` `}
              Export details remain in the summary panel →
            </p>
          </div>
          <div className="flex shrink-0 items-start">
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
              Expand
            </Button>
          </div>
        </div>

        <div className="mt-4 max-h-[52vh] overflow-auto rounded-[1rem] border border-white/15 bg-[rgba(0,0,0,0.22)] p-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
          <PreviewBody
            mime={props.previewMimeType}
            title={`Review · ${props.previewTitle}`}
            content={props.previewContent}
            lightOnDark={false}
            expanded={false}
          />
        </div>
      </section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[rgba(16,16,16,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{props.previewTitle}</p>
                <p className="mt-1 text-xs text-white/70">
                  {formatLabel(props.previewMimeType)} · {props.sourceBriefRevisionLabel}
                  {props.urlMode !== props.briefSourceMode ? ` · Bookmark mode: ${props.urlMode === "full" ? "Full" : "Executive"}` : ""}
                  {props.selectedFormat === "email-ready" ? " · Email-ready preview is plain text only." : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => doCopy(props.selectedFormat, props.channels.copy)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button type="button" size="sm" onClick={() => doDownload(props.selectedFormat, props.channels.file)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PreviewBody
                mime={props.previewMimeType}
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
