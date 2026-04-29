"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExportFormat } from "@metis/shared/export";
import type { CirculationChannel, CirculationEventType } from "@metis/shared/circulation";
import { ArtifactExportResponseSchema } from "@metis/shared/circulation";

type Props = {
  issueId: string;
  briefVersionId: string;
  selectedFormat: ExportFormat;
  /** Brief mode preserved in bookmarks / navigation (query param `mode`). */
  urlMode: "full" | "executive";
  /** Stored BriefVersion.mode powering this package preview and download/copy. */
  briefSourceMode: "full" | "executive";
  executiveBriefUsesFullBriefFallback: boolean;
  previewTitle: string;
  previewMeta: { label: string; value: string }[];
  previewContent: string;
  previewMimeType: "text/markdown" | "text/plain";
  eventTypes: { prepared: CirculationEventType; downloaded: CirculationEventType; copied: CirculationEventType };
  channels: { file: CirculationChannel; copy: CirculationChannel; email: CirculationChannel };
};

function downloadText({ filename, mimeType, content }: { filename: string; mimeType: string; content: string }) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "metis-export.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function postExport({
  issueId,
  briefVersionId,
  format,
  logEvent,
}: {
  issueId: string;
  briefVersionId: string;
  format: ExportFormat;
  logEvent?: { eventType: CirculationEventType; channel?: CirculationChannel };
}) {
  const res = await fetch(`/api/issues/${issueId}/export`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ briefVersionId, format, logEvent }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const parsed = ArtifactExportResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export function ExportActionsClient(props: Props) {
  const [busy, setBusy] = useState<null | "download" | "copy" | "email">(null);
  const [message, setMessage] = useState<null | { tone: "ok" | "bad"; text: string }>(null);
  const [expanded, setExpanded] = useState(false);

  const copyLabel = useMemo(() => {
    if (props.selectedFormat === "email-ready") return "Copy email-ready package";
    return "Copy package text";
  }, [props.selectedFormat]);

  const doDownload = async (format: ExportFormat, channel: CirculationChannel) => {
    setMessage(null);
    setBusy("download");
    try {
      const out = await postExport({
        issueId: props.issueId,
        briefVersionId: props.briefVersionId,
        format,
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
    setBusy("copy");
    try {
      const out = await postExport({
        issueId: props.issueId,
        briefVersionId: props.briefVersionId,
        format,
        logEvent: { eventType: props.eventTypes.copied, channel },
      });
      if (!out) throw new Error("export_failed");
      await navigator.clipboard.writeText(out.content);
      setMessage({ tone: "ok", text: "Copied to clipboard." });
    } catch {
      setMessage({ tone: "bad", text: "Copy failed. Check clipboard permissions." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 border-t border-white/8 pt-6 sm:grid-cols-3">
        <Button
          type="button"
          className="w-full justify-start rounded-[1rem]"
          disabled={busy !== null}
          onClick={() => doDownload(props.selectedFormat, props.channels.file)}
        >
          <Download className="mr-2 h-4 w-4" />
          {busy === "download" ? "Preparing…" : "Download package file"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start rounded-[1rem]"
          disabled={busy !== null}
          onClick={() => doCopy(props.selectedFormat, props.channels.copy)}
        >
          <Copy className="mr-2 h-4 w-4 text-[--metis-brass]" />
          {busy === "copy" ? "Copying…" : copyLabel}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start rounded-[1rem]"
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
          <button type="button" className="opacity-80 hover:opacity-100" onClick={() => setMessage(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <section className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.035)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-ink-soft]">Preview</p>
            <p className="mt-1 text-xs text-[--metis-paper-muted]">
              {props.previewMimeType === "text/plain" ? "Plain text" : "Markdown"} · Brief source:{" "}
              {props.briefSourceMode === "full" ? "Full" : "Executive"} (stored)
              {props.urlMode !== props.briefSourceMode
                ? ` · Bookmark mode: ${props.urlMode === "full" ? "Full" : "Executive"}`
                : ""}
              {props.executiveBriefUsesFullBriefFallback ? " · Full snapshot fallback until Executive regenerates." : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {props.previewMeta.slice(0, 5).map((m) => (
              <Badge key={m.label} className="border-0 bg-white/8 text-[--metis-paper-muted]">
                {m.label}: {m.value}
              </Badge>
            ))}
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setExpanded(true)}>
              Expand
            </Button>
          </div>
        </div>

        <div className="mt-4 max-h-[52vh] overflow-auto rounded-[1rem] border border-white/10 bg-[rgba(0,0,0,0.18)] p-4">
          <pre className="whitespace-pre-wrap text-xs leading-6 text-[rgba(255,255,255,0.9)]">{props.previewContent}</pre>
        </div>
      </section>

      {expanded ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[rgba(16,16,16,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{props.previewTitle}</p>
                <p className="mt-1 text-xs text-white/70">
                  {props.previewMimeType === "text/plain" ? "Plain text" : "Markdown"} · Brief source:{" "}
                  {props.briefSourceMode === "full" ? "Full" : "Executive"}
                  {props.urlMode !== props.briefSourceMode
                    ? ` · Bookmark mode: ${props.urlMode === "full" ? "Full" : "Executive"}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => doCopy(props.selectedFormat, props.channels.copy)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button type="button" className="rounded-full" onClick={() => doDownload(props.selectedFormat, props.channels.file)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setExpanded(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="whitespace-pre-wrap text-xs leading-6 text-white/90">{props.previewContent}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

