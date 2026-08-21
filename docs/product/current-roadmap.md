# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-08-21

## Current repository truth

- audited main head before the Stream Map foundation branch: `df99141aced36be5236bf178720521bd81db4e33`
- PR #961 merged the dormant Kick History v2 generator package
- open Issue #962 is the current Kick History v2 decision gate
- Stream Map foundation work is isolated on `feature/twitch-stream-map-foundation`
- Stream Map specification: `docs/product/stream-map-spec-v0.3.md`
- Stream Map implementation plan: `docs/product/stream-map-implementation-plan-v0.2.md`

## Current product priority

Priority A is **Twitch Stream Map Stage 1**. Priority B is the existing Kick History v2 gated migration line. They remain separate branches/PRs.

```text
Priority A: Twitch Stream Map Stage 1
Priority B: Kick History v2 gated migration work
Later: City -> Current Location -> IRL -> Kick Map -> Location History / Replay
```

## Priority A — Twitch Stream Map

### Product role

```text
Heatmap      = Now
Day Flow     = Today
Battle Lines = Rivalry
History      = Trends
Stream Map   = Where
```

### Geographic rendering baseline

- MapLibre GL JS
- low-detail world/country/major-city basemap
- PMTiles/Protomaps-compatible delivery preferred
- no Google Maps requirement
- no street/address/venue detail in Stage 1

### Location truth rules

- never map language -> country
- never infer from timezone, schedule, display name, nationality or IP
- unknown remains unknown
- home/base and current location remain distinct
- every accepted location keeps source/provenance
- one streamer may have multiple accepted evidence records
- conflicting evidence is preserved rather than silently merged

### Location evidence sources

Initial platform-native candidates:
- account/profile description
- current stream title
- stream tags
- public channel/profile fields
- category/language only as context, never placement

Later only if coverage requires it:
- official external links
- manual review

### Source-aware UI requirement

The Map must support both combined and source-specific viewing.

Required source controls:
- All accepted
- Account/Profile
- Stream title
- Stream tags
- Channel profile
- External official link
- Manual review

Multiple source selections are required. v1 combination semantics are OR.

Required location-type controls:
- Home/base
- Declared country
- Current location

Multiple type selections are required.

Required visual provenance:
- source badges such as `PROFILE`, `TITLE`, `TAG`, `CHANNEL`, `EXTERNAL`, `REVIEWED`
- location-type badges such as `HOME`, `CURRENT`
- stable badge/ring colors plus visible legend
- bubble size remains viewers; do not overload the same visual channel with viewers, momentum and provenance

## Stage order

### M1 — Route skeleton
Add `/twitch/map/` without changing existing public navigation until route/build QA passes.

### M2 — World basemap and interaction
MapLibre world rendering, ViewLoom styling, country borders/labels, bounded pan/zoom and mobile-safe interaction.

### M3 — Multi-source location contract
Add normalized location plus multiple evidence records per streamer.

Normalized location:
```text
streamerId
provider
locationCountry
locationRegion?
locationCity?
locationType
locationConfidence
locationUpdatedAt
```

Evidence:
```text
evidenceId
streamerId
sourceType
sourceField
sourceText
sourceUrl?
observedAt
parsedCountry?
parsedCity?
claimType
confidence
status
```

### M4 — Twitch extraction audit
Inspect real observed Twitch profile/title/tag/channel fields and measure source yield, overlap and conflicts before broad enrichment.

Required output includes:
```text
observed_streamers
profile_candidates
title_candidates
tag_candidates
channel_candidates
accepted_country
accepted_city
current_location_candidates
conflicts
unknown
source_overlap
```

### M5 — Real Twitch live join
Join accepted evidence-backed locations to current live observations. Compute mapped/unmapped and source-aware coverage.

### M6 — Source badges + multi-select source/type filters
Add All/individual/multiple source filtering and multiple location-type filtering. Recalculate coverage after filters.

### M7 — Country clusters and drilldown
World -> country -> live streamer flow with provenance badges and evidence summary.

### M8 — General filters + Unmapped analysis
Category/language multi-select where practical, minimum viewers, Top N, mapped/unmapped/both and explicit unmapped reasons.

### M9 — Coverage Gate
Measure mapped coverage, mapped viewer coverage, source yield, source overlap, conflicts and current-location coverage.

If coverage is weak, improve evidence acquisition before City work. Never fill geography gaps with language placement.

### M10 — City
Reliable city records only; country-only records remain at country level.

### M11 — Current Location
Explicit fresh current-location evidence only; source and timestamp required.

### M12 — IRL mode
Only after current-location coverage is useful.

### M13 — Kick Map
Audit Kick source availability independently before porting.

### M14 — Location History / Replay
Only after live-map/source semantics are stable.

## Stream Map initial PR order

```text
Map PR-1 docs + /twitch/map/ route skeleton
Map PR-2 MapLibre world basemap + interaction
Map PR-3 normalized location + evidence contract
Map PR-4 Twitch source extraction audit
Map PR-5 real live join + source-aware coverage
Map PR-6 source badges + multi-select source/type filters
Map PR-7 country clusters + streamer drilldown
Map PR-8 general filters + unmapped analysis + mobile QA
```

## Priority B — Kick History v2 parallel line

Current Issue #962 remains the gated next step:
1. decision artifact/verifier/PR-only CI;
2. if GO, one disabled-by-default Draft active migration candidate;
3. prove selector semantics in CI;
4. leave active Wrangler production config unchanged;
5. no production v2 enablement, v1 disablement, cron/retention change, backfill, or History API/UI cutover without later explicit gate.

## Parallel-work boundary

- separate branch/PR per responsibility
- no Map PR changes Kick generator authority, collector cadence, retention or production D1 mutation behavior
- no Kick History PR opportunistically changes Map UI/contracts
- re-audit main/open PR/open Issue/Actions before each new implementation branch

## Invariants

- Twitch and Kick remain provider-separated
- existing collector cadence unchanged unless separately authorized
- no synthetic, name-only, language-derived or cross-provider geographic mapping
- no combined-provider Map totals/rankings during Twitch-first stages
- no current-location claim without explicit supporting evidence
- unknown/conflicting location remains visible and traceable
