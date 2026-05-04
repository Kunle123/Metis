"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Download, FileText, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  previewMeta: { label: string; value: string }[];
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

  return (
    <div className="space-y-4">
      {props.selectedFormat !== "email-ready" ? (
        <div className="max-w-xl space-y-2">
          <SegmentedControl<DeliverTab>
            label="Export output"
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
            <span className="text-[--metis-paper]">Markdown</span> — portable source you can move into docs or repositories.{" "}
            <span className="text-[--metis-paper]">HTML</span> — formatted for browser or rich paste; copy tries HTML with a plain-text
            fallback.
          </p>
        </div>
      ) : (
          <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
            Email-ready is a <span className="text-[--metis-paper]">plain circulation draft</span> from{" "}
            <span className="text-[--metis-paper]">{props.sourceBriefRevisionLabel}</span> (not HTML). Switch to a Markdown or HTML package for rich layout
            and optional <span className="text-[--metis-paper]">DOCX beta</span> download (on-demand; not the same as stored package history).
          </p>
      )}

      {props.docxBetaDownloadUrl ? (
        <div className="max-w-xl space-y-2 rounded-[var(--metis-control-radius-md)] border border-[--metis-outline-subtle] bg-[rgba(255,255,255,0.03)] px-4 py-3">
          <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
            <span className="text-[--metis-paper]">DOCX beta</span>: Word-compatible file generated on demand from{" "}
            <span className="text-[--metis-paper]">{props.sourceBriefRevisionLabel}</span>. Formatting may differ from the HTML preview. Stored export packages
            and circulation logging apply to Markdown/HTML/plain downloads from this flow — not the DOCX beta file.
          </p>
          <Button asChild variant="outline" className="w-fit justify-start">
            <a href={props.docxBetaDownloadUrl}>
              <FileText className="mr-2 h-4 w-4" />
              Download DOCX beta
            </a>
          </Button>
        </div>
      ) : null}

      <section className="grid gap-3 border-t border-white/8 pt-6 sm:grid-cols-3">
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
          {busy === "copy" ? "Copying…" : copyLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          disabled={busy !== null}
          onClick={() => doCopy("email-ready", props.channels.email)}
        >
          <Mail className="mr-2 h-4 w-4 text-[--metis-brass]" />
          {busy === "email" ? "Preparing…" : "Copy email-ready package"}
        </Button>
      </section>

      {message ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-[1rem] border px-4 py-3 text-sm ${
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

      <section className="rounded-[var(--metis-control-radius-md)] border border-[--metis-outline-subtle] bg-[rgba(255,255,255,0.035)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Preview</p>
            <p className="mt-1 text-xs text-[--metis-paper-muted]">
              {props.executiveBriefUsesFullBriefFallback
                ? `Preview uses ${props.sourceBriefRevisionLabel} snapshot blocks until you generate or regenerate an Executive brief.`
                : `Preview matches the selected package encoding for ${props.sourceBriefRevisionLabel}.`}
              {props.selectedFormat === "email-ready" ? " Email-ready is plain text only." : null}
            </p>
          </div>
          <div className="flex shrink-0 items-start">
            <Button type="button" variant="outline" size="sm" onClick={() => setExpanded(true)}>
              Expand
            </Button>
          </div>
        </div>

        <dl className="mt-3 grid gap-x-8 gap-y-3 text-[0.72rem] leading-snug text-[--metis-paper-muted] sm:grid-cols-2">
          {props.previewMeta.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="font-medium uppercase tracking-[0.14em] text-[--metis-ink-soft]">{m.label}</dt>
              <dd className="mt-0.5 text-[--metis-paper]">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 max-h-[52vh] overflow-auto rounded-[1rem] border border-white/10 bg-[rgba(0,0,0,0.18)] p-4">
          <PreviewBody
            mime={props.previewMimeType}
            title={`Preview · ${props.previewTitle}`}
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
                  {props.urlMode !== props.briefSourceMode
                    ? ` · Bookmark mode: ${props.urlMode === "full" ? "Full" : "Executive"}`
                    : ""}
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
                title={`Expanded preview · ${props.previewTitle}`}
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
