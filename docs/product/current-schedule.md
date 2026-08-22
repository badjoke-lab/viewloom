# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-22

```text
Current program Twitch Stream Map
Current stage Evidence coverage decision
Accepted main f707b7053be1b6fecc07bb93a26b8d9abb3ebabc
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
Stage 2 reason-aware Unmapped analysis complete PR #979
Population filter decision frozen PR #980
Population filters complete PR #981
Population coverage production audit PR #982 verification-only / do not merge
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
10. Added reason-aware Unmapped analysis and reason reconciliation in PR #979.
11. Audited population-filter data availability and froze ordering/contracts in PR #980.
12. Added public server-side population filters in PR #981.
13. PR #981 implements overall Top N, minimum viewers and category before placement, while evidence source/type filters and country drilldown remain downstream.
14. PR #981 reuses existing `category-source-v1` refs and `provider_category_dictionary`; it adds no collector, D1 schema, cadence, retention or Twitch acquisition change.
15. PR #981 passed Typecheck, Build, Stream Map live-join/source-filter/country-drilldown/Unmapped/population-filter gates and all existing Heatmap regressions before merge.

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

Public controls:

```text
Top N        20 | 50 | 100 | 300
Min viewers  any | 100 | 500 | 1,000 | 5,000 | 10,000
Category     all | one observed Twitch category
Language     deferred; current permanent snapshot does not retain it
```

`Top 100 + category X` means category-X rows inside the overall current Top 100. It does not refill from ranks 101-300.

Population API rules accepted in PR #981:

- population selection occurs in `/api/twitch-stream-map` before placement;
- category refs are reconstructed against their original snapshot row index before Top-N slicing;
- `category=all` retains rows with missing category;
- unknown selected category returns an explicit zero population;
- unavailable category contract plus a selected category returns explicit zero rather than silently using all categories;
- mapped + unmapped equals the selected population;
- API unmapped-reason totals equal selected-population unmapped count;
- source/type filters still happen after population selection;
- country remains drilldown-only.

## Current order

### 1. Evidence coverage decision — CURRENT

Repeat live production coverage evidence across meaningful accepted population scopes after PR #981.

Temporary verification-only PR #982 is the current measurement vehicle and must be closed without merge after its artifact is retained.

Measure at minimum:

- selected population streams/viewers;
- mapped streams/viewers and percentages;
- represented countries;
- mapped source yield;
- source overlap among mapped streams;
- `conflicting_accepted_evidence` count;
- excluded non-person streams/viewers;
- current-location streams/percentage;
- category coverage state and unknown-category rows.

Required scopes include:

- Top 20 / 50 / 100 / 300;
- meaningful minimum-viewer thresholds;
- current high-volume category slices drawn from the accepted category contract.

Decision outcomes:

- if supported/reviewable evidence produces useful coverage, define a bounded acquisition expansion separately;
- if coverage remains weak, retain the low-coverage product honestly and improve analysis/inspection value rather than inventing geography;
- no unsupported crawler or inferred placement is authorized by weak coverage.

### 2. Later stages

Only after the coverage decision:

- reliable city grouping if evidence supports it;
- current-location freshness/expiry;
- IRL-oriented mode only if current-location coverage is useful;
- separate Kick source audit and implementation;
- history/replay after live semantics stabilize.

## Latest retained production observation

The last retained pre-population-filter production verification remains PR #975 until the #982 artifact is accepted:

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
- Temporary production coverage audit PR #982 is verification-only and must not be merged merely to retain the workflow.

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
