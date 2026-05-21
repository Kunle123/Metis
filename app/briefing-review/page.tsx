import type { Metadata } from "next";

import { BriefingReviewForm } from "./briefing-review-form";

export const metadata: Metadata = {
  title: "Briefing Readiness Review | Metis",
  description:
    "Request a Metis Briefing Readiness Review for executive-facing communications, live issues, and stakeholder messaging.",
};

const readinessChecks = [
  "Executive question clearly separated from background noise",
  "Knowns, unknowns, and decisions visible in one place",
  "Stakeholder messages aligned before they fragment",
  "Tone guardrails explicit enough for legal, leadership, and comms",
];

export default function BriefingReviewPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--metis-brass)_18%,transparent),transparent_34%),linear-gradient(135deg,var(--metis-frame)_0%,var(--metis-frame-soft)_52%,#07090a_100%)] text-[--metis-paper]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <a href="/" className="font-[Cormorant_Garamond] text-2xl font-semibold tracking-wide text-[--metis-paper]">
            Metis
          </a>
          <span className="rounded-full border border-[--metis-brass]/35 bg-[--metis-brass]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">
            Briefing Readiness Review
          </span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[--metis-brass-soft]">
              For comms and corporate affairs teams
            </p>
            <h1 className="mt-5 font-[Cormorant_Garamond] text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-[--metis-paper] sm:text-6xl lg:text-7xl">
              Turn a live issue into an executive-ready brief.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[--metis-paper-muted]">
              If your team is pulling inputs from emails, Teams threads, media monitoring, legal comments, and leadership asks, Metis helps structure the work into the brief leaders actually need: what changed, what matters, what is unresolved, and what to say next.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {readinessChecks.map((item) => (
                <div
                  key={item}
                  className="rounded-[1rem] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
                >
                  <div className="mb-3 h-1.5 w-10 rounded-full bg-[--metis-brass]" />
                  <p className="text-sm leading-relaxed text-[--metis-paper-muted]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.35rem] border border-[--metis-info-border] bg-[--metis-info-bg] p-5 text-sm leading-relaxed text-[--metis-paper]">
              <strong className="text-[--metis-paper]">What happens after you submit?</strong> The request gives the Metis team enough context to review the briefing challenge and follow up with a focused conversation about whether a briefing workflow review is useful for your situation.
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/12 bg-[color-mix(in_oklab,var(--metis-surface-card)_82%,black)] p-5 shadow-[0_30px_90px_rgb(0_0_0_/_0.36)] sm:p-7">
            <div className="mb-6 rounded-[1.4rem] border border-[--metis-brass]/25 bg-[--metis-brass]/8 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--metis-brass-soft]">Signup form</p>
              <h2 className="mt-2 font-[Cormorant_Garamond] text-3xl font-semibold text-[--metis-paper]">
                Request your briefing review
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[--metis-paper-muted]">
                Share a little context and we will route the request to the right next step.
              </p>
            </div>
            <BriefingReviewForm />
          </aside>
        </section>
      </div>
    </main>
  );
}
