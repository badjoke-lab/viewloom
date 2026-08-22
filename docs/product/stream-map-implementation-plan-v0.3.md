# ViewLoom Stream Map Implementation Plan v0.3

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.4.md`  
Current implementation baseline: main `17bbe766a79903436501b05dc1e4ccb0379aa00a`  
Last updated: 2026-08-22

## 1. Current position

The Twitch Stream Map is no longer a foundation-only feature. The current public path and real-data contract are implemented and production-verified.

Completed sequence:

1. source inventory and collection-state audit — PR #964
2. read-only Twitch live probe — PR #965
3. title/tag candidate extraction and ambiguity rejection — PR #966
4. non-production profile/external acquisition audit — temporary #970, closed without merge
5. entity/claim placement eligibility + retained A4.1 evidence — PR #971
6. latest real Twitch snapshot join API — PR #972
7. public `/twitch/map/` route + MapLibre + source/type filters + badges — PR #974
8. production route/API verification — temporary #975, closed without merge

## 2. Accepted current architecture

```text
Twitch collector
  -> DB_TWITCH_HOT latest minute_snapshots
  -> /api/twitch-stream-map read-only live join
     + reviewed location evidence
     + entity/claim placement gate
  -> /twitch/map/
     + MapLibre world map
     + country markers
     + mapped/unmapped accounting
     + source/type multi-select
     + provenance badges/evidence rows
```

Do not add a parallel geography collector merely for the UI.

## 3. Completed Stage 1D — source/yield audit

Accepted conclusions:

- title/tag candidates can be inspected from Twitch live data without using language for placement;
- user descriptions require the separate `/helix/users` request surface;
- profile/title/tag/native sources do not currently provide broad accepted coverage;
- ambiguous/future travel wording is rejected;
- external/public review can add evidence but a bounded sample did not justify a permanent unsupported crawler;
- candidate evidence is not accepted placement.

No collector cadence, retention or schema change was authorized by this audit.

## 4. Completed Stage 1E — real live join

PR #972 is the accepted implementation.

Join key:

```text
channelLogin
```

Input:

```text
latest real Twitch minute snapshot
+ reviewed Twitch evidence
```

Output contract:

```text
viewloom-stream-map-live-v1
```

Required accounting invariants:

```text
mapped + unmapped = observed
excluded non-person is a subset of unmapped
candidate-only placement = false
language placement = false
conflicting accepted countries mapped = false
```

## 5. Completed Stage 1F — public route and source/type filters

PR #974 is the accepted implementation.

Current controls:

Evidence source:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location type:

```text
home_base
declared_location
current_location
```

Combination rule:

```text
(source A OR source B ...)
AND
(type A OR type B ...)
```

No selection means `All accepted`.

Current UI recalculates mapped/unmapped streams and viewers and redraws visible country markers/evidence rows after filtering.

## 6. Production evidence gate completed

Verification-only PR #975 confirmed the deployed production route and API after #974.

The deployed HTML contained:

- six `data-location-source` inputs
- three `data-location-type` inputs
- `official_external`
- `current_location`

The production API passed strict real-data semantics.

Latest acceptance observation:

```text
updatedAt 2026-08-22T01:55:42.393Z
observedStreams 300
observedViewers 907197
mappedStreams 0
unmappedStreams 300
excludedNonPersonStreams 3
excludedNonPersonViewers 73654
mappedCountryCount 0
currentLocationStreams 0
coveredPages 3
hasMore true
```

An earlier observation had one mapped stream. Coverage therefore changes with the live Top 300 and must never be frozen into UI/demo expectations.

## 7. Next: Stage 1G — true country selection and drilldown

Current markers summarize countries, but marker click only provides a navigation aid. The next implementation must create a real selected-country interaction.

### Work

- selected-country state in the map client
- select from marker or country summary row
- selected-country summary: country, mapped streams, viewers, evidence-source distribution
- country streamer list restricted to selected country
- clear-country control
- selected state survives source/type filter changes where still valid
- if filters remove all evidence for the selected country, show an explicit empty result rather than silently switching countries
- accessible keyboard/tap selection
- desktop/mobile layout verification

### Gate

- country -> live streamer drilldown is real, not just scroll/focus decoration
- source/type filters continue to govern evidence eligibility
- evidence provenance remains visible
- home/base and current location remain semantically distinct
- zero mapped countries is a valid state

## 8. Stage 2 — Unmapped analysis

After Stage 1G, expose why current streams are not mapped.

Required reason classes:

```text
no_reviewed_evidence
candidate_only_or_unaccepted
conflicting_evidence
excluded_nonperson
expired_current_location
```

The exact API may retain more detailed internal reasons, but public labels must not imply unsupported conclusions.

Add population filters only after their ordering is explicit:

1. choose observed Top N
2. apply category/language/min-viewer population filters as specified
3. apply evidence source/type filters
4. compute mapped/unmapped for that selected population

Language remains a population filter only, never a location source.

## 9. Stage 3 — evidence coverage decision

Do not start broad manual enrichment by default.

Required repeated report:

- observed streams/viewers
- mapped streams/viewers
- mapped percentage
- countries represented
- source yield
- source overlap
- non-person exclusions
- conflicts
- current-location coverage

Decision outcomes:

- if supported sources improve coverage sufficiently, continue structured acquisition;
- if coverage remains low, preserve the low-coverage product honestly and prioritize analysis value rather than inventing geography;
- do not add unsupported Twitch social/panel crawling merely to raise the number.

## 10. Stage 4 — City

Only accepted country/city evidence may create city-level grouping.

- country-only records remain valid at country level;
- a city label without a reliable country context must not be forced;
- map zoom/detail may increase only as required by accepted city records.

## 11. Stage 5 — Current location

Only explicit, attributable, time-bounded current-location evidence.

Required before public current-location emphasis:

- observation timestamp
- freshness/expiry rule
- home/base retained separately
- stale current location expires or is visibly aged

## 12. Stage 6 — IRL mode

Do not implement until current-location coverage is materially useful.

## 13. Stage 7 — Kick

Run a separate Kick source audit. Do not copy Twitch field availability or yield assumptions.

Kick implementation must preserve provider separation and must not create combined Twitch/Kick country totals.

## 14. Stage 8 — History / Replay

Only after live placement, conflicts, freshness and source semantics are stable.

## 15. PR boundaries

Near-term PR sequence:

```text
PR-A Stage 1G country selection/drilldown
PR-B Unmapped reason analysis
PR-C population filters if contract is accepted
PR-D evidence coverage decision package
```

Each PR should be narrow and merge only after relevant Web checks and production acceptance boundaries are satisfied.

## 16. Hard stops

No Stream Map PR may implicitly:

- infer geography from language/timezone/name/category;
- treat candidate-only evidence as placement;
- place organizations/event broadcasts as people;
- silently resolve country conflicts;
- introduce Twitch/Kick geographic aggregation;
- add collector persistence/cadence/retention/schema changes without separate review;
- substitute demo geography for failed real data;
- create unsupported external crawling solely for coverage growth.
