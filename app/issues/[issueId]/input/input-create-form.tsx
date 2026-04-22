"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InternalInputConfidence } from "@metis/shared/internalInput";

const confidenceLevels: InternalInputConfidence[] = ["Confirmed", "Likely", "Unclear", "Needs validation"];

export function InternalInputCreateForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState<InternalInputConfidence>("Likely");
  const [linkedSection, setLinkedSection] = useState("");
  const [visibility, setVisibility] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Capture internal input</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Stored on the issue record for attribution and gap resolution.</p>
          </div>
          <Button
            className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]"
            disabled={isSaving || !role.trim() || !name.trim() || !response.trim()}
            onClick={onSubmit}
          >
            {isSaving ? "Saving…" : "Save input"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Confidence</span>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as InternalInputConfidence)}
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-[--metis-paper]"
            >
              {confidenceLevels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Timestamp label</span>
            <Input
              value={timestampLabel}
              onChange={(e) => setTimestampLabel(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., 07:10 CET"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Role</span>
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" />
          </label>
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Response</span>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={5}
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[--metis-paper]"
            placeholder="Attributable internal wording"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Linked section (optional)</span>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="Free-text section label"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Visibility (optional)</span>
            <Input
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., Internal legal"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      </div>
    </div>
  );
}
