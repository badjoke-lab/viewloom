# ViewLoom Stream Map Implementation Plan v0.2

Status: active implementation plan
Base feature: `docs/product/stream-map-spec-v0.3.md`
Primary platform: Twitch

## 1. Implementation principle

Build the map in the smallest useful increments, but treat location provenance as a first-class dimension from the start.

The first public milestone is:

```text
Twitch world map
+ country clusters
+ mapped/unmapped accounting
+ source badges
+ multi-select source/type filters
+ country -> streamer drilldown
```

Do not begin city/current-location/history work before the source/yield coverage gate.

## 2. Branch strategy

Foundation branch:

```text
feature/twitch-stream-map-foundation
```

Subsequent branches:

```text
feature/twitch-stream-map-route
feature/twitch-stream-map-renderer
feature/twitch-stream-map-location-contract
feature/twitch-stream-map-extraction-audit
feature/twitch-stream-map-real-data
feature/twitch-stream-map-source-filters
feature/twitch-stream-map-country-drilldown
feature/twitch-stream-map-mobile
fix/twitch-stream-map-qa
```

Do not work directly on `main`.

## 3. Stage 0 — Documentation and repository boundary

### Work
- add/update Stream Map spec and implementation plan
- confirm `/twitch/*` routing conventions
- confirm build/typecheck gates
- keep map code isolated from Kick History runtime work

### Done when
- authoritative docs exist in `docs/product/`
- implementation branch exists from audited main
- exact initial file scope is known

## 4. Stage 1A — Static map route

Create `/twitch/map/` with current ViewLoom shell and an explicit unconnected-data state.

Work:
- `apps/web/twitch/map/index.html`
- `apps/web/src/features/twitch-stream-map/`
- no nav exposure until route/build QA passes

Gate:
- build/typecheck pass
- existing Twitch/Kick pages unchanged

## 5. Stage 1B — Basemap and interaction

Renderer: MapLibre GL JS.
Basemap: low-detail world/country/major-city only.

Work:
- dark ViewLoom-compatible style
- country borders/labels
- major city labels where available
- initial world fit
- bounded zoom
- desktop/mobile pan/zoom

Gate:
- no Google Maps dependency
- no paid map API hard dependency
- no street/address requirement

## 6. Stage 1C — Multi-source location contract

### Goal
Create a normalized location model plus multiple evidence records per streamer.

Normalized record:
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

Evidence record:
```text
evidenceId
streamerId
provider
sourceType
sourceField
sourceText
sourceUrl?
observedAt
parsedCountry?
parsedRegion?
parsedCity?
claimType
confidence
status
```

Initial `sourceType` values:
- account_profile
- stream_title
- stream_tag
- channel_profile
- official_external_link
- manual_review

Rules:
- one streamer can retain multiple accepted evidence records
- conflicts are preserved
- current location never silently overwrites home/base in storage
- no language/timezone/name/IP inference

Gate:
- multiple evidence records supported
- provenance survives normalization
- conflicts and unknown are first-class

## 7. Stage 1D — Extraction audit before broad enrichment

### Goal
Measure what the platform-native fields actually yield before building a large manual location dataset.

Inspect for the observed Twitch population:
- account/user description
- channel/profile fields available in current/public Twitch API surfaces
- current stream title
- stream tags
- category and language only as context, never geographic placement

Produce source-by-source counts:
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
```

Also measure overlap:
```text
profile_only
 title_only
 tag_only
 profile+title
 profile+tag
 title+tag
 3+ sources
```

Gate:
- candidate extraction is proven against real observed payloads
- source yield and overlap are known
- ambiguous wording is rejected rather than forced

## 8. Stage 1E — Real Twitch live join + coverage accounting

Join accepted evidence-backed locations to current Twitch live observations by stable Twitch identity.

Compute:
- observed count
- mapped count
- unmapped count
- mapped viewer total
- mapped country count
- mapped coverage by source type
- current-location coverage

No demo data may be presented as real.

## 9. Stage 1F — Source badges and multi-select filters

### Required controls

Evidence-source multi-select:
- Account/Profile
- Stream title
- Stream tags
- Channel profile
- External official link
- Manual review

Location-type multi-select:
- Home/base
- Declared country
- Current location

Default source mode:
```text
All accepted
```

Combination semantics for v1: OR.
A streamer remains visible when at least one selected accepted evidence source supports the displayed location.

Work:
- source badge component
- stable badge colors
- legend
- multi-select desktop control
- compact mobile sheet/popover
- URL state after semantics stabilize

Gate:
- multiple source types can be selected simultaneously
- multiple location types can be selected simultaneously
- counts/coverage recalculate after filters
- streamer rows can show multiple badges

## 10. Stage 1G — Country clusters and drilldown

Work:
- country bubbles/clusters
- bubble size = compressed summed current viewers
- country selection/focus
- country summary
- streamer list
- streamer detail
- all accepted source badges and evidence summary visible

Gate:
- country -> streamer works PC/mobile
- home/base never described as current location

## 11. Stage 2 — General filters and Unmapped analysis

Add:
- category multi-select where practical
- language multi-select where practical
- minimum viewers
- Top N observed scope
- mapped / unmapped / both
- unmapped reasons: no candidate / candidate-only / conflict / expired current evidence

Critical semantics:
- language filters the population but never determines placement
- Top N is defined on observed population before geographic/source filtering

## 12. Stage 3 — Coverage and acquisition decision gate

Required report:
```text
observed_streams
mapped_streams
mapped_percent
observed_viewers
mapped_viewers
mapped_viewer_percent
countries_represented
unmapped_streams
source_yield_by_type
source_overlap
conflict_count
current_location_coverage
```

Decision:
- useful coverage -> proceed to city
- low coverage -> expand evidence acquisition first
- external official links/manual review only if justified by measured gap
- never fill gaps using language placement

## 13. Stage 4 — City

- add reliable city records
- country-only records remain visible at country level
- city clusters only where supported
- modestly increase zoom only as needed

## 14. Stage 5 — Current location

- only explicit/reliable current-location records
- source + observed timestamp required
- stale claims expire or visibly age
- current-location mode may prioritize current records for display only

## 15. Stage 6 — IRL mode

Only after enough current-location coverage exists.

## 16. Stage 7 — Kick

Audit Kick source fields and extraction yield separately. Do not assume Twitch source availability transfers.

## 17. Stage 8 — History / Replay

Only after live-map/source semantics are stable.

## 18. Initial PR sequence

```text
PR-1 docs + route skeleton
PR-2 MapLibre world basemap + interaction
PR-3 normalized location + evidence contract
PR-4 Twitch source extraction audit
PR-5 real live join + source-aware coverage
PR-6 source badges + multi-select source/type filters
PR-7 country clusters + drilldown
PR-8 general filters + unmapped analysis + mobile QA
```

No initial PR may:
- enable Kick History v2
- alter generator authority
- change collector cron/retention
- introduce cross-platform map aggregation
- infer country from language
- collapse conflicting sources into one untraceable value

## 19. Stage 1 completion definition

Stage 1 is complete when a user can:
1. open `/twitch/map/`
2. see a usable world map
3. understand observed/mapped/unmapped coverage
4. filter by one or multiple location evidence sources
5. filter by one or multiple location types
6. see source badges/colors on mapped streamers
7. select a country and inspect currently live streamers
8. inspect provenance/conflicts/unknown reasons
9. navigate into existing ViewLoom analysis pages
