# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-22

## Current execution state

```text
Current program Twitch Stream Map
Current stage 1G country selection + drilldown
Accepted main 17bbe766a79903436501b05dc1e4ccb0379aa00a
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Production route/API verification complete PR #975 closed without merge
Public Twitch Map /twitch/map/
Real Twitch Map API /api/twitch-stream-map
Kick Map not authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/product/stream-map-spec-v0.4.md`
5. `docs/product/stream-map-implementation-plan-v0.3.md`
6. `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`
7. affected feature specification/plan and current WIP/handoff

For historical 12A/category rollout work, retain and consult the accepted 12A audit/decision files. They remain valid historical records but are no longer the current execution milestone.

## Current Stream Map contract

Public Twitch Stream Map behavior is evidence-backed and provider-separated.

Evidence source vocabulary:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location type vocabulary:

```text
home_base
declared_location
current_location
```

Filter semantics:

```text
source selections: OR
type selections: OR
source dimension AND type dimension
empty selection: All accepted
```

Placement invariants:

- candidate-only evidence does not map;
- language does not map;
- organization/event-broadcast channels do not map as people;
- context-only birthplace/nationality/event-venue/org-HQ claims do not map;
- conflicting accepted countries remain unmapped;
- provenance remains separated by source;
- no demo geography substitutes for failed real data;
- Twitch and Kick geography remain separated.

## Latest production Stream Map verification

Verification-only PR #975 confirmed that the deployed `/twitch/map/` HTML contains all six source controls and all three type controls and that the real API contract remains strict.

At `2026-08-22T01:55:42.393Z` the live API observed:

```text
300 streams
907197 viewers
0 mapped streams
300 unmapped streams
3 excluded non-person streams
73654 excluded non-person viewers
0 mapped countries
0 current-location streams
```

A prior live snapshot had one mapped stream, demonstrating that map coverage moves with the current Top 300 and is not a fixed fixture.

## Current order

1. Implement true selected-country state and country-to-streamer drilldown.
2. Add reason-aware Unmapped analysis.
3. Decide population filters only after ordering semantics are explicit.
4. Repeat supported-source coverage evidence before any acquisition expansion.
5. Add city/current-location/IRL only after their evidence gates justify them.
6. Audit and implement Kick separately.
7. Add location history/replay only after live semantics stabilize.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`
- `docs/product/stream-map-spec-v0.4.md`
- `docs/product/stream-map-implementation-plan-v0.3.md`

## Retained Twitch category rollout

The completed Twitch category/Heatmap rollout remains a historical accepted milestone:

- final seven-day audit accepted `2016 / 2016` expected slots;
- category-reference coverage was `0.995353`;
- PR #740 exposed Category + Top;
- PR #741 repaired the rejected 390px mobile overflow;
- accepted production SHA was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- no Kick category UI was authorized by that Twitch rollout.

## Operational runbooks

- `docs/operations/kick-fixture-removal-runbook.md` — inspect and remove only Kick `source_mode=fixture` validation rows before production acceptance.

## Global invariants

- Provider-scoped identities remain provider-separated.
- No combined-provider geography, category totals or rankings unless separately specified and accepted.
- Twitch/Kick collectors remain on existing five-minute cadences unless a separate gate changes them.
- No retention expansion, backfill, D1/binding change, or production mutation is implied by UI work.
- Current-main documents and accepted contracts override cached handoffs and superseded draft PR documents.
