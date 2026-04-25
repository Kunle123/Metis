"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";

type IssuePriority = "Critical" | "High" | "Normal" | "Low";
type OperatorPosture = "Monitoring" | "Active" | "Holding" | "Closed";

const priorities: readonly IssuePriority[] = ["Critical", "High", "Normal", "Low"] as const;
const postures: readonly OperatorPosture[] = ["Monitoring", "Active", "Holding", "Closed"] as const;
const severities = ["Critical", "High", "Moderate", "Low"] as const;

type StructureSuggestions = {
  title: string | null;
  issueType: string | null;
  summary: string | null;
  confirmedFacts: string | null;
  openQuestions: string | null;
  context: string | null;
  audience: string | null;
  ownerName: string | null;
  severity: (typeof severities)[number] | null;
  priority: IssuePriority | null;
  operatorPosture: OperatorPosture | null;
  needsMore: string[];
  limitations: string;
};

type StructureResponse = {
  ok: true;
  suggestions: StructureSuggestions;
  needsMore: string[];
  limitations: string;
};

export function SetupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedFactsPasteError, setConfirmedFactsPasteError] = useState<string | null>(null);
  const [contextPasteError, setContextPasteError] = useState<string | null>(null);

  const [intakeRawNotes, setIntakeRawNotes] = useState("");
  const [structLoading, setStructLoading] = useState(false);
  const [structError, setStructError] = useState<string | null>(null);
  const [structureResponse, setStructureResponse] = useState<StructureResponse | null>(null);

  const [userTouchedPriority, setUserTouchedPriority] = useState(false);
  const [userTouchedSeverity, setUserTouchedSeverity] = useState(false);
  const [userTouchedPosture, setUserTouchedPosture] = useState(false);

  const [title, setTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [audience, setAudience] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("Normal");
  const [summary, setSummary] = useState("");
  const [confirmedFacts, setConfirmedFacts] = useState("");
  const [openQuestions, setOpenQuestions] = useState("");
  const [context, setContext] = useState("");
  const [severity, setSeverity] = useState<(typeof severities)[number]>("High");
  const [operatorPosture, setOperatorPosture] = useState<OperatorPosture>("Monitoring");
  const [ownerName, setOwnerName] = useState("");

  const isDirty = useMemo(() => {
    const hasText =
      intakeRawNotes.trim().length > 0 ||
      title.trim().length > 0 ||
      issueType.trim().length > 0 ||
      audience.trim().length > 0 ||
      summary.trim().length > 0 ||
      confirmedFacts.trim().length > 0 ||
      openQuestions.trim().length > 0 ||
      context.trim().length > 0 ||
      ownerName.trim().length > 0;
    const hasSelectionChange = priority !== "Normal" || severity !== "High" || operatorPosture !== "Monitoring";
    return hasText || hasSelectionChange;
  }, [audience, confirmedFacts, context, intakeRawNotes, issueType, openQuestions, operatorPosture, ownerName, priority, severity, summary, title]);

  useUnsavedChangesWarning({ isDirty, isSaving: submitting });

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && issueType.trim().length > 0 && summary.trim().length > 0 && severity.trim().length > 0;
  }, [title, issueType, summary, severity]);

  async function onSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          issueType: issueType.trim(),
          audience: audience.trim().length ? audience.trim() : null,
          priority,
          summary: summary.trim(),
          confirmedFacts: confirmedFacts.trim().length ? confirmedFacts.trim() : null,
          openQuestions: openQuestions.trim().length ? openQuestions.trim() : null,
          context: context.trim().length ? context.trim() : null,
          severity,
          operatorPosture,
          ownerName: ownerName.trim().length ? ownerName.trim() : null,
          status: "Ready to brief",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text.length ? text : `Request failed (${res.status})`);
        return;
      }

      const created = await res.json();
      const issueId = created?.id as string | undefined;
      if (!issueId) {
        setError("Issue created but response was missing id.");
        return;
      }

      router.push(`/issues/${issueId}/brief?mode=full`);
    } catch (e: any) {
      setError(e?.message ?? "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onPasteContext() {
    setContextPasteError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
        setContextPasteError("Clipboard paste is not available in this browser.");
        return;
      }
      const text = await navigator.clipboard.readText();
      const next = context.trim().length ? `${context}\n\n${text}` : text;
      setContext(next);
    } catch {
      setContextPasteError("Clipboard access was denied.");
    }
  }

  async function onPasteConfirmedFacts() {
    setConfirmedFactsPasteError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
        setConfirmedFactsPasteError("Clipboard paste is not available in this browser.");
        return;
      }
      const text = await navigator.clipboard.readText();
      const next = confirmedFacts.trim().length ? `${confirmedFacts}\n\n${text}` : text;
      setConfirmedFacts(next);
    } catch {
      setConfirmedFactsPasteError("Clipboard access was denied.");
    }
  }

  async function onStructureWithAI() {
    const raw = intakeRawNotes.trim();
    if (!raw.length) return;
    setStructLoading(true);
    setStructError(null);
    setStructureResponse(null);
    try {
      const res = await fetch("/api/setup/structure-notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rawNotes: raw }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStructError(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      if (data && typeof data === "object" && (data as StructureResponse).ok) {
        setStructureResponse(data as StructureResponse);
      } else {
        setStructError("Unexpected response from AI assist.");
      }
    } catch (e: unknown) {
      setStructError((e as Error)?.message ?? "Request failed.");
    } finally {
      setStructLoading(false);
    }
  }

  function applyToEmptyOnly() {
    if (!structureResponse) return;
    const s = structureResponse.suggestions;
    if (!title.trim() && s.title) setTitle(s.title);
    if (!issueType.trim() && s.issueType) setIssueType(s.issueType);
    if (!audience.trim() && s.audience) setAudience(s.audience);
    if (!summary.trim() && s.summary) setSummary(s.summary);
    if (!confirmedFacts.trim() && s.confirmedFacts) setConfirmedFacts(s.confirmedFacts);
    if (!openQuestions.trim() && s.openQuestions) setOpenQuestions(s.openQuestions);
    if (!context.trim() && s.context) setContext(s.context);
    if (!ownerName.trim() && s.ownerName) setOwnerName(s.ownerName);
    if (!userTouchedPriority && s.priority) setPriority(s.priority);
    if (!userTouchedSeverity && s.severity) setSeverity(s.severity);
    if (!userTouchedPosture && s.operatorPosture) setOperatorPosture(s.operatorPosture);
  }

  function onClearStructurePreview() {
    setStructureResponse(null);
    setStructError(null);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm leading-6 text-[--metis-paper-muted]">Fields marked (optional) can be left blank.</p>

      <div className="space-y-4">
        <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">AI assist</p>
        <p className="text-sm leading-6 text-[--metis-paper-muted]">
          Paste rough notes. This suggests fields for you to review. It does not create the issue or submit the form.
        </p>
        <Textarea
          value={intakeRawNotes}
          onChange={(e) => setIntakeRawNotes(e.target.value)}
          placeholder="Paste messy situation notes, fragments, or bullets…"
          className="min-h-[120px] rounded-[1.2rem] px-4 py-4 text-sm leading-7"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={onStructureWithAI}
            disabled={structLoading || !intakeRawNotes.trim().length}
            className="rounded-full px-5"
          >
            {structLoading ? "Structuring…" : "Structure with AI"}
          </Button>
          <Button
            type="button"
            onClick={() => setIntakeRawNotes("")}
            variant="outline"
            className="h-10 rounded-full px-4"
            disabled={structLoading || !intakeRawNotes.length}
          >
            Clear
          </Button>
        </div>
        {structError ? (
          <div
            className="mt-4 rounded-md border border-rose-400/20 bg-rose-900/20 px-3 py-2 text-sm text-rose-100"
            role="alert"
          >
            {structError}
          </div>
        ) : null}
        {structureResponse ? (
          <div className="space-y-5 border-t border-white/8 pt-5">
            <div>
              <p className="text-sm font-medium text-[--metis-paper]">AI suggestions</p>
              <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                Review before applying. Existing fields won’t be overwritten.
              </p>
              <p className="mt-1 text-xs text-[--metis-paper-muted]">Suggestions may be incomplete or uncertain.</p>
            </div>

            <div className="space-y-4 pl-1">
              {[
                { label: "Suggested title", v: structureResponse.suggestions.title },
                { label: "Suggested issue type", v: structureResponse.suggestions.issueType },
                { label: "Suggested working line", v: structureResponse.suggestions.summary },
                { label: "Suggested audience", v: structureResponse.suggestions.audience },
                { label: "Suggested confirmed facts", v: structureResponse.suggestions.confirmedFacts },
                { label: "Suggested open questions", v: structureResponse.suggestions.openQuestions },
                { label: "Suggested context", v: structureResponse.suggestions.context },
                { label: "Suggested owner", v: structureResponse.suggestions.ownerName },
                { label: "Suggested severity", v: structureResponse.suggestions.severity },
                { label: "Suggested urgency", v: structureResponse.suggestions.priority },
                { label: "Suggested operator posture", v: structureResponse.suggestions.operatorPosture },
              ].map(({ label, v }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">{label}</p>
                  <p className="text-sm leading-6 text-[--metis-paper] whitespace-pre-wrap">{v ? String(v) : "—"}</p>
                </div>
              ))}
            </div>

            {structureResponse.needsMore.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Needs more information</p>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-[--metis-paper-muted]">
                  {structureResponse.needsMore.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {structureResponse.limitations ? (
              <p className="text-sm leading-6 text-[--metis-paper-muted]">{structureResponse.limitations}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={applyToEmptyOnly} variant="outline" className="h-9 rounded-full px-4">
                Apply to empty fields
              </Button>
              <Button
                type="button"
                onClick={onClearStructurePreview}
                variant="outline"
                className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
              >
                Clear suggestions
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Issue title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="European customer portal outage"
            className="h-12 rounded-[1.15rem]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Issue type</label>
          <Input
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            placeholder="Cyber incident"
            className="h-12 rounded-[1.15rem]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Audience (optional)</label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="CEO, COO, GC"
            className="h-12 rounded-[1.15rem]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Urgency</label>
          <div className="relative">
            <select
              value={priority}
              onChange={(e) => {
                setUserTouchedPriority(true);
                setPriority(e.target.value as IssuePriority);
              }}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Working line</label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Customer self-service remains degraded while security containment is verified…"
            className="min-h-[148px] rounded-[1.25rem] px-4 py-4 text-sm leading-7"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Severity</label>
          <div className="relative">
            <select
              value={severity}
              onChange={(e) => {
                setUserTouchedSeverity(true);
                setSeverity(e.target.value as (typeof severities)[number]);
              }}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Operator posture (optional)</label>
          <div className="relative">
            <select
              value={operatorPosture}
              onChange={(e) => {
                setUserTouchedPosture(true);
                setOperatorPosture(e.target.value as OperatorPosture);
              }}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {postures.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Owner (optional)</label>
          <Input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Amina Shah"
            className="h-12 rounded-[1.15rem]"
          />
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Confirmed facts (optional)</p>
            <Button
              type="button"
              onClick={onPasteConfirmedFacts}
              variant="outline"
              className="h-9 rounded-full px-4"
            >
              Paste
            </Button>
          </div>
          <Textarea
            value={confirmedFacts}
            onChange={(e) => setConfirmedFacts(e.target.value)}
            placeholder="What we are confident is true right now…"
            className="min-h-[172px] rounded-[1.2rem] px-4 py-4 text-sm leading-7"
          />
          {confirmedFactsPasteError ? (
            <div className="rounded-md border border-rose-400/20 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
              {confirmedFactsPasteError}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Open questions (optional)</p>
          <Textarea
            value={openQuestions}
            onChange={(e) => setOpenQuestions(e.target.value)}
            placeholder="What we still need to confirm…"
            className="min-h-[172px] rounded-[1.2rem] px-4 py-4 text-sm leading-7"
          />
        </div>

        <div className="space-y-3 border-t border-white/8 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Context (optional)</p>
            <Button
              type="button"
              onClick={onPasteContext}
              variant="outline"
              className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
            >
              Paste
            </Button>
          </div>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Additional context leaders need…"
            className="min-h-[154px] rounded-[1.2rem] px-4 py-4 text-sm leading-7"
          />
          {contextPasteError ? (
            <div className="rounded-md border border-rose-400/20 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">{contextPasteError}</div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.2rem] border border-rose-400/20 bg-rose-900/20 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {!canSubmit && !submitting ? (
          <p className="text-sm leading-6 text-[--metis-paper-muted]">Complete required fields to continue.</p>
        ) : null}
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="rounded-full px-5"
        >
          {submitting ? "Creating issue..." : "Create issue & open brief"}
        </Button>
      </div>
    </div>
  );
}

