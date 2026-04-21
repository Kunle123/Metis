# Metis Targeted Production-Language Pass Report

## Summary

This pass completed the targeted production-language cleanup that was left mid-implementation from the previous session. The work focused on removing residual page-level narration, removing route-style or explanatory support copy, and reducing a small amount of competing deep-screen chrome while preserving the underlying brief artifact, evidence abstracts, source snippets, and attributable internal input. The result is a calmer, more operational workspace that reads more like a live internal briefing tool than a prototype walkthrough.

## Scope and intent

The pass applied the user's rule set directly. Sentences that explained what a screen was doing, pointed operators toward route paths, or sounded more natural in design review commentary than in a working internal tool were removed or rewritten. By contrast, brief section bodies, source notes, quoted evidence, stakeholder responses, and short operator-facing labels were preserved unless they were clearly self-referential or route-scaffold copy.

| Area | Pass outcome |
| --- | --- |
| Page-level narration | Removed where still present or reduced to direct labels |
| Section-level narration | Removed where it behaved like explanation rather than working copy |
| Evidence abstracts | Preserved across Brief, Sources, and Input |
| Deep-screen chrome | Reduced modestly in shared shell and support rails |
| Workflow behavior | Kept static and non-automation-heavy, consistent with project constraints |

## File-by-file changes

### Shared shell

The shared shell was tightened in two places. First, the intro component now suppresses its descriptive paragraph when no text is supplied, which allowed the dashboard to drop its filler line cleanly without leaving empty layout space. Second, the non-dashboard contextual status strip no longer repeats the audience badge, reducing header density on deep-work screens while retaining the active issue title, severity, readiness state, gap count, and refresh timing.

| File | Change |
| --- | --- |
| `client/src/components/MetisShell.tsx` | Made `ScreenIntro` description conditional and removed the repeated audience badge from the deep-screen status strip |

### Dashboard

The dashboard no longer uses the filler description "Issue list." in its intro panel. The primary issue card section title was shortened from "Live workspaces" to "Issues," and the filter control label was shortened from "Filter by status" to "Filter." These changes remove residual UI explanation without changing the dashboard's structure or issue data.

| File | Change |
| --- | --- |
| `client/src/pages/Dashboard.tsx` | Removed intro filler copy and shortened two labels to more direct internal-tool language |

### Brief

The brief remained the center of gravity for the pass, but only one residual self-referential block still required intervention. In executive mode, the block previously titled "Shift since last version" described the brief's editorial construction rather than the situation itself. It was replaced with a more direct operational block titled "Current line," with language focused on the current position rather than commentary about how the document had been rewritten. The brief eyebrow in full mode was also tightened from "Document" to "Brief."

| File | Replacement |
| --- | --- |
| `client/src/pages/Brief.tsx` | Replaced "Shift since last version" with "Current line" and changed the body to direct current-state language |
| `client/src/pages/Brief.tsx` | Changed the full-mode eyebrow from "Document" to "Brief" |

The artifact content itself was preserved. Full brief section bodies, executive summary statements, evidence appendix entries, change summary items, and blocker rows remain intact because they function as working brief content or operational status.

### Sources

The Sources page was tightened so the main title and ledger heading both use the simpler internal label "Sources." The key support-rail cleanup was the removal of the route-style sentence "Open conflicts in /gaps." That line was replaced with the direct status label "2 open conflicts," which preserves the operator signal without exposing route scaffolding.

| File | Change |
| --- | --- |
| `client/src/pages/Sources.tsx` | Changed page title from "Evidence Ledger" to "Sources" |
| `client/src/pages/Sources.tsx` | Changed ledger eyebrow from "Ledger" to "Sources" |
| `client/src/pages/Sources.tsx` | Replaced route-style conflicts sentence with the direct status line "2 open conflicts" |

Source-level evidence abstracts, timestamps, tier labels, notes, quoted snippets, reliability text, and in-brief or signal usage markers were preserved.

### Gaps

The Gaps screen received the most visible support-rail cleanup. The page title was shortened from "Clarification Gaps" to "Gaps," and the main ledger eyebrow was aligned to the same label. More importantly, the route-placeholder badge values in the support rail were removed. "Pending input" with the `/input` badge became "Input records" with a live count, and "Resolved changes" with the `/compare` badge became "Resolved gaps" with a live count. This preserves operational meaning while removing prototype-style route leakage.

| File | Change |
| --- | --- |
| `client/src/pages/Gaps.tsx` | Added `stakeholderInputs` import to support live count rendering |
| `client/src/pages/Gaps.tsx` | Changed page title to "Gaps" and eyebrow to "Gaps" |
| `client/src/pages/Gaps.tsx` | Replaced route-style support badges with counts for input records and resolved gaps |

The clarification cards, drafted questions, impact statements, affected sections, and stakeholder roles were preserved because they are the core ledger content rather than narration.

### Input

The Input screen already contained mostly acceptable operational copy, so the pass focused on the support rail. Its header was compressed by removing the large repeated display title and leaving only a compact status label. The readiness sentence was also rewritten from "Chronology updated. Exposure wording separate." to "Chronology updated. Exposure wording pending validation." The replacement is more direct and more legible as working status language.

| File | Change |
| --- | --- |
| `client/src/pages/Input.tsx` | Compressed the support-rail header from a duplicated title block to a compact status label |
| `client/src/pages/Input.tsx` | Replaced the readiness sentence with more direct validation language |

The attributable stakeholder responses, linked-input records, confidence states, and capture-state metadata were preserved.

### Export

The Export screen was already close to the target tone. During live review, one residual preview-line annotation stood out: "Package: executive brief." That line was changed to "Internal circulation." The edit makes the preview panel read more like artifact language and less like a packaging label.

| File | Change |
| --- | --- |
| `client/src/pages/Export.tsx` | Replaced "Package: executive brief." with "Internal circulation." in the preview card |

### Screens reviewed without material changes

Compare remained largely acceptable in this pass. Its content already reads as a direct delta ledger rather than explanatory UI narration, so no substantive changes were required. Setup had already been partially updated before this session continued, including removal of the readiness checklist and renaming "References" to "Attachments," and no additional intervention proved necessary during this pass.

## Preserved content classes

The pass deliberately preserved content that functions as the artifact or its evidence layer. That includes the full brief section bodies in `briefSections`, source notes and quotations in `sourceItems`, attributable stakeholder responses in `stakeholderInputs`, change-ledger content in Compare, and concise circulation-state content in Export. Preserving these classes prevents the cleanup from flattening the product into generic UI while still removing prototype narration.

| Preserved class | Reason for preserving |
| --- | --- |
| Brief section bodies | They are the central artifact content rather than UI explanation |
| Source notes and snippets | They are evidence abstracts and quoted support, not screen narration |
| Stakeholder responses | They are attributable internal input tied to the brief |
| Change-ledger items | They record substantive differences rather than explaining the feature |
| Circulation-state rows | They communicate operator status directly and concisely |

## Validation

Validation was run twice because two final copy polishes were applied after the initial validation cycle. Both TypeScript checks completed successfully, and both production builds completed successfully. The build still emits the existing large-chunk warning from Vite, but this is unchanged from prior passes and does not block the current copy-hardening work.

| Validation step | Result |
| --- | --- |
| `pnpm check` | Passed |
| `pnpm build` | Passed |
| Final `pnpm check` after late polish | Passed |
| Final `pnpm build` after late polish | Passed |

Live browser review was completed on the Brief, Sources, Gaps, and Export routes. The review confirmed that the new labels render correctly, evidence content remained intact, the Gaps support rail now shows counts instead of route placeholders, and the Export preview now uses direct internal-circulation language.

## Residual notes

The remaining operational timestamp pill, "Refreshed 12 minutes ago," was left in place because it reads as credible live-workspace metadata rather than narration. Compare was intentionally left structurally unchanged because its text already behaved like direct delta content. The build-size warning remains a future performance concern, but it is orthogonal to this production-language pass.

## Conclusion

This pass finishes the targeted production-language cleanup that had been left in progress. The updated prototype now removes the remaining route-scaffold language and residual explanatory filler across the main reviewed surfaces while preserving the core brief, evidence, and circulation content that makes Metis feel like a serious internal briefing product.
