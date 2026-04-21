# Metis Strict Production-Language Pass Report

## Summary

This pass removed additional prototype-style narration, design-review phrasing, and explanatory UI copy across the working Metis surfaces while preserving the existing product shape. The brief remains the dominant artifact, while Sources, Gaps, Compare, Input, Setup, Dashboard, and Export now use drier operator-facing language with lighter support chrome.

| Area | Outcome |
| --- | --- |
| Copy tone | Shifted further toward direct internal-tool language |
| Brief artifact | Remains primary and visually dominant |
| Support rails | Shorter labels and less coaching language |
| Validation | TypeScript passed, build passed, browser spot checks completed |
| Confidence | 8/10 |

## Screen-by-screen changes

### Dashboard

The dashboard overview was tightened from a more guided opening to a direct list-oriented presentation. The helper line was reduced to a minimal label, and section headings were shortened from conceptual language to direct operational labels.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `Open an issue or start a brief.` | `Issue list.` | Removes onboarding tone and leaves only a direct screen cue. |
| `Reusable setups` / `Template shortcuts` | `Templates` | Removes explanatory framing and uses a straightforward noun. |
| `Recently updated` / `Change pulse` | `Updates` | Replaces productized wording with direct operational language. |

Remaining risk is low. The action label **Open workspace** may still be slightly more product-like than the driest alternative, but it remains acceptable in a working tool.

### Setup

Setup kept its intake role but lost more support framing. The support rail now uses a direct status label rather than a descriptive state panel heading.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `Brief / Current state` support heading | `Status / Status` | Reduces interpretive framing and uses a direct operational label. |

Remaining risk is low. Some intake helper text is still present by design where ambiguity would otherwise increase.

### Brief

The brief was tightened at both the UI layer and the shared content layer. The dominant artifact remains intact, but several sentences that commented on the artifact rather than stating the facts were hardened into direct internal-brief language.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `The brief should center operational impact...` | `Current wording stays on operational impact...` | Removes meta-commentary about the document itself. |
| `Internal narrative centers on... may evolve...` | `Internal messaging remains on... External interpretation is moving...` | Keeps the same meaning but drops review-style phrasing. |
| `communication discipline matters more than speed alone...` | `Premature breach language would increase risk.` | Converts commentary into a direct operational consequence. |
| `Prepare a follow-up brief once Legal validates...` | `Follow-up brief after Legal validates...` | Shortens instruction-style narration into direct artifact language. |

Remaining risk is moderate. Several body paragraphs still retain editorial tone because they are the brief artifact itself, not UI narration. They are materially better than before, but could be made even drier in a future pass.

### Sources

Sources kept the evidence ledger as the primary plane while the support rail was simplified further. The handling note and section-status details were hardened into more operational wording.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `Internal only` | `Internal use` | Reads more like a control condition than a commentary note. |
| `Handling` | `Conflicts` | Uses a direct operational category rather than a general process label. |
| `Unresolved conflicts stay in Gaps.` | `Unresolved conflicts in Gaps.` | Removes instructional tone and leaves a direct location reference. |

Remaining risk is moderate. Some source notes still explain the role of a source in brief terms. They are now short and board-safe, but they still carry a light annotation feel.

### Gaps

Gaps remained a full clarification ledger and kept its field structure, but the supporting rail was shortened further so it reads as direct status language rather than guidance.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `Open by section` | `By section` | Removes extra wording without losing the label. |
| `Open gaps pending input.` | `Pending input.` | Turns explanation into direct status text. |
| `Resolved gaps reflected in delta review.` | `Resolved in delta.` | Shortens the rail to a compact operational reference. |
| `Review changes` | `Open delta` | Uses a more direct route/action label. |

Remaining risk is moderate. Field labels such as **Why it matters** are structurally useful but slightly more explicit than the driest possible production phrasing.

### Input

Input kept the single-record evidence shape but replaced coaching-style rules and a descriptive status heading with shorter operational labels.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `One input. One linked section.` | `Section link required` | Converts guidance into a direct requirement label. |
| `Visibility set before use.` | `Visibility set` | Removes instructional phrasing. |
| `Attributable wording only.` | `Attributable wording` | Keeps the constraint while dropping coaching tone. |
| `Linked brief / Current state` | `Status / Status` | Uses a direct support-rail label. |

Remaining risk is low. The screen now reads as a working evidence-capture surface.

### Compare

Compare kept the delta-control structure while reducing commentary in the current summary and support rail.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| `Customer Comms review required before broader circulation.` | `Customer Comms review required for broader circulation.` | Tightens the sentence into direct control language. |
| `Recommendations sequence Legal, IT, and Customer Comms review` | `Review sequence: Legal, IT, Customer Comms` | Removes summary-style narration. |
| `Circulation / Current state` | `Status / Status` | Hardens the support heading into a direct label. |
| `Wider circulation held on exposure validation.` | `Wider circulation held.` | Removes explanatory cause narration from the rail. |

Remaining risk is low to moderate. Some delta items still necessarily read as sentence fragments because they describe real content changes.

### Export

Export stayed artifact-first. The package list remains dominant, with shorter, more direct copy in package descriptions and circulation checks than before.

| Removed or tightened copy | Replacement | Why it is more production-real |
| --- | --- | --- |
| Residual explanatory packaging lines | Short package, preview, and circulation phrases | Keeps the screen focused on package state rather than UI narration. |

Remaining risk is moderate. Lines such as `Executive brief selected.` still read slightly like system commentary rather than a pure label, though the current tone is concise and acceptable.

## Validation

Validation was completed after the copy pass and the late browser-driven tightening edits.

| Check | Result | Notes |
| --- | --- | --- |
| TypeScript | Pass | `pnpm check` passed after cleanup edits and rechecks. |
| Production build | Pass | `pnpm build` passed with the existing non-blocking chunk-size warning. |
| Browser review | Pass with minor follow-up notes | Reviewed Brief, Sources, Export, and Gaps. |

## Remaining prototype-like copy and drift risks

The remaining risks are concentrated in artifact text rather than UI chrome. The brief body still includes some editorial wording, Sources still carries a light annotation feel in some source notes, and Export still contains a few phrases that behave like status commentary instead of pure labels.

| Remaining risk | Severity | Comment |
| --- | --- | --- |
| Brief body tone still slightly editorial in places | Medium | This is content-level drift, not UI narration. |
| Sources note copy still lightly annotated | Medium | Shorter than before, but not fully label-only. |
| Export preview/check language still partly system-commentary | Medium | Acceptable now, but could be tightened further. |
| Gaps field labels still explicit | Low | Useful structurally, though not maximally dry. |

## Confidence rating

I rate this pass **8/10** for production-language realism. The UI chrome now reads substantially more like a real internal comms tool than a prototype. The main residual softness is in artifact content and a few short support phrases, not in the overall product shell.
