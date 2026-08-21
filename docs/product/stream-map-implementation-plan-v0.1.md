# ViewLoom Stream Map Implementation Plan v0.1

Status: active implementation plan
Base feature: `docs/product/stream-map-spec-v0.2.md`
Primary platform: Twitch

## 1. Implementation principle

Build the map in the smallest useful increments. Do not start with city/current-location/history work.

The first milestone is only:

```text
Twitch world map
+ country clusters
+ mapped/unmapped accounting
+ country -> streamer drilldown
```

The map must be independently developable and must not require changes to Kick History runtime, collector cadence, retention, or production generator selection.

## 2. Branch strategy

Foundation branch:

```text
feature/twitch-stream-map-foundation
```

Subsequent branches should stay narrowly scoped:

```text
feature/twitch-stream-map-route
feature/twitch-stream-map-renderer
feature/twitch-stream-map-country-model
feature/twitch-stream-map-real-data
feature/twitch-stream-map-filters
feature/twitch-stream-map-mobile
fix/twitch-stream-map-qa
```

Do not work directly on `main`.

## 3. Stage 0 — Documentation and repository boundary

### Work
- add Stream Map spec
- add this implementation plan
- confirm `/twitch/*` routing conventions
- confirm build/typecheck gates
- keep map code isolated from current collector/runtime work

### Done when
- both docs exist in `docs/product/`
- implementation branch exists from audited current main
- exact initial file scope is known

## 4. Stage 1A — Static map route

### Goal
Create `/twitch/map/` without connecting real stream/location data yet.

### Work
- add `apps/web/twitch/map/index.html`
- add page shell matching current Twitch pages
- add map-specific feature module under `apps/web/src/features/twitch-stream-map/`
- add only the dependencies needed for the map renderer
- render an empty/fixture world map
- preserve existing global navigation until the route itself passes build/QA

### User-visible result
The user can open `/twitch/map/` and see a functioning world map with ViewLoom styling, pan, zoom and an explicit “location data not connected yet” state.

### Gate
- build passes
- typecheck passes
- existing Twitch pages unchanged
- Kick pages unchanged

## 5. Stage 1B — Basemap and interaction

### Goal
Make the geographic surface production-usable before adding streamer data.

### Renderer
- MapLibre GL JS

### Basemap
- low-detail world basemap compatible with PMTiles/Protomaps-style delivery
- world/country/major-city detail only

### Work
- dark ViewLoom-compatible style
- country borders
- country labels
- optional major-city labels
- initial world fit
- bounded zoom appropriate to world/country/city use
- desktop pan/zoom
- mobile tap/pan behavior that does not destroy page scrolling

### Gate
- map renders without Google Maps
- no street/address requirement
- desktop and mobile interaction accepted
- no third-party paid API dependency introduced as a hard requirement

## 6. Stage 1C — Location record contract

### Goal
Create the smallest evidence-backed location model.

### Model
At minimum:

```text
streamerId
provider
locationCountry
locationRegion?
locationCity?
locationType
locationSource
locationConfidence
locationUpdatedAt
```

### Rules
- no language -> country inference
- no timezone inference
- unknown remains unknown
- current location is distinct from home/declared country

### Initial source
Use only accepted, explicit records. The first stage may use a small curated/fixture-compatible dataset to prove the contract before any larger enrichment workflow.

### Gate
- schema/model supports future city/current-location stages without redefinition
- unknown is first-class
- provenance is retained

## 7. Stage 1D — Real Twitch live join

### Goal
Join accepted country records to the already-observed Twitch live population.

### Work
- read the existing Twitch live snapshot/page payload rather than inventing a second collector
- match streamers by stable Twitch identity
- compute:
  - observed count
  - mapped count
  - unmapped count
  - mapped viewer total
  - mapped country count
- aggregate mapped streams by country

### User-visible result
The map shows real currently-live Twitch observations for streamers with accepted country data.

Example:

```text
Observed 300
Mapped 64
Unmapped 236
Countries 21
Mapped viewers 183K
```

### Gate
- real live data confirmed
- mapped/unmapped counts reconcile to observed scope
- no demo data is presented as real
- mapped coverage is explicit

## 8. Stage 1E — Country cluster drilldown

### Work
- bubble/cluster per country
- bubble size from summed current viewers with compression
- click/tap country -> focus country
- show country summary
- show live streamer list
- click streamer -> details

### Streamer detail
- name
- viewers
- category
- language
- mapped country
- location type
- source/confidence
- links to Heatmap/Day Flow/Battle Lines/History where appropriate

### Gate
- country -> streamer flow works on PC/mobile
- home/declared country is never described as exact current location

## 9. Stage 2 — Filters and Unmapped analysis

### Work
- category filter
- language filter
- minimum viewers
- Top N observed scope
- unmapped list/summary
- unmapped language/category breakdown

### Critical semantics
Filters may change the observed population, but language never determines geographic placement.

### Gate
- Top N is based on observed population before geographic filtering
- mapped percentage is recalculated correctly after filters

## 10. Stage 3 — Country coverage gate

Before city/current-location work, measure actual production-like coverage.

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
```

Decision:
- if coverage is useful, proceed to city/current-location work
- if coverage is too low, improve evidence-backed country acquisition first
- do not fake missing geography with language placement

## 11. Stage 4 — City

Only after the country gate.

- add reliable city records
- country-only records remain visible at country level
- city clusters appear only where data supports them
- zoom limit may increase modestly

## 12. Stage 5 — Current location

Only explicit/reliable current-location records.

- current location overrides home/base only in current-location mode
- current location has source and timestamp
- stale current-location claims must expire or visibly age

## 13. Stage 6 — IRL mode

Only after enough current-location data exists.

- focus on streams/categories where geography is meaningful
- show live current-location clusters
- retain explicit mapped coverage

## 14. Stage 7 — Kick

Audit Kick identity/live payload and location-record coverage separately.

Do not assume Twitch mappings or source rules transfer automatically.

## 15. Stage 8 — History / Replay

Only after live-map semantics are stable.

- retain accepted historical location observations
- provide date/time selection
- optional map replay

## 16. Initial PR sequence

Recommended first PRs:

```text
PR-1 docs + route skeleton
PR-2 MapLibre world basemap + interaction
PR-3 location contract + test fixtures
PR-4 real Twitch live join + coverage accounting
PR-5 country clusters + drilldown
PR-6 filters + unmapped analysis + mobile QA
```

No PR in this initial sequence may:
- enable Kick History v2
- alter Kick generator authority
- change collector cron
- expand retention
- introduce cross-platform map aggregation
- claim current location from country/home data

## 17. Stage 1 completion definition

Stage 1 is complete when a user can:
1. open `/twitch/map/`
2. see a usable world map
3. understand observed vs mapped vs unmapped coverage
4. see countries containing accepted mapped live streams
5. select a country
6. inspect the currently live mapped streamers in that country
7. inspect location provenance
8. navigate back into existing ViewLoom analysis pages

Only after this is accepted do city/current-location/IRL stages begin.
