# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-22

## Current execution state

```text
Current program Twitch Stream Map
Current stage Evidence coverage decision
Accepted main f707b7053be1b6fecc07bb93a26b8d9abb3ebabc
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter contract frozen PR #980
Population filter runtime complete PR #981
Production coverage audit PR #982 verification-only / close without merge
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
4. `docs/product/stream-map-spec-v0.5.md`
5. `docs/product/stream-map-implementation-plan-v0.4.md`
6. `docs/product/stream-map-population-filter-decision-v0.1.md`
7. latest accepted Stream Map audit under `docs/audits/`
8. affected feature specification/plan and current WIP/handoff

For historical 12A/category rollout work, retain and consult the accepted 12A audit/decision files. They remain valid historical records but are no longer the current execution milestone.

## Current Stream Map contract

Public Twitch Stream Map behavior is evidence-backed and provider-separated.

Evidence sources:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location types:

```text
home_base
declared_location
current_location
```

Population order:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side entity/evidence placement
-> client-side evidence source/type filters
-> country drilldown
```

Public population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred; permanent minute snapshot does not retain it
```

Evidence-filter semantics:

```text
source selections: OR
type selections: OR
source dimension AND type dimension
empty source/type selection: All accepted
```

Country semantics:

```text
country selection: drilldown only
selected country AND active population/evidence result
selected country with zero matches: retain selection and show explicit zero state
```

Reason-aware Unmapped semantics:

```text
API unmappedReasons describe the selected server-side population
sum(API unmappedReasons) = API unmappedStreams
source/type filters may derive filtered_out_accepted_evidence
sum(current-view reasons) = current-view unmapped streams
country selection does not alter unmapped accounting
```

Placement invariants:

- candidate-only evidence does not map;
- language does not map;
- category does not map;
- organization/event-broadcast channels do not map as people;
- context-only birthplace/nationality/event-venue/org-HQ claims do not map;
- conflicting accepted countries remain unmapped;
- provenance remains separated by source;
- no demo geography substitutes for failed real data;
- Twitch and Kick geography remain separated.

## Completed population-filter gate

PR #981 added server-side population selection and matching public controls.

Accepted guarantees:

- category refs are reconstructed before Top-N slicing;
- category cannot refill from below the selected overall Top-N boundary;
- category unknown/unavailable states are explicit;
- selected-population streams/viewers are the placement denominator;
- mapped + unmapped equals selected population;
- API reason totals reconcile with selected-population unmapped count;
- source/type filtering and country drilldown remain downstream;
- language remains unavailable as a population control;
- no second category collector or additional Twitch API request was introduced.

PR #981 passed the dedicated population verifier together with Typecheck, Build, prior Stream Map gates and Heatmap regressions.

## Current order

1. Complete verification-only PR #982 and retain its production population-coverage evidence.
2. Decide whether supported/reviewable evidence acquisition should expand.
3. Add reliable city grouping only if accepted evidence supports it.
4. Add current-location freshness/expiry before emphasizing current location.
5. Add IRL mode only if current-location coverage becomes useful.
6. Audit and implement Kick separately.
7. Add location history/replay only after live semantics stabilize.

## Coverage-decision boundary

Measure Top 20/50/100/300, meaningful minimum-viewer scopes and current high-volume categories. Record mapped streams/viewers, countries, source yield/overlap, conflicts, excluded non-person and current-location coverage.

Weak coverage is not permission to infer geography from language/category/name/timezone/IP or to add unsupported Twitch social/panel crawling.

## Latest retained production Stream Map verification

Until PR #982 is accepted, the retained pre-population-filter observation remains PR #975 at `2026-08-22T01:55:42.393Z`:

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

A prior live snapshot had one mapped stream. Coverage is dynamic and must not be frozen into a fixture expectation.

## Accepted permanent product records

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`
- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`

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
- No retention expansion, backfill, D1/binding change, acquisition expansion or production mutation is implied by UI/API work.
- Current-main documents and accepted contracts override cached handoffs and superseded draft PR documents.
