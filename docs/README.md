# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-21

## Current execution state

```text
Audited main before Stream Map foundation: df99141aced36be5236bf178720521bd81db4e33
PR #961 Kick History v2 dormant generator package merged
Issue #962 Kick History v2 migration decision open
Primary new-product line: Twitch Stream Map Stage 1
Stream Map foundation branch: feature/twitch-stream-map-foundation
Stream Map spec: docs/product/stream-map-spec-v0.2.md
Stream Map implementation plan: docs/product/stream-map-implementation-plan-v0.1.md
Kick History production authority: v1
Kick History v2 runtime: disabled/unwired
Twitch/Kick collector cadence unchanged
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/product/stream-map-spec-v0.2.md` when working on Stream Map
5. `docs/product/stream-map-implementation-plan-v0.1.md` when working on Stream Map
6. affected feature specification/plan and current WIP/handoff
7. accepted audit/evidence files relevant to the implementation line being changed

## Current work lines

### Line A — Twitch Stream Map

Current execution order:

```text
A1 /twitch/map route skeleton
A2 MapLibre world basemap + interaction
A3 location contract + fixtures/tests
A4 real Twitch live join + mapped/unmapped accounting
A5 country clusters + streamer drilldown
A6 filters + unmapped analysis + mobile QA
A7 measured coverage gate
A8 City only if coverage gate supports it
A9 Current Location
A10 IRL mode
A11 Kick Map
A12 Location History / Replay
```

Rules:

- no language -> country inference;
- no timezone/name/category geographic inference;
- unknown remains unknown;
- home/declared country and current location remain distinct;
- Map work must not change collector cadence, retention, Kick generator authority, or production D1 mutation behavior.

### Line B — Kick History v2

Current gate is Issue #962.

Execution order:

```text
B1 #962 decision artifact/verifier/PR-only CI
B2 disabled-by-default Draft migration candidate only if B1 = GO
B3 later production migration gate — not authorized yet
```

Hard boundaries:

- production v2 enablement is not authorized;
- production v1 disablement is not authorized;
- active Wrangler v2 selection is not authorized;
- cron/retention change is not authorized;
- History API/UI cutover and Twitch rollout are not authorized by #962.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Accepted Twitch category rollout

The earlier Twitch category rollout remains accepted historical evidence:

- final seven-day audit accepted `2016 / 2016` expected slots with coverage `1.0`, zero missing buckets, zero consecutive missing buckets, category-reference coverage `0.995353`, zero unresolved category IDs, and zero Twitch/Kick leakage;
- PR #737 authorized hidden Twitch Heatmap filter revalidation only;
- five hidden production scenarios passed and were accepted in PR #739;
- PR #740 exposed Category + Top on the normal `/twitch/heatmap/` route;
- PR #741 repaired the rejected 390px mobile overflow candidate;
- accepted production SHA for that rollout: `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- that acceptance does not authorize unrelated Map inference, Kick category UI, Day Flow category UI, History category UI, or cross-provider aggregation.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Invariants

- Provider-scoped identity remains provider-separated.
- Synthetic, name-only, language-derived, and cross-provider geographic/category mapping remain prohibited.
- No combined-provider category or Stream Map totals/rankings during Twitch-first work.
- Twitch/Kick remain separated on existing collector cadences unless separately authorized.
- No retention expansion, backfill, or implicit D1/binding change from Stream Map work.
- Before each new implementation branch, re-audit current main, open PRs, open issues, and relevant Actions.
- Current roadmap/schedule and accepted contracts override cached handoffs.
