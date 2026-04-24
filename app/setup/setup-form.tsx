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

export function SetupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedFactsPasteError, setConfirmedFactsPasteError] = useState<string | null>(null);
  const [contextPasteError, setContextPasteError] = useState<string | null>(null);

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
  }, [audience, confirmedFacts, context, issueType, openQuestions, operatorPosture, ownerName, priority, severity, summary, title]);

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

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Issue title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="European customer portal outage"
            className="h-12 rounded-[1.15rem] border-white/12 bg-[rgba(255,255,255,0.065)] text-[--metis-paper]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Issue type</label>
          <Input
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            placeholder="Cyber incident"
            className="h-12 rounded-[1.15rem] border-white/12 bg-[rgba(255,255,255,0.065)] text-[--metis-paper]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Audience</label>
          <Input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="CEO, COO, GC"
            className="h-12 rounded-[1.15rem] border-white/12 bg-[rgba(255,255,255,0.065)] text-[--metis-paper]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Urgency</label>
          <div className="relative">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IssuePriority)}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-white/12 bg-[rgba(255,255,255,0.065)] px-3 text-sm text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
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
            className="min-h-[148px] rounded-[1.25rem] border-white/12 bg-[rgba(255,255,255,0.065)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-[--metis-paper]">Severity</label>
          <div className="relative">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-white/12 bg-[rgba(255,255,255,0.065)] px-3 text-sm text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
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
              onChange={(e) => setOperatorPosture(e.target.value as OperatorPosture)}
              className="h-12 w-full appearance-none rounded-[1.15rem] border border-white/12 bg-[rgba(255,255,255,0.065)] px-3 text-sm text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
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
            className="h-12 rounded-[1.15rem] border-white/12 bg-[rgba(255,255,255,0.065)] text-[--metis-paper]"
          />
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Confirmed facts</p>
            <Button
              type="button"
              onClick={onPasteConfirmedFacts}
              variant="outline"
              className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
            >
              Paste
            </Button>
          </div>
          <Textarea
            value={confirmedFacts}
            onChange={(e) => setConfirmedFacts(e.target.value)}
            placeholder="What we are confident is true right now…"
            className="min-h-[172px] rounded-[1.2rem] border-white/12 bg-[rgba(255,255,255,0.055)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
          />
          {confirmedFactsPasteError ? (
            <div className="rounded-md border border-rose-400/20 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
              {confirmedFactsPasteError}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Open questions</p>
          <Textarea
            value={openQuestions}
            onChange={(e) => setOpenQuestions(e.target.value)}
            placeholder="What we still need to confirm…"
            className="min-h-[172px] rounded-[1.2rem] border-white/12 bg-[rgba(255,255,255,0.055)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
          />
        </div>

        <div className="space-y-3 border-t border-white/8 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Context</p>
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
            className="min-h-[154px] rounded-[1.2rem] border-white/12 bg-[rgba(255,255,255,0.055)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
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
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]"
        >
          {submitting ? "Creating issue..." : "Create issue & open brief"}
        </Button>
      </div>
    </div>
  );
}

