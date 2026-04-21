# Component Map

This component map identifies the shared Metis patterns that anchor the current design direction. It should be used to keep repeated interface structures aligned as implementation continues.

| Component | Where it appears | What it must preserve | What should not drift |
| --- | --- | --- | --- |
| **Shell / navigation** | Shared across the main Metis workspace through `/design/manus-ui/components/MetisShell.tsx`; visible on Dashboard, Setup, Brief, Sources, Gaps, Input, Compare, and Export | Preserve the calm internal-workspace framing, grouped navigation structure, and unmistakable active-state orientation without overpowering the main work surface. | Do not turn navigation into a marketing header, expand it into heavy app chrome, or weaken the active-state clarity. |
| **Compact issue context bar** | Shared deep-screen header treatment in `MetisShell.tsx`, especially on Setup, Brief, Sources, Gaps, Input, Compare, and Export | Preserve one compact issue context bar that carries issue title, critical context, and readiness cues in a reduced form. | Do not duplicate it with extra top snapshots, repeated issue bars, or extra page-meta rows. |
| **Page header** | Each screen-specific top title area in the page files under `/design/manus-ui/pages/` | Preserve one clear page title with reduced eyebrow and support-label density. | Do not reintroduce duplicate framing titles, stacked labels, or explanatory prototype language. |
| **Readiness / status chips** | Dashboard summary states, brief metadata, compare circulation context, export checks, and supporting screen rails | Preserve compact, legible states for readiness, review, blocked, validation, and related operational conditions. | Do not enlarge them into dominant hero elements or add inconsistent status vocabulary across screens. |
| **Source card** | Sources page and brief appendix references | Preserve source title, short abstract or snippet, linked sections, tier or confidence cues, and readable evidence context. | Do not add redundant top labels, over-frame metadata, or drift toward a generalized research card design. |
| **Gap card** | Gaps page | Preserve what is missing, why it matters, affected section, suggested role, drafted question, and clear status/action affordances. | Do not drift into a task-management card, sprint card, or workflow ticket metaphor. |
| **Internal input card** | Input page | Preserve structured stakeholder input, linked section context, confidence or visibility context where already present, and a lighter supporting hierarchy. | Do not turn it into chat bubbles, notes-app cards, or automation-heavy workflow items. |
| **Compare delta block** | Compare page | Preserve grouped deltas for new facts, changed assumptions, resolved uncertainties, changed recommendations, and circulation movement. | Do not collapse it into raw diff noise or add redundant `document delta` framing. |
| **Export package card** | Export page | Preserve the circulation package selection model, preview relationship, and validation-aware checks that gate release readiness. | Do not redesign it into a generic download card or separate it from circulation readiness context. |

## Notes

The components above are interdependent. The shell and context bar set the overall chrome level, while the cards and delta blocks define how evidence, change, and circulation are presented. Preserving the current Metis direction means keeping those relationships stable rather than optimizing each component in isolation.
