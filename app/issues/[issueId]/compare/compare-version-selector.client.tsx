"use client";

import { useRouter } from "next/navigation";
import type { BriefMode } from "@metis/shared/briefVersion";
import { ControlField, ControlSelect } from "@/components/ui/control";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type CompareVersionPickerRow = {
  id: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export function CompareVersionSelectors({
  issueId,
  mode,
  versionsNewestFirst,
  selectedFromId,
  selectedToId,
}: {
  issueId: string;
  mode: BriefMode;
  versionsNewestFirst: CompareVersionPickerRow[];
  selectedFromId: string | null;
  selectedToId: string;
}) {
  const router = useRouter();

  const replaceCompareUrl = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs.length ? `/issues/${issueId}/compare?${qs}` : `/issues/${issueId}/compare`, { scroll: false });
  };

  const onModeChange = (nextMode: BriefMode) => {
    const q = new URLSearchParams();
    q.set("mode", nextMode);
    replaceCompareUrl(q);
  };

  const onFromChange = (nextFrom: string | null) => {
    const q = new URLSearchParams();
    q.set("mode", mode);
    /** Empty string ⇒ omit `from`; server infers neighbour of `to`. */
    if (nextFrom?.trim()) q.set("from", nextFrom.trim());
    q.set("to", selectedToId);
    replaceCompareUrl(q);
  };

  const onToChange = (nextTo: string) => {
    const q = new URLSearchParams();
    q.set("mode", mode);
    if (selectedFromId) q.set("from", selectedFromId);
    q.set("to", nextTo.trim());
    replaceCompareUrl(q);
  };

  return (
    <div className="min-w-0 space-y-4 rounded-[1.05rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4 sm:px-5">
      <div className="space-y-1">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.72)]">Compare versions</p>
        <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
          Compare two stored brief versions for this mode.
          <span className="opacity-85"> Selection is reflected in the URL for sharing.</span>
        </p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
        <div className="min-w-0 space-y-2 xl:col-span-1">
          <SegmentedControl<BriefMode>
            label="Brief mode"
            value={mode}
            allowLabelWrap
            className="min-w-0"
            options={[
              { id: "full", label: "Full" },
              { id: "executive", label: "Executive" },
            ]}
            onChange={(m) => onModeChange(m)}
          />
          <p className="text-[0.72rem] leading-snug text-[--metis-ink-soft]">Switching mode clears version picks and uses defaults for that mode.</p>
        </div>

        <div className="min-w-0 space-y-2 xl:col-span-1">
          <ControlField
            label="From version"
            helper={versionsNewestFirst.length >= 2 ? "Earlier revision in this comparison." : undefined}
          >
            <ControlSelect
              aria-label="From brief version"
              className="w-full max-w-full min-w-0"
              value={selectedFromId ?? ""}
              disabled={versionsNewestFirst.length < 2}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) onFromChange(null);
                else onFromChange(v);
              }}
            >
              {versionsNewestFirst.length >= 2 ? (
                <>
                  <option value="">Let Metis infer (adjacent older than “To”)…</option>
                  {versionsNewestFirst.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.primaryLabel}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">No prior revision</option>
              )}
            </ControlSelect>
          </ControlField>
        </div>

        <div className="min-w-0 space-y-2 xl:col-span-1">
          <ControlField label="To version" helper="Later revision / target snapshot.">
            <ControlSelect
              aria-label="To brief version"
              className="w-full max-w-full min-w-0"
              value={selectedToId}
              onChange={(e) => onToChange(e.target.value)}
            >
              {versionsNewestFirst.map((v) => (
                <option key={`to-${v.id}`} value={v.id}>
                  {v.primaryLabel}
                </option>
              ))}
            </ControlSelect>
          </ControlField>
        </div>
      </div>

      {/* Secondary timestamps — compact; avoids overflow in selects */}
      <dl className="grid min-w-0 gap-x-6 gap-y-2 text-[0.7rem] leading-snug text-[--metis-paper-muted] sm:grid-cols-2">
        {versionsNewestFirst
          .filter((v) => v.id === selectedFromId || v.id === selectedToId)
          .map((v) => (
            <div key={v.id}>
              <dt className="font-medium uppercase tracking-[0.12em] text-[--metis-ink-soft]">{v.primaryLabel}</dt>
              <dd className="mt-1 text-[--metis-text-secondary]">{v.secondaryLabel}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
