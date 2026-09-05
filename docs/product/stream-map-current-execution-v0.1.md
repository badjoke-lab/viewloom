# ViewLoom Stream Map current execution v0.1

Status: **superseded execution snapshot**  
Originally used as: temporary override while `current-roadmap.md` / `current-schedule.md` lagged implementation  
Superseded by: `stream-map-spec-v0.7.md`, `stream-map-implementation-plan-v0.6.md`, updated `current-roadmap.md`, updated `current-schedule.md`  
Superseded on: 2026-09-05

## Why this file is no longer current authority

This file was introduced to prevent the weekly Top-20 reviewed-evidence maintenance cadence from incorrectly becoming the global Stream Map schedule while the older roadmap/schedule remained stale.

That temporary purpose was valid, but keeping another document labelled as a current execution override after the canonical roadmap/schedule have been repaired would recreate the same source-of-truth ambiguity.

The snapshot also predates substantial merged work, including later City stable-ID/UI/renderer changes, Kick reviewed Country evidence work, Current snapshot stable-ID plumbing, the finalized Country choropleth and the compact Country UI.

Therefore this file remains only as a historical execution record.

## Current authority

For current Stream Map work, read in this order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md` — normative product/data/UI semantics
3. `docs/product/stream-map-implementation-plan-v0.6.md` — active execution plan
4. `docs/product/current-roadmap.md` — current lane/status view
5. `docs/product/current-schedule.md` — immediate sequencing
6. relevant lane-specific contract
7. actual current `main` implementation/tests

If this historical snapshot conflicts with those records, the records above win.

## Historical principles retained

The following principles from this snapshot remain current because they are now carried by spec v0.7 and the active plan:

- Country, City, Kick, Current/IRL and Map UI are parallel lanes;
- weekly Top-20 reviewed-evidence maintenance is a maintenance sublane only;
- no City inference from Country;
- no Current inference from Home/Base;
- Twitch and Kick remain provider-separated;
- no language/timezone/name/category/IP geography inference;
- read-only audits, fixtures, CI and preview-only work need not wait for a maintenance cadence slot;
- collector/D1/schema/cadence/retention and production mutations remain separately gated.

No new implementation should cite this v0.1 snapshot as the current milestone or scheduling authority.
