# METIS Station Timeline — Bramley Junction Interactive Asset

A fully interactive, clickable HTML prototype of the METIS issue intelligence timeline for the **Bramley Junction Station reopening delay** scenario. Built as a marketing/demo asset for [metisbriefing.com](https://metisbriefing.com).

## Overview

This asset demonstrates the METIS platform's ability to capture, structure and communicate an operational incident from first alert to formal closure — showing the full lifecycle of issue intelligence in action.

**Scenario:** Planned overnight maintenance at Bramley Junction Station results in a delayed main entrance reopening. The timeline shows how METIS captures inputs from multiple sources, structures claims and open questions in an issue record, and generates audience-specific outputs throughout the incident.

## Features

- **Horizontal time axis** spanning Sunday 20:00 → Monday 09:00
- **Three stacked swimlanes:** Inputs (slate-blue), Issue Record (teal), METIS Outputs (amber-gold)
- **35 clickable event cards** — each opens a right-side detail drawer
- **Detail drawer with three tabs:**
  - **Summary** — concise summary, source, METIS feature, demo value, tags
  - **Full Record** — the actual document/record text in monospace
  - **Related Events** — clickable cross-navigation to linked events
- **Hover highlighting** — hovering a card highlights all related events and dims others
- **Escape key** closes the drawer
- **Responsive** — drawer goes full-width on mobile

## Design Language: "Signal & Noise"

| Element | Value |
|---|---|
| Background | `#0F1C2E` deep navy |
| Inputs lane | `#4A7FA5` slate-blue |
| Issue Record lane | `#2A9D8F` teal |
| METIS Outputs lane | `#E9C46A` amber-gold |
| Display font | Cormorant Garamond |
| Body font | DM Sans |
| Timestamp font | DM Mono |

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Vite
- Wouter (routing)
- lucide-react (icons)

## Running Locally

```bash
cd station-timeline-asset
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## File Structure

```
station-timeline-asset/
  client/
    index.html              ← Google Fonts CDN links
    src/
      data/
        timelineData.ts     ← All 35 events + LANE_CONFIG
      pages/
        Home.tsx            ← Main timeline component
      index.css             ← Signal & Noise design system CSS
      App.tsx               ← Route setup
      main.tsx              ← Entry point
```

## Event Inventory

| Time | Lane | Event |
|---|---|---|
| Sun 20:00 | Input | Planned works notice |
| Sun 21:15 | Input | Contractor mobilisation update |
| Mon 04:28 | Input | Contractor handback note |
| Mon 04:35 | Input | Station manager alert |
| Mon 04:40 | Issue | Issue workspace created |
| Mon 04:43 | Issue | Initial claims added |
| Mon 04:45 | Issue | Initial open questions added |
| Mon 04:50 | Input | Security supervisor update |
| Mon 04:55 | Input | Network operations update |
| Mon 05:00 | Issue | Observations added |
| Mon 05:05 | Output | Internal staff holding update |
| Mon 05:12 | Output | Passenger information draft |
| Mon 05:20 | Input | Maintenance engineer photo note |
| Mon 05:25 | Issue | Question partially answered |
| Mon 05:32 | Input | Customer service desk update |
| Mon 05:40 | Output | Duty manager briefing note |
| Mon 05:48 | Input | Social media monitoring note |
| Mon 05:55 | Issue | Claims refined |
| Mon 06:00 | Output | Social response line |
| Mon 06:08 | Input | Press office call log |
| Mon 06:15 | Output | Holding press line |
| Mon 06:22 | Input | Station manager update |
| Mon 06:30 | Issue | Open question closed |
| Mon 06:38 | Output | Executive brief V1 |
| Mon 06:50 | Issue | Brief comparison created |
| Mon 07:05 | Input | Facilities inspection update |
| Mon 07:12 | Issue | Risk level updated |
| Mon 07:20 | Output | Updated passenger message |
| Mon 07:35 | Output | Councillor and stakeholder note |
| Mon 07:50 | Input | Accessibility team note |
| Mon 08:05 | Issue | Final observations added |
| Mon 08:12 | Output | Main entrance reopened update |
| Mon 08:25 | Output | Executive brief V2 |
| Mon 08:40 | Output | Post-incident review note |
| Mon 09:00 | Issue | Circulation audit |
