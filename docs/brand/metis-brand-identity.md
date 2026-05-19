# Metis — brand identity reference

Source of truth for **in-product** visuals is the CSS design tokens in [`app/globals.css`](../../app/globals.css). This document summarises what designers and asset authors need: positioning, typography, colour roles, logo, radii, status semantics, and exports.

**Product framing (from app metadata):** Metis is a **corporate comms issue-briefing workspace** — calm, leadership-facing, evidence-aware. Copy and visuals should feel **institutional and composed under pressure**, not playful or consumer-SaaS flashy.

---

## 1. Typography

| Role | Family | Usage in product |
|------|--------|------------------|
| **Display / titles** | **Cormorant Garamond** | Page titles, major section headings, shell brand wordmark area, large metrics |
| **UI / body** | **IBM Plex Sans** | Body text, labels, tables, controls, navigation |
| **Fallback** | `system-ui, sans-serif` | When webfonts are unavailable |

**Implementation note:** The UI references display type as Tailwind arbitrary class `font-[Cormorant_Garamond]`. Body uses `font-family: "IBM Plex Sans", …` on `body` in `globals.css`. For marketing or print, load both from [Google Fonts](https://fonts.google.com): *Cormorant Garamond* (400–600) and *IBM Plex Sans* (400–600).

**Display title treatment (base styles):** Headings use `letter-spacing: -0.02em` and `font-variant-ligatures: common-ligatures` (`@layer base` in `globals.css`).

**Eyebrow / meta labels:** Small caps feel: uppercase, wide tracking (e.g. `0.16em`–`0.28em`), `font-medium`, colour `ink-soft` / tertiary text tokens — see components such as `SectionEyebrow` in `MetisShell`.

**Figures:** Prefer **tabular lining figures** for dense metrics and tables where possible (design intent in `design/review-notes/ideas.md`).

---

## 2. Colour system

Colours are defined in **OKLCH** as CSS variables. **Production default theme** is **dark** (`html` uses `class="dark"` in [`app/layout.tsx`](../../app/layout.tsx)). A **light** scaffold exists under `.light` in `globals.css` (dev preview); treat dark as primary for brand consistency unless a light campaign explicitly requires the `.light` overrides.

### 2.1 Core brand & surfaces (dark / `:root`)

Use these names when briefing illustrators or building decks; implement using the **exact `var(--metis-*)`** or OKLCH values from `globals.css`.

| Token | OKLCH (dark default) | Role |
|-------|----------------------|------|
| `--metis-frame` | `oklch(0.115 0.006 68)` | Page / canvas base |
| `--metis-frame-soft` | `oklch(0.145 0.008 68)` | Softer frame variant |
| `--metis-paper` | `oklch(0.95 0.015 78)` | **Primary text** on dark UI |
| `--metis-paper-muted` | `oklch(0.79 0.015 72)` | Secondary text |
| `--metis-ink-soft` | `oklch(0.63 0.015 72)` | Tertiary / hint text |
| `--metis-dark` | `oklch(0.18 0.01 70)` | Deep neutral; **text on brass buttons** via `--metis-text-on-accent` patterns |
| `--metis-brass` | `oklch(0.69 0.08 70)` | **Primary accent** — CTAs, focus ring, selection tint |
| `--metis-brass-soft` | `oklch(0.8 0.07 74)` | Hover links, secondary brass highlights |
| `--metis-accent` | alias of `--metis-brass` | Semantic “brand accent” |
| `--metis-info` | `oklch(0.78 0.085 232)` | Restrained **info / provenance** blue |

**Text mapping:** `--metis-text-primary` → paper; `--metis-text-secondary` / `--metis-text-tertiary` → muted / ink-soft.

**Background atmosphere (body):** Subtle stacked linear + radial gradients (brass ~`rgba(164,132,82,…)`, cool slate, deep green) — see `body` in `globals.css`. Marketing backgrounds can echo this **low-contrast, multi-stop** treatment rather than flat grey.

**Text selection:** `background: rgba(164, 132, 82, 0.28)` with `--metis-paper` foreground — aligns with brass mood.

### 2.2 Semantic status (pills, alerts)

| Token | Purpose |
|-------|---------|
| `--metis-status-success-*` | Positive / ready |
| `--metis-status-warning-*` | Caution / attention |
| `--metis-status-danger-*` | Error / blocked |
| `--metis-status-info-*` | Informational |
| `--metis-status-neutral-*` | Default chips |

Use **full token sets** (bg + fg + border) from `globals.css` so contrast stays consistent.

### 2.3 Light theme (`.light`)

When producing **light-mode** assets, copy the **`.light` block** overrides from `globals.css` (frames shift to near-white, ink to charcoal, brass deepens for legibility). Do not mix dark-ink on dark-surface or light-ink on light-surface without checking the matching token set.

### 2.4 Figma / design tools

- Prefer **sampling** computed colours from the running app, or paste OKLCH into a converter (e.g. [oklch.com](https://oklch.com)).
- Avoid hand-approximating brass; small shifts read as “beige mud” on light surfaces (see comments in `.light`).

---

## 3. Layout, shape, and depth

| Concept | Value / note |
|---------|----------------|
| **Default radius** | `--radius: 1.35rem` |
| **Cards / surfaces** | Large rounded rectangles (`rounded-[1.7rem]`, `1.45rem` in places); soft glassy gradients (`.metis-surface`, `.metis-primary-surface`, `.metis-support-surface`) |
| **Controls** | `--metis-control-radius-md: 0.875rem`; pill radius `999px` for chips / capsules |
| **Shadow** | `--shadow-card: 0 24px 72px rgba(0,0,0,0.26)` (dark) |
| **Dividers** | `--metis-outline-subtle`, `--metis-outline-strong`, often `white/5`–`white/10` borders on dark |

**Iconography (in app):** [Lucide React](https://lucide.dev) — stroke icons, consistent with sober UI.

---

## 4. Logo & wordmark

| Asset | Location | Notes |
|-------|----------|--------|
| **App mark (300×300 PNG)** | [`public/metis-logo-300.png`](../../public/metis-logo-300.png) | Square mark for avatars, deck title slides, social |
| **In-app shell** | `MetisShell` aside | Letter **M** in Cormorant + word **Briefing** — editorial lockup, not a separate logo file |

**Guidance:**

- Prefer the **PNG** (or a future SVG master) on **dark or deep charcoal** backgrounds; if placing on light backgrounds, add a subtle dark plate or use a brass-trim variant designed for contrast.
- **Clear space:** keep padding ≥ **0.5×** the cap height of the “M” (or 10% of image width for the 300px asset) where possible.
- **Don’t:** stretch, recolour brass to neon, add drop shadows that read as “consumer app”, or pair with clashing warm pastels.

*If you need additional sizes (16/32/64 favicon, SVG, inverse/light), export from the same master with the tokens above.*

---

## 5. Voice & design principles (brief)

Aligned with internal design notes (`design/review-notes/ideas.md` — *Editorial Situation Room*):

- **Composed under pressure** — hierarchy and chronology over decoration.  
- **Restraint** — brass and strong status colours are **sparse**; overuse dilutes urgency.  
- **Institutional trust** — graphite / parchment / brass mood; discretion over hype.  
- **Deliberate interaction** — hovers sharpen slightly; avoid playful motion for core workflows.

---

## 6. Checklist for new assets

- [ ] **Fonts:** Cormorant Garamond (headlines) + IBM Plex Sans (copy/UI)  
- [ ] **Dark-first:** frame + paper text + brass accent; confirm contrast for accessibility  
- [ ] **Tokens:** match `globals.css` OKLCH or sampled renders  
- [ ] **Logo:** `public/metis-logo-300.png` or derivative with clear space  
- [ ] **Status:** use success / warning / danger / info / neutral **sets**, not one-off hexes  
- [ ] **Corners:** ~`1.35rem` family feel for large panels; pills for chips  

---

## 7. File & code references

| What | Where |
|------|--------|
| Tokens & themes | `app/globals.css` |
| Body / background / base type | `app/globals.css` `@layer base` |
| Shell / title patterns | `components/MetisShell.tsx` |
| Product title / description | `app/layout.tsx` `metadata` |
| Typography intent | `design/review-notes/ideas.md` |

---

*Last aligned with repository tokens and layout as of the document’s creation. When tokens change, update this file in the same PR as `globals.css`.*
