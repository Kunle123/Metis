# METIS Demo Assets — Recreation Guide

This guide explains how to take either demo asset from the `Kunle123/Metis` repository and run it as a standalone Manus web project, or update it from a new JSON export.

---

## Repository layout

```
Kunle123/Metis/
├── station-timeline-asset/     ← Bramley Junction demo (station operations)
│   ├── client/src/
│   │   ├── data/timelineData.ts   ← ALL card data (source of truth)
│   │   ├── pages/Home.tsx         ← Timeline renderer + drawer + wording toggle
│   │   └── index.css              ← Design tokens + .metis-* classes
│   ├── client/index.html          ← Google Fonts
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── northbank-timeline-asset/   ← Northbank Green Saver demo (financial services)
│   ├── client/src/
│   │   ├── data/timelineData.ts
│   │   ├── pages/Home.tsx
│   │   └── index.css
│   ├── client/index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
└── docs/
    └── demo-recreation-guide.md   ← this file
```

---

## Prerequisites

- Node.js 22 or later
- pnpm (`npm install -g pnpm`)
- GitHub CLI authenticated to `Kunle123` (`gh auth login`)

---

## Option A — Run locally from the repo

```bash
gh repo clone Kunle123/Metis
cd Metis/station-timeline-asset   # or northbank-timeline-asset
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Option B — Recreate as a new Manus web project

Use the following prompt at the start of a new Manus conversation:

### For the Bramley Junction demo

```
I want to recreate the METIS Bramley Junction interactive timeline demo as a new Manus
web-static project.

Steps:
1. Clone the GitHub repository Kunle123/Metis into the sandbox.
2. Initialise a new Manus web-static project (React 19 + Vite + Tailwind CSS 4 + shadcn/ui).
3. Copy these files from the cloned repo into the new project:
   - station-timeline-asset/client/src/data/timelineData.ts
     → client/src/data/timelineData.ts
   - station-timeline-asset/client/src/pages/Home.tsx
     → client/src/pages/Home.tsx
   - station-timeline-asset/client/index.html
     → client/index.html
4. Append all CSS rules that start with .metis- from
   station-timeline-asset/client/src/index.css
   to the new project's client/src/index.css.
5. In App.tsx, add a route "/" pointing to the Home page component.
6. Run pnpm dev and confirm 0 TypeScript errors.
7. Do not modify timelineData.ts — it is the source of truth.
```

### For the Northbank Green Saver demo

```
I want to recreate the METIS Northbank Green Saver interactive timeline demo as a new
Manus web-static project.

Steps:
1. Clone the GitHub repository Kunle123/Metis into the sandbox.
2. Initialise a new Manus web-static project (React 19 + Vite + Tailwind CSS 4 + shadcn/ui).
3. Copy these files from the cloned repo into the new project:
   - northbank-timeline-asset/client/src/data/timelineData.ts
     → client/src/data/timelineData.ts
   - northbank-timeline-asset/client/src/pages/Home.tsx
     → client/src/pages/Home.tsx
   - northbank-timeline-asset/client/index.html
     → client/index.html
4. Append all CSS rules that start with .metis- from
   northbank-timeline-asset/client/src/index.css
   to the new project's client/src/index.css.
5. In App.tsx, add a route "/" pointing to the Home page component.
6. Run pnpm dev and confirm 0 TypeScript errors.
7. Do not modify timelineData.ts — it is the source of truth.
```

---

## Option C — Update an existing demo from a new JSON export

Upload the new JSON file to the Manus conversation and use this prompt (substitute the demo name as needed):

```
The attached [bramley-junction-demo-export.json | northbank-green-saver-demo-export.json]
is the updated source of truth.

Rewrite client/src/data/timelineData.ts so that:
1. Every card in the timelineProjection array becomes a TimelineEvent in the data file.
2. No cards are manually invented — derive only from timelineProjection, outputs,
   and circulationEvents arrays in the JSON.
3. Preserve the existing TypeScript interface shape (TimelineEvent) exactly.
4. For every output card that has a non-empty draftBody or aiPolishedBody in the JSON
   outputs array, add those fields plus wordingModeDefault and aiPolish to the card.
5. For exec brief outputs where the JSON draftBody is empty, use the JSON body field
   as draftBody and craft an AI-polished prose version that:
   - preserves all guardrails, do-not-say constraints and open questions
   - restructures bullet lists into prose paragraphs
   - adds a brief version label and timestamp to the header
   - does not add any facts not present at basedOnSnapshotAt
6. Add impactChips to every incoming_update card that has issueRecordImpacts in the JSON.
7. Run pnpm dev and confirm 0 TypeScript errors before reporting done.
```

---

## Design system reference

Both demos share the same design system:

| Token | Value |
|-------|-------|
| Background | `#F6F1E8` (warm paper) |
| Drawer background | `#263B2E` (deep olive) |
| Accent / brass | `#B78B45` |
| Sage | `#8FA38A` |
| Display font | Playfair Display (serif) |
| Body font | Inter |
| Mono font | IBM Plex Mono |

---

## TypeScript interface summary

The `TimelineEvent` interface in `timelineData.ts` supports these key fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | Unique card identifier |
| `lane` | `'incoming_update' \| 'issue_record' \| 'metis_output'` | Swimlane |
| `day` | `string` | Display day label |
| `time` | `string` | Display time (BST) |
| `badgeLabel` | `string` | Badge text on card |
| `title` | `string` | Card headline |
| `summary` | `string` | Card body preview |
| `impactChips` | `string[]` | Issue-record delta chips on incoming update cards |
| `draftBody` | `string` | Controlled record-based wording for output cards |
| `aiPolishedBody` | `string` | AI-polished wording for output cards |
| `wordingModeDefault` | `'draft' \| 'ai_polished'` | Which wording mode the drawer opens with |
| `aiPolish` | `AiPolish` | Metadata: enabled, label, preservedConstraints, changed |
| `doNotSay` | `string[]` | Wording constraints shown in drawer |
| `openQuestionsAtGeneration` | `string[]` | Open questions at time of output generation |
| `caveatsAtGeneration` | `string[]` | Caveats at time of output generation |
| `fullRecord` | `{ heading: string; body: string }[]` | Structured record sections in the drawer |
