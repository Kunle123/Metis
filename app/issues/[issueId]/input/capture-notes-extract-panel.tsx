"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  CaptureNotesExtractResponseSchema,
  type CaptureNotesExtractResponse,
  type FollowUpActionExtract,
  type SuggestedObservationExtract,
  type SuggestedOpenQuestionExtract,
  type SuggestedSourceExtract,
} from "@metis/shared/captureNotesExtract";

/** Keep in sync with `MIN_CAPTURE_NOTES_CHARS` in `@/lib/ai/extractIssueNotes`. */
const MIN_NOTES_FOR_EXTRACT = 48;

function withKeys<T>(items: T[]): Array<T & { key: string }> {
  return items.map((item) => ({ ...item, key: crypto.randomUUID() }));
}

function extractErrorMessage(res: Response, body: unknown): string {
  if (typeof body === "object" && body !== null && "error" in body) {
    const e = (body as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e.trim();
  }
  if (res.status === 404) return "Structured suggestions are not available in this environment.";
  if (res.status === 503) return "Suggestion assist is temporarily unavailable. Try again later.";
  if (res.status === 502) return "Suggestion assist returned an error. Try again later.";
  return `Request failed (${res.status}).`;
}

type ItemError = { key: string; message: string } | null;

export function CaptureNotesExtractPanel({
  issueId,
  rawNotes,
  meetingLabel,
}: {
  issueId: string;
  rawNotes: string;
  meetingLabel: string;
}) {
  const router = useRouter();
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [limitations, setLimitations] = useState<string | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Array<SuggestedOpenQuestionExtract & { key: string }>>([]);
  const [sources, setSources] = useState<Array<SuggestedSourceExtract & { key: string }>>([]);
  const [observations, setObservations] = useState<Array<SuggestedObservationExtract & { key: string }>>([]);
  const [followUps, setFollowUps] = useState<Array<FollowUpActionExtract & { key: string }>>([]);
  const [itemError, setItemError] = useState<ItemError>(null);
  const [acceptingKey, setAcceptingKey] = useState<string | null>(null);

  const trimmed = rawNotes.trim();
  const canRequest = trimmed.length >= MIN_NOTES_FOR_EXTRACT && !extracting;
  const meetingTrimmed = meetingLabel.trim();
  const timestampForCreates = meetingTrimmed.length ? meetingTrimmed : null;

  const runExtract = useCallback(async () => {
    setExtractError(null);
    setItemError(null);
    setLimitations(null);
    if (trimmed.length < MIN_NOTES_FOR_EXTRACT) {
      setExtractError(`Paste at least ${MIN_NOTES_FOR_EXTRACT} characters of notes before requesting suggestions.`);
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/capture-notes/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rawNotes: trimmed,
          meetingLabel: meetingTrimmed.length ? meetingTrimmed : null,
        }),
      });

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        setOpenQuestions([]);
        setSources([]);
        setObservations([]);
        setFollowUps([]);
        setLimitations(null);
        setExtractError(extractErrorMessage(res, json));
        return;
      }

      const parsed = CaptureNotesExtractResponseSchema.safeParse(json);
      if (!parsed.success) {
        setOpenQuestions([]);
        setSources([]);
        setObservations([]);
        setFollowUps([]);
        setLimitations(null);
        setExtractError("Could not read suggestions from the server. Try again.");
        return;
      }

      const data: CaptureNotesExtractResponse = parsed.data;
      setLimitations(data.limitations);
      setOpenQuestions(withKeys(data.suggestedOpenQuestions));
      setSources(withKeys(data.suggestedSources));
      setObservations(withKeys(data.suggestedObservations));
      setFollowUps(withKeys(data.followUpActions));
    } catch {
      setExtractError("Could not reach suggestion assist. Check your connection and try again.");
    } finally {
      setExtracting(false);
    }
  }, [issueId, trimmed, meetingTrimmed]);

  async function acceptOpenQuestion(row: SuggestedOpenQuestionExtract & { key: string }) {
    setItemError(null);
    setAcceptingKey(row.key);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: row.title,
          whyItMatters: row.whyItMatters,
          stakeholder: row.stakeholder,
          prompt: row.prompt,
          severity: row.severity,
          linkedSection: row.linkedSection,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed (${res.status})`);
      }
      setOpenQuestions((cur) => cur.filter((r) => r.key !== row.key));
      router.refresh();
    } catch (e) {
      setItemError({ key: row.key, message: e instanceof Error ? e.message : "Could not create open question." });
    } finally {
      setAcceptingKey(null);
    }
  }

  async function acceptSource(row: SuggestedSourceExtract & { key: string }) {
    setItemError(null);
    setAcceptingKey(row.key);
    try {
      const res = await fetch(`/api/issues/${issueId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier: row.suggestedTier,
          title: row.title,
          note: row.note,
          snippet: row.snippet,
          url: row.url,
          linkedSection: row.linkedSection,
          timestampLabel: timestampForCreates,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed (${res.status})`);
      }
      setSources((cur) => cur.filter((r) => r.key !== row.key));
      router.refresh();
    } catch (e) {
      setItemError({ key: row.key, message: e instanceof Error ? e.message : "Could not create source." });
    } finally {
      setAcceptingKey(null);
    }
  }

  async function acceptObservation(row: SuggestedObservationExtract & { key: string }) {
    setItemError(null);
    setAcceptingKey(row.key);
    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: row.role,
          name: row.name,
          response: row.response,
          confidence: row.confidence,
          linkedSection: row.linkedSection,
          visibility: "Internal",
          excludedFromBrief: true,
          timestampLabel: timestampForCreates,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed (${res.status})`);
      }
      setObservations((cur) => cur.filter((r) => r.key !== row.key));
      router.refresh();
    } catch (e) {
      setItemError({ key: row.key, message: e instanceof Error ? e.message : "Could not create observation." });
    } finally {
      setAcceptingKey(null);
    }
  }

  const hasSuggestions =
    openQuestions.length > 0 || sources.length > 0 || observations.length > 0 || followUps.length > 0;

  return (
    <div className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-5 sm:py-5">
      <div className="rounded-lg border border-[--metis-info-border]/50 bg-[rgba(28,42,58,0.2)] px-3 py-2.5 text-xs leading-relaxed text-[--metis-paper-muted]">
        <strong className="font-medium text-[--metis-paper]">Unverified suggestions.</strong> The model proposes items from
        your notes; it does not validate facts or treat anything as confirmed evidence. Nothing is saved to the issue until you
        accept a suggestion or use Save notes.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-4"
          disabled={!canRequest}
          onClick={() => void runExtract()}
        >
          {extracting ? "Working…" : "Suggest structured updates"}
        </Button>
        {!canRequest && trimmed.length > 0 ? (
          <span className="text-xs text-[--metis-paper-muted]">At least {MIN_NOTES_FOR_EXTRACT} characters required.</span>
        ) : null}
      </div>

      {extractError ? (
        <p className="text-sm text-amber-100/90" role="status">
          {extractError}
        </p>
      ) : null}

      {limitations ? <p className="text-xs leading-relaxed text-[--metis-paper-muted]">{limitations}</p> : null}

      {hasSuggestions ? (
        <div className="space-y-4">
          {openQuestions.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                Suggested open questions
              </p>
              <ul className="space-y-2">
                {openQuestions.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-amber-100/75">Open question</span>
                      <span className="rounded-full border border-amber-200/20 bg-amber-950/30 px-2 py-0.5 text-[0.65rem] text-amber-50/95">
                        Needs review
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-[--metis-paper]">{row.title}</p>
                    <p className="mt-1 text-xs text-[--metis-paper-muted]">{row.prompt}</p>
                    <dl className="mt-2 grid gap-1 text-xs text-[--metis-paper-muted] sm:grid-cols-2">
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Impact</dt>
                        <dd className="text-[--metis-paper-muted]">{row.whyItMatters}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Stakeholder</dt>
                        <dd className="text-[--metis-paper-muted]">{row.stakeholder}</dd>
                      </div>
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Severity</dt>
                        <dd>{row.severity}</dd>
                      </div>
                      {row.linkedSection ? (
                        <div>
                          <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Relates to</dt>
                          <dd>{row.linkedSection}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <div className="mt-2 rounded-lg border border-white/8 bg-black/30 px-2 py-1.5">
                      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Notes excerpt</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-white/75">{row.verbatimExcerpt}</p>
                    </div>
                    {itemError?.key === row.key ? <p className="mt-2 text-xs text-rose-200">{itemError.message}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={acceptingKey === row.key}
                        onClick={() => void acceptOpenQuestion(row)}
                      >
                        {acceptingKey === row.key ? "Saving…" : "Accept"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemError((e) => (e?.key === row.key ? null : e));
                          setOpenQuestions((c) => c.filter((r) => r.key !== row.key));
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sources.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Suggested sources</p>
              <ul className="space-y-2">
                {sources.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-brass-soft]/90">Source (not verified)</span>
                      <span className="rounded-full border border-amber-200/20 bg-amber-950/30 px-2 py-0.5 text-[0.65rem] text-amber-50/95">
                        Needs review
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium text-[--metis-paper]">{row.title}</p>
                    <p className="mt-1 text-xs text-[--metis-paper-muted]">{row.note}</p>
                    <dl className="mt-2 grid gap-1 text-xs text-[--metis-paper-muted] sm:grid-cols-2">
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Tier</dt>
                        <dd>{row.suggestedTier}</dd>
                      </div>
                      {row.url ? (
                        <div className="min-w-0 sm:col-span-2">
                          <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">URL (from notes)</dt>
                          <dd className="truncate font-mono text-[0.7rem]">{row.url}</dd>
                        </div>
                      ) : null}
                      {row.linkedSection ? (
                        <div>
                          <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Relates to</dt>
                          <dd>{row.linkedSection}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {row.snippet ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-white/70">
                        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Snippet · </span>
                        {row.snippet}
                      </p>
                    ) : null}
                    <div className="mt-2 rounded-lg border border-white/8 bg-black/30 px-2 py-1.5">
                      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Notes excerpt</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-white/75">{row.verbatimExcerpt}</p>
                    </div>
                    {itemError?.key === row.key ? <p className="mt-2 text-xs text-rose-200">{itemError.message}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={acceptingKey === row.key} onClick={() => void acceptSource(row)}>
                        {acceptingKey === row.key ? "Saving…" : "Accept"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemError((e) => (e?.key === row.key ? null : e));
                          setSources((c) => c.filter((r) => r.key !== row.key));
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {observations.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Suggested observations</p>
              <ul className="space-y-2">
                {observations.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.12em] text-white/55">Observation</span>
                      <span className="rounded-full border border-amber-200/20 bg-amber-950/30 px-2 py-0.5 text-[0.65rem] text-amber-50/95">
                        Needs review
                      </span>
                    </div>
                    <p className="mt-1.5 text-[--metis-paper]">
                      <span className="font-medium">{row.role}</span> · {row.name}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-[--metis-paper-muted]">{row.response}</p>
                    <dl className="mt-2 grid gap-1 text-xs text-[--metis-paper-muted] sm:grid-cols-2">
                      <div>
                        <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Confidence</dt>
                        <dd>{row.confidence}</dd>
                      </div>
                      {row.linkedSection ? (
                        <div>
                          <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Linked section</dt>
                          <dd>{row.linkedSection}</dd>
                        </div>
                      ) : null}
                    </dl>
                    <div className="mt-2 rounded-lg border border-white/8 bg-black/30 px-2 py-1.5">
                      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[--metis-ink-soft]">Notes excerpt</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-white/75">{row.verbatimExcerpt}</p>
                    </div>
                    <p className="mt-2 text-[0.65rem] text-[--metis-paper-muted]">
                      Accepts as internal observation, excluded from briefs until you change it.
                    </p>
                    {itemError?.key === row.key ? <p className="mt-2 text-xs text-rose-200">{itemError.message}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={acceptingKey === row.key}
                        onClick={() => void acceptObservation(row)}
                      >
                        {acceptingKey === row.key ? "Saving…" : "Accept"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemError((e) => (e?.key === row.key ? null : e));
                          setObservations((c) => c.filter((r) => r.key !== row.key));
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {followUps.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Follow-up ideas (review only)</p>
              <p className="text-xs text-[--metis-paper-muted]">These are not saved automatically. Create a record manually if you agree.</p>
              <ul className="space-y-2">
                {followUps.map((row) => (
                  <li
                    key={row.key}
                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-[--metis-paper-muted]"
                  >
                    <p className="font-medium text-[--metis-paper]">{row.label}</p>
                    {row.rationale ? <p className="mt-1">{row.rationale}</p> : null}
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">
                      Suggested focus · {row.suggestedTarget.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-white/60">{row.verbatimExcerpt}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
