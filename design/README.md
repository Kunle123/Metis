# Metis Design Handoff

This `design/` directory is the **design-source-of-truth reference set exported from the Manus workspace** for the current Metis direction. It is intended to support engineering handoff, design review, and implementation alignment without introducing new product requirements, new features, or redesign work.

## Purpose

Implementation should follow these materials **closely and faithfully**. Teams should not reinterpret the product direction, simplify the information architecture, restyle the screens, or redesign components unless a new explicit instruction is given.

The files in this directory preserve three things: the visual reference set, the current Manus UI implementation references, and the design-review trail that explains how the direction was tightened over time.

## Folder layout

| Path | Contents | Intended use |
| --- | --- | --- |
| `/design/reference-images/` | Persisted visual assets and current screen screenshots from the Manus workspace | Use for visual comparison, layout checks, and overall tone calibration |
| `/design/manus-ui/` | UI reference files copied from the Manus prototype | Use as implementation reference for structure, hierarchy, and screen composition |
| `/design/review-notes/` | Design pass reports, validation notes, and review documents from Manus | Use to understand what was intentionally reduced, preserved, or tightened |
| `/design/screen_inventory.md` | Screen-by-screen handoff notes | Use to preserve purpose, behaviors, and limits for each screen |
| `/design/component_map.md` | Shared component-level handoff notes | Use to keep common chrome and repeated patterns from drifting |

## Working rule

If implementation and interpretation ever conflict, prefer the **existing Manus reference materials** in this folder over invention. The goal of this handoff is to preserve the current Metis direction, not to create a new one.

## Handoff scope

This handoff is intentionally limited to design-source materials. It does **not** authorize backend changes, frontend logic changes, new product requirements, or speculative redesign.
