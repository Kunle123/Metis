# METIS Station Timeline — Northbank Green Saver Demo Asset

A standalone React + Vite interactive timeline demonstrating the METIS issue record lifecycle using the **Northbank Green Saver** demo scenario (a savings product mis-selling incident). Cards are derived strictly from the `timelineProjection` array in the demo export JSON — no cards are manually invented.

## What it shows

Three swimlanes on a shared time axis (all timestamps represent when METIS / comms knew the information):

| Lane | Label | What it represents |
|------|-------|--------------------|
| `incoming_update` | **Incoming Updates** | Raw signals (complaints, social, regulator contact) added to METIS, with `impactChips` showing issue-record deltas |
| `issue_record` | **Issue Record** | Claims, questions, observations, status updates, DECISION and COMPARE cards |
| `metis_output` | **METIS Outputs** | Customer messages, internal staff messages, press lines, stakeholder notes — each with a Draft / ✦ AI polished wording toggle |

## Design system

**"Editorial Record"** — warm paper `#F6F1E8`, Playfair Display serif, deep olive drawer `#263B2E`, brass `#B78B45`, sage `#8FA38A`.

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Wouter · shadcn/ui · Lucide React · Framer Motion

## Key source files

| File | Purpose |
|------|---------|
| `client/src/data/timelineData.ts` | All timeline cards — the single source of truth, derived from the JSON export |
| `client/src/pages/Home.tsx` | Timeline renderer, drawer, wording toggle, impact chips |
| `client/src/index.css` | Design tokens, `.metis-*` component classes, chip and wording-block styles |
| `client/index.html` | Google Fonts (Playfair Display, Inter, IBM Plex Mono) |

## Running locally

```bash
# Requires Node 22+ and pnpm
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build → dist/public
```

## Recreating in another Manus conversation

The steps below let you spin up this demo from scratch in a fresh Manus task.

### Step 1 — Clone the repo

In the new Manus conversation, ask:

> Clone the GitHub repository Kunle123/Metis. The Northbank demo lives in `northbank-timeline-asset/` and the Bramley demo in `station-timeline-asset/`.

### Step 2 — Scaffold a new Manus web-static project

Ask Manus to initialise a new web-static project (React + Vite + Tailwind + shadcn/ui). Then:

1. Replace `client/src/data/timelineData.ts` with the file from `northbank-timeline-asset/client/src/data/timelineData.ts`.
2. Replace `client/src/pages/Home.tsx` with the file from `northbank-timeline-asset/client/src/pages/Home.tsx`.
3. Append all `.metis-*` CSS rules from `northbank-timeline-asset/client/src/index.css` to the project's `index.css`.
4. Replace `client/index.html` with the version from `northbank-timeline-asset/client/index.html` (loads the correct Google Fonts).

### Step 3 — Prompt Manus to wire it up

Use this prompt in the new Manus conversation:

```
I have a React + Vite + Tailwind project. I've dropped in:
- client/src/data/timelineData.ts  (METIS Northbank Green Saver timeline data)
- client/src/pages/Home.tsx        (timeline renderer with drawer and wording toggle)
- CSS classes prefixed with .metis- appended to index.css
- index.html with Playfair Display, Inter and IBM Plex Mono fonts

Please:
1. Add a route "/" in App.tsx pointing to the Home page.
2. Run pnpm dev and confirm it compiles with 0 TypeScript errors.
3. Do not change any data in timelineData.ts — it is the source of truth.
```

### Step 4 — Update data from a new JSON export

When a new `northbank-green-saver-demo-export.json` is available, upload it and use this prompt:

```
The attached northbank-green-saver-demo-export.json is the new source of truth.
Rewrite client/src/data/timelineData.ts so that:
- Every card in the timelineProjection array becomes a card in the data file.
- No cards are manually invented — derive only from timelineProjection, outputs, circulationEvents.
- Preserve the TypeScript interface shape (TimelineEvent) already in the file.
- Add draftBody, aiPolishedBody, wordingModeDefault and aiPolish fields to every output
  that has a non-empty draftBody or aiPolishedBody in the JSON outputs array.
- For exec briefs where the JSON draftBody is empty, use the JSON `body` field as draftBody
  and craft an AI-polished prose version that preserves all guardrails and open questions.
```

## Integration into metisbriefing.com

1. Copy `client/src/data/timelineData.ts` and `client/src/pages/Home.tsx` into the metisbriefing project.
2. Copy all `.metis-*` CSS classes from `client/src/index.css` into the metisbriefing global CSS.
3. Add a `/demo/northbank` route in `App.tsx` pointing to `Home`.
4. Ensure Google Fonts (Playfair Display, Inter, IBM Plex Mono) are loaded in `index.html`.
