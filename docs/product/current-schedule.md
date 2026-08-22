# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-22

```text
Current program Twitch Stream Map
Current stage Unmapped reason analysis
Accepted main d7155d3c9d9b6baa27997a2c019e6da03c1cb59a
Stage 1D source/yield audit complete
Stage 1E real live join complete PR #972
Stage 1F public route + source/type filters complete PR #974
Stage 1G country selection + drilldown complete PR #977
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
8. Passed Web typecheck/build, live-join verification, source-filter verification and existing Heatmap regression gates for #974.
9. Verified the deployed production route and API through read-only verification-only PR #975.
10. Closed #975 without merge after retaining production evidence.
11. Added true country selection and drilldown in PR #977: marker/row selection, selected-country summary, filtered streamer list, clear action, retained zero-result state and keyboard/tap button semantics.
12. Added a dedicated country-drilldown verifier to the normal Web checks; Typecheck, Build, live-join, source-filter, country-drilldown and existing Heatmap regression gates passed before merge.

## Accepted filter and drilldown semantics

```text
Sources: OR within selected sources
Types:   OR within selected types
Across dimensions: Sources AND Types
No selected source/type: All accepted
Country selection: drilldown only; never creates or changes accepted evidence
Selected country + evidence filters: country AND active evidence filter result
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

## Current order

### 1. Unmapped reason analysis — CURRENT

Expose reason-aware accounting from the existing real API contract and make the unmapped population inspectable without inventing geography.

At minimum support public handling of:

```text
no_reviewed_evidence
candidate_only_or_unaccepted
conflicting_evidence
excluded_nonperson
expired_current_location (after current-location lifecycle exists)
```

Required behavior:

- keep reason totals consistent with the real API population;
- distinguish excluded non-person rows from otherwise eligible unmapped people;
- do not convert candidates or conflicts into placement;
- preserve evidence provenance and source vocabulary;
- define a truthful zero/unknown state when a reason has no rows;
- verify desktop/mobile and keyboard/tap behavior for any interactive reason controls.

### 2. Population-filter decision

Only after reason-aware Unmapped behavior is stable, decide category/language/min-viewer/Top-N controls.

Required ordering must be explicit before implementation. Language remains population metadata only and never creates placement.

### 3. Evidence coverage decision

Repeat live coverage evidence and decide whether supported/reviewable acquisition should expand.

Low coverage is not itself authorization for inferred placement or unsupported crawling.

### 4. Later stages

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

A prior snapshot observed one mapped stream. Treat both as live observations, not fixed expected counts. PR #977 changed client-side drilldown behavior only; it did not change collector cadence, D1, evidence acceptance or the API placement contract.

## Hard stops

- No geography from language/timezone/name/category/IP.
- No candidate-only placement.
- No non-person channel placement as a person.
- No silent conflict resolution.
- No Twitch/Kick geographic aggregation.
- No demo fallback geography.
- No unsupported external crawling solely to improve coverage.
- No collector cadence, retention, D1 schema or binding change without a separate accepted gate.
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
