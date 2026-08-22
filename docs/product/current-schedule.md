# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-22

```text
Current program Twitch Stream Map
Current stage Population filter implementation
Accepted main 07eca2c291e4a7c4744a3c9a95013f307c44a9cb
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter ordering decision frozen docs/product/stream-map-population-filter-decision-v0.1.md
Production route/API verification complete PR #975 closed without merge
Twitch Map public route /twitch/map/
Twitch Map real API /api/twitch-stream-map
Kick Map not authorized
Twitch cadence */5 * * * * unchanged
Kick cadence */5 * * * * unchanged
```

## Completed Stream Map execution

1. Audited Twitch location evidence source availability and persistence boundaries in PR #964.
2. Added a bounded read-only live probe in PR #965.
3. Added title/tag candidate extraction and rejected future/planned travel wording in PR #966.
4. Ran temporary non-production profile/external acquisition work and closed #970 without merge.
5. Accepted person/entity and claim eligibility rules plus retained A4.1 evidence in PR #971.
6. Added the read-only latest-snapshot + reviewed-evidence join in PR #972.
7. Added `/twitch/map/`, MapLibre, six source filters, three type filters, provenance badges and live country markers in PR #974.
8. Verified the deployed production route and API through read-only verification-only PR #975, then closed it without merge.
9. Added true country selection and drilldown in PR #977.
10. Added reason-aware Unmapped analysis in PR #979.
11. PR #979 preserves exact API reason codes, exposes excluded non-person rows, separates `filtered_out_accepted_evidence` as client-view accounting, and verifies both API and current-view reason reconciliation.
12. Audited population-filter data availability: viewer counts and category refs are already retained; language is not retained in the permanent snapshot payload.
13. Frozen population ordering in `docs/product/stream-map-population-filter-decision-v0.1.md`.

## Accepted evidence and drilldown semantics

```text
Sources: OR within selected sources
Types:   OR within selected types
Across evidence dimensions: Sources AND Types
No selected source/type: All accepted
Country selection: drilldown only; never creates or changes accepted evidence
Selected country + evidence filters: country AND active evidence-filter result
Selected country with zero matches: retain selection and show explicit zero state
```

Exact source vocabulary:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Exact type vocabulary:

```text
home_base
declared_location
current_location
```

## Accepted population ordering

```text
latest real Twitch Top 300 snapshot
-> overall Top N
-> minimum-viewer threshold
-> category
-> server-side placement gate
-> client-side evidence source/type filters
-> country drilldown
```

Initial public control contract:

```text
Top N        20 | 50 | 100 | 300
Min viewers  any | 100 | 500 | 1,000 | 5,000 | 10,000
Category     all | one observed Twitch category
Language     deferred; current permanent snapshot does not retain it
```

`Top 100 + category X` means category-X rows inside the overall current Top 100. It does not refill from ranks 101-300.

## Current order

### 1. Population filter implementation — CURRENT

Implement the contract in:

- `docs/product/stream-map-spec-v0.5.md`
- `docs/product/stream-map-implementation-plan-v0.4.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`

Required implementation boundary:

- population selection happens in `/api/twitch-stream-map` before mapping because the browser does not receive every unmapped row;
- reuse existing `category-source-v1` refs and `provider_category_dictionary`;
- no second category collector;
- no language control in this gate;
- category unknown/unavailable states must be explicit;
- mapped + unmapped must equal selected population;
- API unmapped-reason totals must equal selected-population unmapped count;
- source/type filtering still happens after population selection;
- country remains drilldown-only.

### 2. Evidence coverage decision

After population controls are stable, repeat live coverage evidence across meaningful accepted population scopes.

Measure at minimum:

- selected population streams/viewers;
- mapped streams/viewers;
- countries;
- source yield and overlap;
- conflicts;
- excluded non-person;
- current-location coverage.

Low coverage is not authorization for inferred placement or unsupported crawling.

### 3. Later stages

- reliable city grouping;
- current-location freshness/expiry;
- IRL-oriented mode only if coverage is useful;
- separate Kick audit and implementation;
- history/replay after live semantics stabilize.

## Latest production observation

Route-verification API snapshot retained from PR #975:

```text
updatedAt                 2026-08-22T01:55:42.393Z
observedStreams           300
observedViewers           907197
mappedStreams             0
unmappedStreams           300
excludedNonPersonStreams  3
excludedNonPersonViewers  73654
mappedCountryCount        0
currentLocationStreams    0
coveredPages              3
hasMore                   true
```

A prior snapshot observed one mapped stream. Treat both as live observations, not fixed expected counts.

## Hard stops

- No geography from language/timezone/name/category/IP.
- No category-to-country inference.
- No candidate-only placement.
- No non-person channel placement as a person.
- No silent conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo fallback geography.
- No unsupported external crawling solely to improve coverage.
- No client-only population filtering that cannot reconcile unmapped reasons.
- No language UI until an accepted snapshot persistence contract actually retains language.
- No collector cadence, retention, D1 schema, binding or acquisition change without a separate accepted gate.
- No automatic Kick Map rollout from Twitch acceptance.

## Retained category-program state

Phase 12A-5B-R2 Twitch category stability + Heatmap public rollout remains completed. Its historical acceptance records remain valid and should not be rewritten by Stream Map work.

## Historical category schedule anchors

The following strings are retained for completed category-rollout verifiers only; they are not the current execution schedule.

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
Twitch public category filter active yes
keep #623 open as the parent category program
```
