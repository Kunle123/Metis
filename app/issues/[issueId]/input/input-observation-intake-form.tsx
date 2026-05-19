"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confidenceDisplayLabel } from "@/lib/ui/confidenceDisplayLabel";
import type { InternalInputConfidence, InternalObservationVisibility } from "@metis/shared/internalInput";

import { InputIntakeSuccess } from "./input-intake-success";

const confidenceLevels: InternalInputConfidence[] = ["Confirmed", "Likely", "Unclear", "Needs validation"];

export function InputObservationIntakeForm({ issueId, issueRoutePrefix }: { issueId: string; issueRoutePrefix: string }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState<InternalInputConfidence>("Likely");
  const [visibility, setVisibility] = useState<InternalObservationVisibility>("Organisation");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaved(false);
    if (!role.trim() || !name.trim() || !response.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: role.trim(),
          name: name.trim(),
          response: response.trim(),
          confidence,
          linkedSection: null,
          visibility,
          timestampLabel: null,
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
      setVisibility("Organisation");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save observation.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm leading-6 text-[--metis-paper-muted]">
        Add an attributed internal observation. Use the list below to curate visibility and brief inclusion.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Role</span>
          <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-full" placeholder="e.g. Comms lead" />
        </label>
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-full" placeholder="Who said or provided this" />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Observation</span>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          className="w-full rounded-[1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper]"
          placeholder="Attributable internal wording"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Confidence</span>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as InternalInputConfidence)}
            className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper]"
          >
            {confidenceLevels.map((c) => (
              <option key={c} value={c}>
                {confidenceDisplayLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Visibility</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as InternalObservationVisibility)}
            className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper]"
          >
            <option value="Organisation">Visible to organisation</option>
            <option value="Restricted">Restricted</option>
          </select>
        </label>
      </div>
      {error ? (
        <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <InputIntakeSuccess
          message="Observation added to this issue."
          href={`${issueRoutePrefix}/input#observations-list`}
          linkLabel="View observations"
        />
      ) : null}
      <div className="flex justify-end border-t border-[--metis-outline-subtle] pt-4">
        <Button
          type="button"
          className="rounded-full px-5"
          disabled={isSaving || !role.trim() || !name.trim() || !response.trim()}
          onClick={onSubmit}
        >
          {isSaving ? "Saving…" : "Add observation"}
        </Button>
      </div>
    </div>
  );
}
