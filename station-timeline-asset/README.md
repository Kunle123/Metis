# METIS Station Timeline — Interactive Demo Asset

A standalone React + Vite interactive timeline demonstrating the METIS issue record lifecycle using the Bramley Junction demo scenario.

## What it shows

Three swimlanes on a shared time axis (all timestamps = when Metis/comms knew the information):

| Lane | Label | What it represents |
|------|-------|--------------------|
| `input` | **Incoming Updates** | Raw operational signals added to Metis |
| `issue` | **Issue Record** | Claims, questions, observations and status updates |
| `output` | **METIS Outputs** | Staff lines, passenger messages, press lines, executive briefs |

## Design system

**"Editorial Record"** — warm paper `#F6F1E8`, Playfair Display serif, deep olive drawer `#263B2E`, brass `#B78B45`, sage `#8FA38A`.

## Stack

React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Wouter + shadcn/ui

## Running locally

```bash
pnpm install
pnpm dev
```

## Integration into metisbriefing.com

1. Copy `client/src/data/timelineData.ts` and `client/src/pages/Home.tsx` into the metisbriefing project.
2. Copy all `.metis-*` CSS classes from `client/src/index.css` into the metisbriefing global CSS.
3. Add a `/demo` route in `App.tsx` pointing to `Home`.
4. Add a "SEE THE DEMO" nav item linking to `/demo`.
5. Ensure Google Fonts (Playfair Display, Inter, IBM Plex Mono) are loaded in `index.html`.

## Live demo

`https://metistimelne-grjivs8l.manus.space`
