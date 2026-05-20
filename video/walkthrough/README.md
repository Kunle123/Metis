# Metis product walkthrough video

Programmatic **1920×1080**, **~2:00**, **30 fps** walkthrough for LinkedIn and the website. Built with [Remotion](https://www.remotion.dev/) in an isolated package so the main Next.js app stays unchanged.

Visual style: dark editorial, brass accent, institutional pacing — not a flashy SaaS trailer.

## Prerequisites

- Node.js 18+
- [FFmpeg](https://ffmpeg.org/) on your `PATH` (required for MP4 export)

## Quick start

```bash
cd video/walkthrough
npm install
npm run studio
```

Opens Remotion Studio at the composition **MetisWalkthrough**. Scrub the timeline, inspect named sequences (Scene 1–10), and adjust timing in `src/scenes.ts`.

From the repo root (after install):

```bash
npm run video:studio
```

## Project layout

| Path | Purpose |
|------|---------|
| `src/scenes.ts` | Scene timing, voiceover excerpts, on-screen headlines |
| `src/theme.ts` | Resolution, fps, brand colours |
| `src/Walkthrough.tsx` | Main composition, fonts, optional audio |
| `src/scenes/SceneVisuals.tsx` | Per-scene animation logic |
| `src/components/*` | Reusable UI: cards, workspace, brief, review, etc. |
| `remotion.config.ts` | Points `public/` at repo root (`../../public`) for logo + voiceover |

## Customising content

1. **Voiceover script** — edit `voiceover`, `headline`, and `subline` in `src/scenes.ts`. Keep `durationInFrames` aligned with your recorded audio.
2. **Logo** — replace `public/metis-logo-300.png` or update `FinalFlow.tsx` / `staticFile()` usage.
3. **Fictional copy** — email snippets, brief sections, and column items are placeholders in component files (search for “Replace” / fictional labels).
4. **Subtitles** — toggle `SHOW_SUBTITLES` in `src/Walkthrough.tsx`.

## Voiceover

**Included:** A generated narration track (macOS `say`, British **Daniel** voice) aligned to scene slots.

```bash
cd video/walkthrough
npm run voiceover   # writes public/walkthrough-voiceover.wav (+ .m4a if no ffmpeg)
```

`ENABLE_VOICEOVER` is on in `src/Walkthrough.tsx`. Replace **`public/walkthrough-voiceover.wav`** with a professional recording when ready (keep **120 seconds** or update `src/scenes.ts`).

Preview in Studio; nudge scene `durationInFrames` if your recording drifts.

## Export MP4

```bash
cd video/walkthrough
npm run render
```

Output: `video/walkthrough/out/metis-walkthrough.mp4`

Higher quality (larger file):

```bash
npm run render:hq
```

First render downloads Chrome Headless Shell; allow a few minutes.

## Scene timing reference

| Scene | Time | ID |
|-------|------|-----|
| 1 | 00:00–00:08 | `scattered-inputs` |
| 2 | 00:08–00:18 | `issue-workspace` |
| 3 | 00:18–00:32 | `add-input` |
| 4 | 00:32–00:45 | `structure-input` |
| 5 | 00:45–00:58 | `briefing-record` |
| 6 | 00:58–01:10 | `create-brief` |
| 7 | 01:10–01:24 | `leadership-brief` |
| 8 | 01:24–01:38 | `review` |
| 9 | 01:38–01:50 | `benefits` |
| 10 | 01:50–02:00 | `closing` |

## Why a separate package?

Metis does not use Remotion in the main app. This folder is the smallest practical setup: only `video/walkthrough` depends on Remotion, shares `public/` assets, and does not affect production Next.js builds.
