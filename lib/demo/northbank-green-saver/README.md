# Northbank Green Saver demo dataset

Fictional **Northbank Building Society** BAU product launch readiness scenario (financial services). Two working weeks of cross-functional inputs, executive brief versions, message variants, comparison and circulation audit.

## Commands

```bash
npm run demo:export:northbank
npm run seed:demo:northbank
```

## Handoff

`public/demo/northbank-green-saver/northbank-green-saver-demo-export.json`

The `issue` object is `exportKind: "final_current_state"` — final summary after the launch window, not point-in-time for earlier timeline cards.

Export runs `validateNorthbankDataset` automatically (temporal integrity on all outputs).

`timelineProjection` is a derived lane index only:

- **Incoming:** card `timestamp` is `addedToMetisAt` for `reconstructed_from_project_source` (subtitle: `Added from project source · event occurred HH:mm`); direct working-hours inputs use `receivedByCommsAt`. The `intake` object keeps operational and Metis times for modals.
- **Issue record:** sources use `addedToMetisAt`; claims/questions/observations use Metis `createdAt` / `partiallyAnsweredAt` / `resolvedAt` (close never before `createdAt`); circulation events use `at`.
- **Outputs:** `generatedAt`.

Issue id: `eeeeeeee-eeee-4eee-aeee-eeeeeeeeee01`
