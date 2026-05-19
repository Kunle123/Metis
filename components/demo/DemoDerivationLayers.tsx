"use client";

import { useState } from "react";

import type { DemoAiEnhancedDraft, DemoRecordBasisLine, DemoRecordGroundedDraft } from "@/lib/demo/towerBriefingDemo";
import { cn } from "@/lib/utils";

export function DemoCredibilityNote() {
  return (
    <p className="max-w-prose rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_50%,transparent)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
      For credibility, this demo shows the deterministic record-grounded draft before any AI-enhanced wording. Metis can assist
      with wording, but the issue record governs what can be said.
    </p>
  );
}

function RecordCodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-[color-mix(in_oklab,var(--metis-outline-subtle)_90%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_40%,transparent)] px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide text-[--metis-text-tertiary]">
      {code}
    </span>
  );
}

export function RecordBasisTable({ basis }: { basis: DemoRecordBasisLine[] }) {
  if (!basis.length) return null;
  return (
    <div className="mt-3 space-y-2 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-3">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Basis by line</p>
      <ul className="space-y-2.5">
        {basis.map((row) => (
          <li key={`${row.line}-${row.basisCodes.join(",")}`} className="space-y-1">
            <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{row.line}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {row.basisCodes.map((code) => (
                <RecordCodeChip key={code} code={code} />
              ))}
            </div>
            <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">{row.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecordGroundedBlock({
  draft,
  subtitle = "Built from visible stage records",
}: {
  draft: DemoRecordGroundedDraft;
  subtitle?: string;
}) {
  return (
    <section className="rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] px-3 py-3 sm:px-4">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Record-grounded draft</p>
      <p className="mt-0.5 text-[0.68rem] text-[--metis-text-tertiary]">{subtitle}</p>
      {draft.title ? <p className="mt-2 text-[0.8125rem] font-medium text-[--metis-text-primary]">{draft.title}</p> : null}
      {draft.body ? (
        <p className="mt-2 whitespace-pre-line text-[0.8125rem] leading-[1.6] text-[--metis-text-secondary]">{draft.body}</p>
      ) : null}
      {draft.bullets?.length ? (
        <ul className="mt-2 space-y-1.5">
          {draft.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[--metis-text-tertiary]" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      <RecordBasisTable basis={draft.basis} />
    </section>
  );
}

export function AiEnhancedBlock({ draft, defaultOpen = true }: { draft: DemoAiEnhancedDraft; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-md border border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_75%,transparent)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sm:px-4"
      >
        <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-brass-soft]">{draft.label}</span>
        <span className="text-[0.68rem] text-[--metis-text-tertiary]">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="border-t border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] px-3 pb-3 pt-2 sm:px-4">
          <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">{draft.enhancementNote}</p>
          <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-[1.65] text-[--metis-text-primary]">{draft.body}</p>
        </div>
      ) : null}
    </section>
  );
}

export function UnsupportedRecordBlock({
  allowedToSay,
  notSupportedYet,
  guardrailsApplied,
}: {
  allowedToSay: string[];
  notSupportedYet: string[];
  guardrailsApplied: string[];
}) {
  return (
    <details className="rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)]">
      <summary className="cursor-pointer list-none px-3 py-2.5 text-[0.78rem] font-medium text-[--metis-text-secondary] marker:content-none [&::-webkit-details-marker]:hidden">
        What the record does not support yet
      </summary>
      <div className="space-y-3 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] px-3 py-3">
        {allowedToSay.length ? (
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[--metis-text-tertiary]">Allowed to say</p>
            <ul className="mt-1.5 space-y-1">
              {allowedToSay.map((line) => (
                <li key={line} className="text-[0.8125rem] text-[--metis-text-secondary]">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {notSupportedYet.length ? (
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[--metis-status-warning-fg]">Not supported yet</p>
            <ul className="mt-1.5 space-y-1">
              {notSupportedYet.map((line) => (
                <li key={line} className="text-[0.8125rem] text-[--metis-text-secondary]">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {guardrailsApplied.length ? (
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[--metis-text-tertiary]">Guardrails applied</p>
            <ul className="mt-1.5 space-y-1">
              {guardrailsApplied.map((line) => (
                <li key={line} className="text-[0.8125rem] text-[--metis-text-secondary]">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
