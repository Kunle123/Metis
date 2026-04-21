# Metis Hardening Pass Report

## Summary

This pass hardened the Metis prototype from a well-designed workflow demo into a more credible **decision-support product UI**. The work focused on four goals: demoting dashboard-style chrome on deep-work screens, removing narrated prototype copy, propagating a shared readiness language, and upgrading the downstream workflow screens so they feel operationally useful rather than merely presentational.

## Shared readiness language

The following shared states now recur across the deep-work experience and mean the same thing wherever they appear.

| State | Intended meaning | Typical usage |
| --- | --- | --- |
| **Open gap** | Required information is still missing and weakens safe circulation. | Gap cards, section-level uncertainty |
| **Needs validation** | A claim or output exists, but evidence is not strong enough for wider use. | Evidence posture, exposure wording, board-note gating |
| **Source conflict** | External interpretation or weaker evidence is diverging from verified internal material. | Narrative and evidence-control states |
| **Updated since last version** | A meaningful movement has occurred in the current pass. | Input, compare, blocker movement |
| **Ready for review** | Suitable for internal leadership review, but not necessarily broad circulation. | Brief state, full brief, executive brief |
| **Ready to circulate** | Safe for the intended narrowly scoped audience. | Email-ready summary, stable sections |
| **Blocked** | Reserved for future use when a workflow cannot proceed at all. | Not yet broadly surfaced in UI |

## Screen changes

| Screen | Main change | Why it matters |
| --- | --- | --- |
| **Setup** | Reduced narration, tightened operator language, reinforced required vs optional structure, retained compact issue context only. | Makes the first-brief intake feel like a working product surface rather than onboarding copy. |
| **Sources** | Reframed as evidence control, clarified source tiers, exposed linked brief section and source state, surfaced readiness at section level. | Better supports defensible briefing language and evidence-weight decisions. |
| **Gaps** | Reframed as clarification control, separated why-it-matters / owner / drafted question / current state / actions within each gap card. | Keeps unresolved questions visible without drifting into project-management software. |
| **Brief** | Preserved document dominance while adding circulation posture, recent edits, section-level readiness, linked evidence, and blocker visibility. | Better reflects Metis’ core product truth: the brief is central, but decision context remains visible. |
| **Input** | Rebuilt as structured internal evidence capture with attribution, confidence, linkage, and readiness effect. | Shows how manual inputs improve the brief instead of merely storing notes. |
| **Compare** | Rebuilt as executive update control with material deltas, readiness movement, and output handoff logic. | Helps users decide whether a new upward update is warranted and what changed. |
| **Export** | Rebuilt as final circulation control with audience-fit output modes, preview, and readiness guidance. | Clarifies what is actually safe to circulate next, not just what can be downloaded. |

## What was removed

This pass intentionally removed or reduced several elements that made the prototype feel more like a concept explanation than a product.

| Removed or demoted element | Rationale |
| --- | --- |
| Broad dashboard-like snapshot behavior on deep-work screens | It competed with the actual task surface and delayed the eye from reaching the work. |
| Narrated screen copy that explained the prototype itself | It weakened realism and made the product feel self-describing instead of operational. |
| Explanatory “why this is useful” framing in several screens | Product surfaces should show utility through structure and state, not through meta-commentary. |
| Generic export / compare framing | Replaced with audience, readiness, and circulation-specific logic. |

## What was intentionally not added

This pass did **not** add simulated automation that would distort the product scope or weaken credibility.

| Excluded item | Reason |
| --- | --- |
| Automated stakeholder outreach flows | The current product concept depends on human-controlled follow-up, not autonomous outreach. |
| Heavy workflow/task-management mechanics | They would pull Metis away from briefing and decision support into a generic operations tool. |
| Excessively dense admin controls | The product should remain briefing-centered and leadership-oriented rather than feeling like a back-office console. |

## Browser validation outcome

Key routes were revalidated in-browser after the hardening work. **Setup, Sources, Gaps, Brief, Input, Compare, and Export** all rendered with the updated structure and shared readiness language. The prototype also passed **TypeScript check** and **production build** after the refinement pass.

## Remaining drift risks

| Risk | Current impact | Suggested next move |
| --- | --- | --- |
| Shared footer still exposes prototype-language | Minor realism leak | Remove or replace with a quieter internal product footer. |
| Large intro blocks still appear on several deep-work screens | Moderate density issue for power-user workflows | Compress hero copy further into slimmer operator headers. |
| “Blocked” is defined in readiness language but not yet materially used | Small consistency gap | Introduce only where a screen truly cannot proceed, rather than forcing it in. |
| Build output is large | Technical, not UX-critical for the prototype | Consider code-splitting later if performance work becomes a priority. |

## Conclusion

The Metis prototype now behaves more consistently as a **source-backed issue briefing and circulation-control product**. The interface better distinguishes between internal review, unresolved uncertainty, evidence conflict, and safe circulation, while preserving the brief as the central artifact.
