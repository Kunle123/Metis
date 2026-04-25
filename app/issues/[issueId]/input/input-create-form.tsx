"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confidenceDisplayLabel } from "@/lib/ui/confidenceDisplayLabel";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import type { InternalInputConfidence } from "@metis/shared/internalInput";

const confidenceLevels: InternalInputConfidence[] = ["Confirmed", "Likely", "Unclear", "Needs validation"];

export function InternalInputCreateForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [response, setResponse] = useState("");
  const defaultConfidence: InternalInputConfidence = "Likely";
  const [confidence, setConfidence] = useState<InternalInputConfidence>(defaultConfidence);
  const [linkedSection, setLinkedSection] = useState("");
  const [visibility, setVisibility] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    confidence !== defaultConfidence ||
    role.trim().length > 0 ||
    name.trim().length > 0 ||
    response.trim().length > 0 ||
    linkedSection.trim().length > 0 ||
    visibility.trim().length > 0 ||
    timestampLabel.trim().length > 0;

  useUnsavedChangesWarning({ isDirty, isSaving });

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role,
          name,
          response,
          confidence,
          linkedSection: linkedSection.trim() ? linkedSection : null,
          visibility: visibility.trim() ? visibility : null,
          timestampLabel: timestampLabel.trim() ? timestampLabel : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      setRole("");
      setName("");
      setResponse("");
      setConfidence("Likely");
      setLinkedSection("");
      setVisibility("");
      setTimestampLabel("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-[rgba(255,255,255,0.045)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Capture internal input</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Stored on the issue record for attribution and gap resolution.</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Fields marked (optional) can be left blank.</p>
          </div>
          <Button
            className="rounded-full px-5"
            disabled={isSaving || !role.trim() || !name.trim() || !response.trim()}
            onClick={onSubmit}
          >
            {isSaving ? "Saving…" : "Save input"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Confidence</span>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as InternalInputConfidence)}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {confidenceLevels.map((c) => (
                <option key={c} value={c}>
                  {confidenceDisplayLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Timestamp label (optional)</span>
            <Input
              value={timestampLabel}
              onChange={(e) => setTimestampLabel(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., 07:10 CET"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Role</span>
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-11 rounded-full" />
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-full" />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Response</span>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={5}
            className="w-full rounded-[1.1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            placeholder="Attributable internal wording"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Linked section (optional)</span>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full"
              placeholder="Free-text section label"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Visibility (optional)</span>
            <Input
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., Internal legal"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      </div>
    </div>
  );
}
