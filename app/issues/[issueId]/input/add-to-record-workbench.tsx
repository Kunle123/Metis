"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { CaptureNotesForm } from "./capture-notes-form";
import { InputClaimIntakeForm } from "./input-claim-intake-form";
import { InputGapIntakeForm } from "./input-gap-intake-form";
import { InputObservationIntakeForm } from "./input-observation-intake-form";
import { InputSourceIntakeForm } from "./input-source-intake-form";

export type AddToRecordMode = "free-text" | "source" | "claim" | "gap" | "observation";

const MODES: { id: AddToRecordMode; label: string; hint: string }[] = [
  { id: "free-text", label: "Paste free text", hint: "Notes, email, call summary" },
  { id: "source", label: "Add source", hint: "Evidence or reference" },
  { id: "claim", label: "Add claim", hint: "Statement to track" },
  { id: "gap", label: "Add open question", hint: "Unresolved item" },
  { id: "observation", label: "Add observation", hint: "Attributed internal input" },
];

export function AddToRecordWorkbench({
  issueId,
  issueRoutePrefix,
  captureNotesAiEnabled = false,
}: {
  issueId: string;
  issueRoutePrefix: string;
  captureNotesAiEnabled?: boolean;
}) {
  const [mode, setMode] = useState<AddToRecordMode>("free-text");

  return (
    <section
      id="add-to-record"
      className="scroll-mt-28 overflow-hidden rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]"
    >
      <div className="border-b border-[--metis-outline-subtle] px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[--metis-brass-soft]">Add to issue record</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[--metis-paper-muted]">
          Choose how you want to add material. Unstructured paste, or add directly to a register. Specialist pages remain for review and
          linking.
        </p>
      </div>

      <div
        className="border-b border-[--metis-outline-subtle] px-3 py-3 sm:px-4"
        role="tablist"
        aria-label="Add to issue record"
      >
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const selected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60",
                  selected
                    ? "border-[--metis-brass]/45 bg-[color-mix(in_oklab,var(--metis-brass)_14%,transparent)] text-[--metis-paper]"
                    : "border-transparent bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] text-[--metis-paper-muted] hover:border-[--metis-outline-subtle] hover:text-[--metis-paper]",
                )}
              >
                <span className="block text-[0.72rem] font-medium leading-tight">{m.label}</span>
                <span className="mt-0.5 block text-[0.62rem] leading-snug text-[--metis-text-tertiary]">{m.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="min-h-0">
        {mode === "free-text" ? (
          <CaptureNotesForm
            issueId={issueId}
            issueRoutePrefix={issueRoutePrefix}
            captureNotesAiEnabled={captureNotesAiEnabled}
            embedded
          />
        ) : null}
        {mode === "source" ? <InputSourceIntakeForm issueId={issueId} issueRoutePrefix={issueRoutePrefix} /> : null}
        {mode === "claim" ? <InputClaimIntakeForm issueId={issueId} issueRoutePrefix={issueRoutePrefix} /> : null}
        {mode === "gap" ? <InputGapIntakeForm issueId={issueId} issueRoutePrefix={issueRoutePrefix} /> : null}
        {mode === "observation" ? (
          <InputObservationIntakeForm issueId={issueId} issueRoutePrefix={issueRoutePrefix} />
        ) : null}
      </div>
    </section>
  );
}
