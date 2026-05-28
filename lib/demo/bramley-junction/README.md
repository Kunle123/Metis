# Bramley Junction demo dataset

Fictional UK rail **planned works handback** scenario for the external timeline demo. All IDs and timestamps are deterministic.

## Comms realism

Overnight events (contractor, station manager, security, NOC) happened in operational channels **before** corporate affairs was engaged. They are **not** separate timeline inputs at historical event times.

**How it appears in Metis:**

| Time | What happened |
|------|----------------|
| 05:42 | Duty manager briefs comms by phone — issue opened (`Duty manager summary to comms`) |
| 05:50 | Corporate Affairs logs the duty overnight pack — sources SRC-001–SRC-007, claims and questions (`Duty overnight pack logged in Metis`) |
| 05:48+ | Direct comms inputs as they arrive (social, press, station phone updates, etc.) |

Each incoming update includes:

- `eventOccurredAt` — operational event time **described in the update** (modal only — not timeline axis)
- `receivedByCommsAt` — when comms received the submission
- `addedToMetisAt` — when the row entered the Metis issue record
- `intakeRoute` — `direct_to_comms` for all submitted updates in this demo

**Direct-to-comms engagement points:**

| Time | Record |
|------|--------|
| 05:42 | Duty manager summary to comms |
| 05:50 | Duty overnight pack logged in Metis |
| 05:48 | Social monitoring note |
| 06:08 | Press office call log |
| 06:35 | Executive office request for short position note |

Outputs are timed **after** comms engagement and the relevant trigger (e.g. press line after press call, executive brief V1 after executive request).

## Commands

```bash
# Write JSON under public/demo/bramley-junction/ (no database required)
npm run demo:export:bramley

# Idempotent Prisma seed (demo organisation only; blocked in production-shaped envs)
npm run seed:demo:bramley
```

## Combined handoff file

`public/demo/bramley-junction/bramley-junction-demo-export.json` — copy this into the external Manus/timeline builder.

The top-level `issue` object is tagged `exportKind: "final_current_state"` — it is the **current/final** issue summary (`asOf` 09:00), not the point-in-time state for earlier timeline cards. Use each output's snapshot fields for historical views.

Export runs temporal validation automatically (`validateBramleyDataset`) — no output may reference records with `addedToMetisAt` / `createdAt` after its `generatedAt`.

`timelineProjection` is a **derived** lane index only:

- **Incoming updates:** card `timestamp` is `addedToMetisAt`. `intake.reportedEventAt` holds the operational time described in the update; `receivedByCommsAt` is when comms received it (modal only).
- **Issue record:** sources use `addedToMetisAt`; claims/questions/observations use Metis `createdAt` / `partiallyAnsweredAt` / `resolvedAt`.
- **Outputs:** `generatedAt`.

Full detail is resolved via `linkedRecordId`.

## Temporal integrity

Each output includes `generatedAt`, `basedOnSnapshotAt`, `includedRecordIds`, `notYetKnownRecordIds`, and related fields. Snapshots use **`addedToMetisAt`** for what was in the issue record at generation time. Executive Brief V1 (06:48) excludes facilities clearance and reopening logged later.

Issue id: `dddddddd-dddd-4ddd-addd-dddddddddd01`
