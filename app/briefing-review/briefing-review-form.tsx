"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SubmitState = "idle" | "submitting" | "success" | "error";

const issueTypes = [
  "Live issue or incident",
  "Upcoming announcement",
  "Board or executive update",
  "Reputational risk",
  "Operational disruption",
  "Other",
] as const;

type IssueType = (typeof issueTypes)[number];

type BriefingReviewFormState = {
  name: string;
  email: string;
  organisation: string;
  role: string;
  issueType: IssueType;
  briefingNeed: string;
  consent: boolean;
};

export function BriefingReviewForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<BriefingReviewFormState>({
    name: "",
    email: "",
    organisation: "",
    role: "",
    issueType: issueTypes[0],
    briefingNeed: "",
    consent: false,
  });

  const canSubmit = useMemo(() => {
    return Boolean(form.name.trim() && form.email.trim() && form.organisation.trim() && form.briefingNeed.trim() && form.consent);
  }, [form]);

  async function onSubmit() {
    if (state === "submitting" || !canSubmit) return;
    setState("submitting");
    setMessage(null);

    try {
      const res = await fetch("/api/briefing-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;

      if (!res.ok) {
        setState("error");
        setMessage(payload?.message ?? "We could not submit the request. Please check the form and try again.");
        return;
      }

      setState("success");
      setMessage(payload?.message ?? "Thank you. We have received your briefing review request.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We could not submit the request. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-950/25 p-6 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-100/70">Request received</p>
        <h2 className="mt-3 font-[Cormorant_Garamond] text-3xl text-[--metis-paper]">Your briefing review is queued.</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-50/82">
          {message} A member of the Metis team can use these details to understand the briefing pressure you are dealing with and follow up with a focused review.
        </p>
        <Button
          onClick={() => {
            setState("idle");
            setMessage(null);
          }}
          variant="outline"
          className="mt-6 rounded-full border-emerald-200/30 text-emerald-50 hover:bg-emerald-200/10"
        >
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="briefing-review-name" className="block text-sm font-medium text-[--metis-paper]">
            Name
          </label>
          <Input
            id="briefing-review-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            autoComplete="name"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="briefing-review-email" className="block text-sm font-medium text-[--metis-paper]">
            Work email
          </label>
          <Input
            id="briefing-review-email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            autoComplete="email"
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="briefing-review-organisation" className="block text-sm font-medium text-[--metis-paper]">
            Organisation
          </label>
          <Input
            id="briefing-review-organisation"
            value={form.organisation}
            onChange={(event) => setForm((current) => ({ ...current, organisation: event.target.value }))}
            autoComplete="organization"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="briefing-review-role" className="block text-sm font-medium text-[--metis-paper]">
            Role or team
          </label>
          <Input
            id="briefing-review-role"
            value={form.role}
            onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            autoComplete="organization-title"
            placeholder="Corporate affairs, comms, CEO office…"
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="briefing-review-issue-type" className="block text-sm font-medium text-[--metis-paper]">
          What are you briefing around?
        </label>
        <select
          id="briefing-review-issue-type"
          value={form.issueType}
          onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value as IssueType }))}
          className="h-11 w-full rounded-[--metis-control-radius-md] border border-[--metis-control-border] bg-[--metis-input-bg] px-3 text-sm text-[--metis-input-fg] shadow-[inset_0_1px_0_var(--metis-control-inset)] outline-none focus:border-[--metis-focus-ring] focus:ring-2 focus:ring-[--metis-focus-ring]/35"
        >
          {issueTypes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="briefing-review-need" className="block text-sm font-medium text-[--metis-paper]">
          What would make the next executive brief easier?
        </label>
        <Textarea
          id="briefing-review-need"
          value={form.briefingNeed}
          onChange={(event) => setForm((current) => ({ ...current, briefingNeed: event.target.value }))}
          placeholder="For example: too many inputs, unclear version control, different messages for board / staff / customers, tone sensitivity, unanswered legal questions…"
          className="min-h-32"
          required
        />
        <p className="text-xs leading-relaxed text-[--metis-text-tertiary]">
          Do not include confidential personal data. A short description of the briefing challenge is enough.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_34%,transparent)] p-4 text-sm leading-relaxed text-[--metis-paper-muted]">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
          className="mt-1 h-4 w-4 rounded border-[--metis-outline-subtle] accent-[--metis-brass]"
          required
        />
        <span>
          I agree to be contacted about a Metis Briefing Readiness Review and understand this request may be used to assess whether Metis is a fit for my team.
        </span>
      </label>

      {message && state === "error" ? (
        <div className="rounded-[1rem] border border-rose-400/25 bg-rose-950/30 px-4 py-3 text-sm leading-relaxed text-rose-50">
          {message}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={!canSubmit || state === "submitting"}
        className="w-full rounded-full bg-[--metis-brass] py-6 text-base font-semibold text-[--metis-dark] hover:bg-[--metis-brass-soft]"
      >
        {state === "submitting" ? "Submitting review request…" : "Request my briefing review"}
      </Button>
    </form>
  );
}
