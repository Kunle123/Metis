"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  OUTPUT_WORDING_COPY,
  type BriefPolishPreviewRequest,
  type OutputWordingMode,
} from "@/lib/outputs/outputWordingMode";
import { cn } from "@/lib/utils";

const WORDING_BAR_SHELL =
  "border-b border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_18%,transparent)] px-5 py-3 sm:px-7";

export function OutputWordingModeBar({
  wordingMode,
  onWordingModeChange,
  canSelectAiPolished,
  polishPreview,
  onPreviewReady,
  className,
}: {
  wordingMode: OutputWordingMode;
  onWordingModeChange: (mode: OutputWordingMode) => void;
  canSelectAiPolished: boolean;
  polishPreview?: {
    issueId: string;
    briefVersionId: string;
    request: BriefPolishPreviewRequest;
  } | null;
  onPreviewReady: (text: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreview = async () => {
    if (!polishPreview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${polishPreview.issueId}/brief/polish-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: polishPreview.request.mode,
          scope: polishPreview.request.scope,
          briefVersionId: polishPreview.briefVersionId,
        }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (data && typeof data === "object" && data.disabled === true && typeof data.message === "string") {
        setError(data.message);
        return;
      }
      if (data && typeof data === "object" && data.success === true && typeof data.polished === "string") {
        onPreviewReady(data.polished);
        onWordingModeChange("ai-polished");
        router.refresh();
        return;
      }
      setError(
        typeof data.message === "string"
          ? data.message
          : res.ok
            ? "Polish preview could not be produced."
            : `Polish preview failed (${res.status}).`,
      );
    } catch {
      setError("Network error while requesting polish preview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(WORDING_BAR_SHELL, className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <SegmentedControl<OutputWordingMode>
            label={OUTPUT_WORDING_COPY.controlLabel}
            value={wordingMode}
            options={[
              { id: "stored", label: OUTPUT_WORDING_COPY.toggleStored },
              {
                id: "ai-polished",
                label: OUTPUT_WORDING_COPY.toggleAiPolished,
                disabled: !canSelectAiPolished,
              },
            ]}
            onChange={onWordingModeChange}
            className="w-full min-w-0 sm:max-w-md"
          />
          <p className="max-w-2xl text-[0.62rem] leading-snug text-[--metis-text-tertiary]">
            {OUTPUT_WORDING_COPY.controlHelper}
          </p>
        </div>
        {!canSelectAiPolished && polishPreview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 border-[color-mix(in_oklab,var(--metis-status-info-fg)_22%,var(--metis-outline-subtle))] px-2.5 text-[0.68rem]"
            disabled={loading}
            onClick={() => void runPreview()}
          >
            {loading ? "Generating…" : OUTPUT_WORDING_COPY.previewPolishedAction}
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-[0.62rem] text-[--metis-status-danger-fg]">{error}</p> : null}
    </div>
  );
}
