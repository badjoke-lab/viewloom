# ViewLoom Stream Map Specification v0.2

Status: implementation-authoritative for staged map work
Scope: Twitch first, Kick later

## 1. Purpose

Stream Map adds a geographic observation view to ViewLoom without pretending that all streamers have known real-world locations.

Existing roles remain:
- Heatmap = Now / audience field
- Day Flow = Today / daily field
- Battle Lines = Rivalry / comparison
- History = Trends / archive
- Stream Map = Where / geographic view

The map must never infer a physical country or city from language alone.

## 2. Initial public route

- `/twitch/map/` first
- `/kick/map/` only after the Twitch implementation and data-quality gate are accepted

Platforms remain separated. No combined Twitch + Kick map in v0.x.

## 3. Map engine and basemap

### 3.1 Renderer

Use MapLibre GL JS.

### 3.2 Basemap

Use a low-detail world basemap suitable for world -> country -> city viewing. Prefer a PMTiles/Protomaps-compatible source over Google Maps.

Initial map detail is intentionally limited:
- world outlines
- country borders
- country labels
- major city labels where available

Do not require roads, buildings, businesses, navigation, street imagery, or address detail for the first release.

### 3.3 Zoom policy

Initial stages should stop around country/city scale. Detailed local zoom is not a v1 requirement.

Only if reliable current-location data later exists at finer precision may a later stage permit more detailed zoom for those records.

## 4. Geographic truth model

Location fields are explicit and confidence-aware.

Suggested model:

```text
locationCountry
locationRegion
locationCity
locationType
locationSource
locationConfidence
locationUpdatedAt
```

`locationType` must distinguish at least:
- `home_country`
- `declared_country`
- `current_location`
- `unknown`

Rules:
- language must not be converted into a country
- timezone must not be converted into a country
- stream schedule must not be converted into a country
- names, nationality guesses, IP guesses, or inferred residence are prohibited
- unknown remains unknown

## 5. Stage 1 user experience: Country Map + Unmapped

Stage 1 is the minimum real-data product.

At page load the user sees:
- world map
- observed live-stream count
- mapped live-stream count
- unmapped live-stream count
- mapped viewer total
- mapped country count
- data freshness/state

Example:

```text
Observed 300
Mapped 64
Unmapped 236
Countries 21
Mapped viewers 183K
```

### 5.1 Country clusters

Known-country streams are aggregated by country.

A country cluster shows at minimum:
- country name
- live-stream count
- summed current viewers

Bubble size is based on current viewers with visual compression so one country cannot consume the map.

### 5.2 Selecting a country

Selecting a country zooms/focuses the map and opens a list of mapped live streams for that country.

Each row shows at minimum:
- streamer name
- viewers
- category
- language

### 5.3 Selecting a streamer

Selecting a streamer opens details:
- streamer
- viewers
- category
- language
- mapped country
- location type
- location source/confidence
- links into existing ViewLoom views where applicable

If the mapped record is only a home/declared country, the UI must explicitly state that it is not necessarily the streamer’s current physical location.

## 6. Unmapped live streams

Unmapped streams are not hidden.

The page must show how many observed live streams do not have reliable location data.

Unmapped streams may still be analyzed by:
- language
- category
- viewers
- momentum

Language is therefore a filter/analysis dimension, not a geographic placement mechanism.

## 7. Filters

Stage 1/2 filters may include:
- category
- language
- minimum viewers
- Top N observed scope

Top N semantics:
- first choose the observed Top N population
- then map only those members with accepted location data
- do not redefine Top N as “top among mapped streams”

This prevents mapped coverage from being misrepresented.

## 8. Interaction

Desktop:
- drag = pan
- wheel behavior should not unnecessarily trap page scrolling
- modified wheel or map-native zoom controls = zoom
- click/tap = select country or streamer

Mobile:
- tap = selection
- map interaction must not make normal page scrolling unusable
- if needed, use an explicit move-map mode consistent with existing ViewLoom mobile interaction policy

## 9. Data states

Reuse ViewLoom state vocabulary where possible:
- Fresh
- Partial
- Stale
- Empty
- Demo
- Error

Map-specific coverage must always be shown separately from collector freshness.

Example:

```text
Data: Fresh
Observed: 300
Mapped: 64
Mapped coverage: 21.3%
```

A fresh collector with low mapped coverage is not the same as partial collector data.

## 10. Progressive capability stages

### Stage 1 — Twitch Country Map + Unmapped
World map, country clusters, mapped/unmapped counts, country selection, streamer list.

### Stage 2 — Filters and detail polish
Category/language/viewer filters, streamer detail, navigation links, mobile behavior.

### Stage 3 — Country coverage expansion
Measure mapped coverage with real data; expand only through evidence-backed location records.

### Stage 4 — City Map
Add city-level grouping only for records with reliable city data. Country-only records remain at country level.

### Stage 5 — Current Location
Add current-location records only when explicitly and reliably supported. Current location must remain distinct from home/base location.

### Stage 6 — IRL mode
Use current-location records to provide a focused IRL geographic view when enough records exist.

### Stage 7 — Kick
Port the accepted model and UI only after Kick data availability is audited separately.

### Stage 8 — Location History / Replay
Store accepted location observations and optionally replay geographic activity through time.

## 11. Non-goals for initial implementation

Do not implement initially:
- Google Maps
- detailed street maps
- address-level display
- automatic language-to-country placement
- IP geolocation
- combined Twitch/Kick map
- city map before country-map acceptance
- current-location claims without evidence
- location history/replay before live-map data quality is accepted

## 12. Stage 1 acceptance criteria

Stage 1 is accepted only when:
- `/twitch/map/` renders a real world map
- pan/zoom works on desktop and mobile without breaking page usability
- country clusters render from accepted location records
- mapped/unmapped counts are explicit
- selecting a country lists its live streams
- location provenance is visible
- unknown streams remain visible in Unmapped analysis
- no language-to-country inference exists
- no Kick behavior changes
- no collector cadence/retention changes are introduced
- normal web build/typecheck gates pass
