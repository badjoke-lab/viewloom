# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-08-22

## Current execution state

```text
Current program Twitch Stream Map
Current stage Population filter implementation
Accepted main 07eca2c291e4a7c4744a3c9a95013f307c44a9cb
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter ordering frozen docs/product/stream-map-population-filter-decision-v0.1.md
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
7. `docs/audits/twitch-stream-map-stage1e-1f-production-2026-08-22.md`
8. affected feature specification/plan and current WIP/handoff

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

Evidence filter and drilldown semantics:

```text
source selections: OR
type selections: OR
source dimension AND type dimension
empty source/type selection: All accepted
country selection: drilldown only
selected country AND active evidence filters
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

Accepted population ordering for the next implementation:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> server-side entity/evidence placement
-> client-side evidence source/type filters
-> country drilldown
```

Initial population controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred; current permanent snapshot does not retain it
```

Placement invariants:

- candidate-only evidence does not map;
- language does not map;
- category does not map;
- organization/event-broadcast channels do not map as people;
- context-only birthplace/nationality/event-venue/org-HQ claims do not map;
- conflicting accepted countries remain unmapped;
- country selection does not create or change accepted evidence;
- provenance remains separated by source;
- no demo geography substitutes for failed real data;
- Twitch and Kick geography remain separated.

## Completed reason-aware Unmapped gate

PR #979 added:

- exact API reason-code display;
- base API unmapped vs current evidence-view unmapped accounting;
- client-only `filtered_out_accepted_evidence` for accepted mapped rows hidden by source/type filters;
- explicit excluded organization/event-broadcast rows;
- baseline and current-view reason reconciliation;
- zero/error states;
- a dedicated verifier plus stronger live-join reason-total assertions.

Candidate-only evidence remains within the API's current `context_only_or_unaccepted_evidence` class unless the API itself is explicitly changed.

## Population-filter data availability

The current Twitch snapshot contract already retains:

- viewer counts;
- `category-source-v1` category IDs/references;
- category names through `provider_category_dictionary`.

It does not retain language in the permanent `minute_snapshots` item contract. Therefore language is not part of the first Stream Map population-control implementation.

The implementation must reuse the existing category contract and must not add a second category collector or additional Twitch API request.

## Current order

1. Implement server-side population filters and matching public controls.
2. Repeat supported-source coverage evidence across meaningful population scopes.
3. Add reliable city grouping only if evidence supports it.
4. Add current-location freshness/expiry before emphasizing current location.
5. Add IRL mode only if current-location coverage becomes useful.
6. Audit and implement Kick separately.
7. Add location history/replay only after live semantics stabilize.

## Latest retained production Stream Map verification

Verification-only PR #975 observed at `2026-08-22T01:55:42.393Z`:

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
- PR #741 repaired the rejected 390px mobile overflow without changing semantics;
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

## Historical category acceptance anchors

The following retained strings describe the completed category rollout only. They are preserved for historical acceptance verifiers and do not override the current Stream Map execution state above.

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json
```
