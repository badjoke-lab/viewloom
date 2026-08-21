# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-21

## Current repository truth

- audited main head before the Stream Map foundation branch: `df99141aced36be5236bf178720521bd81db4e33`
- PR #961 merged the dormant Kick History v2 generator package
- open Issue #962 is the current Kick History v2 decision gate
- Stream Map foundation work is isolated on `feature/twitch-stream-map-foundation`
- Stream Map specification: `docs/product/stream-map-spec-v0.2.md`
- Stream Map implementation plan: `docs/product/stream-map-implementation-plan-v0.1.md`

## Current product priority

The highest-priority new product work is now **Twitch Stream Map Stage 1**.

The existing Kick History v2 hardening line continues in parallel, but Map and Kick History work must remain in separate branches/PRs and must not share runtime changes.

```text
Priority A: Twitch Stream Map Stage 1
Priority B: Kick History v2 gated migration work
Later: City -> Current Location -> IRL -> Kick Map -> Location History / Replay
```

## Priority A — Twitch Stream Map

### Product definition

Stream Map adds the geographic observation axis that the existing pages do not provide.

```text
Heatmap      = Now / who is large and moving
Day Flow     = Today / how the day changed
Battle Lines = Rivalry / who is competing
History      = Trends / what changed over time
Stream Map   = Where / where accepted mapped live activity is located
```

### Geographic rendering baseline

- renderer: MapLibre GL JS
- initial basemap: low-detail world/country/major-city map compatible with PMTiles/Protomaps-style delivery
- Google Maps is not required for Stage 1
- initial useful zoom is world -> country; city-level detail is a later stage
- streets, buildings, venues, addresses, and exact-location mapping are not required for Stage 1

### Location truth rules

- Twitch account/live API language is not geographic evidence
- never map `language -> country`
- never infer country from timezone, stream time, display name, or category
- unknown geography remains unknown
- home/declared country and current stream location are distinct fields
- every accepted mapped record keeps source/provenance and confidence/type

### Stage order

#### M1 — Route skeleton

Add `/twitch/map/` as an isolated ViewLoom route without changing existing public navigation until the route passes build and QA.

**Result:** the Map page exists without disturbing Heatmap, Day Flow, Battle Lines, History, Kick, or collectors.

#### M2 — World basemap and interaction

Add MapLibre world rendering, dark ViewLoom styling, country borders/labels, bounded pan/zoom, and mobile-safe interaction.

**Result:** a usable observation map exists before any location data is claimed.

#### M3 — Location record contract

Add the minimum evidence-backed model:

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

**Result:** country, city, home/base location, and current location can be added later without redefining the model.

#### M4 — Real Twitch live join

Join accepted country records to the existing Twitch live observation population using stable Twitch identity.

Required accounting:

```text
observed_streams
mapped_streams
unmapped_streams
mapped_percent
observed_viewers
mapped_viewers
mapped_viewer_percent
countries_represented
```

**Result:** real currently-live mapped Twitch streams appear without introducing a second collector.

#### M5 — Country clusters and drilldown

Add country bubbles/clusters, country selection, live streamer list, streamer detail, and location provenance.

**Result:** user flow becomes world -> country -> currently-live mapped streamer.

#### M6 — Filters and Unmapped analysis

Add Category, Language, minimum viewers, Top N observed scope, unmapped list/summary, and unmapped language/category breakdown.

**Result:** streams without reliable geography remain visible to the user instead of disappearing from the product.

#### M7 — Coverage Gate

Measure real production-like coverage before any city/current-location work.

Decision metrics:

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

**Result:** if coverage is useful, proceed; if coverage is too low, improve evidence-backed country acquisition first. Do not fill gaps using language-based placement.

#### M8 — City

Add city-level placement only for records with reliable city evidence. Country-only records remain visible at country level.

#### M9 — Current Location

Add explicit/reliable current stream locations as a separate mode. Current-location records require source and freshness; home country is never presented as current location.

#### M10 — IRL mode

Add an IRL/current-location-focused map only after current-location coverage is useful.

#### M11 — Kick Map

Audit Kick identity/live payload and location evidence separately, then port only the accepted Map semantics. No automatic Twitch->Kick mapping transfer.

#### M12 — Location History / Replay

Only after live-map semantics are stable, retain accepted historical location observations and optionally add time selection/replay.

## Stream Map Stage 1 PR order

```text
Map PR-1  docs + /twitch/map/ route skeleton
Map PR-2  MapLibre world basemap + interaction
Map PR-3  location contract + fixtures/tests
Map PR-4  real Twitch live join + mapped/unmapped accounting
Map PR-5  country clusters + streamer drilldown
Map PR-6  filters + unmapped analysis + mobile QA
```

Stage 1 is complete only when a user can:

1. open `/twitch/map/`;
2. see a usable world map;
3. understand observed vs mapped vs unmapped coverage;
4. see countries containing accepted mapped live streams;
5. select a country;
6. inspect currently live mapped streamers in that country;
7. inspect location provenance;
8. navigate back into existing ViewLoom analysis pages.

## Priority B — Kick History v2 parallel line

The Map priority does not cancel the current Kick History v2 hardening work.

Current truth from Issue #962:

- production v2 schema is accepted and present;
- the dormant v2 generator package is merged;
- production Kick collector remains v1-authoritative;
- v2 production generation remains disabled/unwired;
- Issue #962 is a decision gate for a disabled-by-default active migration candidate.

### Kick History execution order

1. complete Issue #962 decision artifact/verifier/PR-only CI;
2. if GO, prepare exactly one disabled-by-default Draft active migration candidate;
3. prove selector semantics in CI: absent/v1 -> v1 only, v2 -> v2 only, disabled -> neither, invalid -> fail closed;
4. keep active production Wrangler config unchanged in the candidate;
5. do not enable production v2, disable production v1, change cron/retention, backfill, or cut over History API/UI without a later explicit gate.

## Parallel-work boundary

Map and Kick History may progress in parallel only under these rules:

- separate branch and PR per responsibility;
- no Map PR may change Kick generator authority, collector cadence, retention, or production D1 mutation behavior;
- no Kick History PR may opportunistically change `/twitch/map/` UI or Map contracts;
- shared files require an explicit rebase/review before merge;
- re-audit current main/open PR/open Issue/Actions before each new implementation branch.

## Previously accepted Twitch category rollout

The earlier Twitch category rollout remains accepted history:

- final seven-day audit passed `2016 / 2016` slots with no missing or consecutive missing buckets;
- category-reference coverage was `0.995353` with zero unresolved category IDs and zero Twitch/Kick leakage;
- Twitch Heatmap Category + Top controls are public;
- accepted production SHA for that rollout was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- this acceptance does not authorize unrelated Day Flow, History, Kick category UI, Map inference, or cross-provider aggregation.

## Invariants

- Twitch and Kick remain provider-separated.
- Existing collector cadence remains unchanged unless separately authorized.
- No synthetic, name-only, language-derived, or cross-provider geographic mapping.
- No combined-provider Map totals/rankings during Twitch-first stages.
- No exact/current-location claim without explicit supporting evidence.
- Unknown location is a first-class state, not a failure to be hidden.
