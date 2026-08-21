# ViewLoom Stream Map Specification v0.3

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
- no combined Twitch + Kick map in v0.x

## 3. Map engine and basemap

### Renderer
Use MapLibre GL JS.

### Basemap
Use a low-detail world basemap suitable for world -> country -> city viewing. Prefer PMTiles/Protomaps-compatible delivery over Google Maps.

Initial detail:
- world outlines
- country borders
- country labels
- major city labels where available

Do not require roads, buildings, businesses, navigation, street imagery, or address detail for the first release.

### Zoom policy
Initial stages stop around country/city scale. Finer zoom is unlocked only if later current-location records justify it.

## 4. Geographic truth model

Location is evidence-backed and multi-source. One streamer may have multiple location evidence records at the same time.

### 4.1 Normalized location

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

`locationType` must distinguish at least:
- `home_country`
- `declared_country`
- `current_location`
- `unknown`

### 4.2 Evidence records

Do not collapse provenance into one `locationSource` string. Store one or more evidence records.

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

`sourceType` initial values:
- `account_profile`
- `stream_title`
- `stream_tag`
- `channel_profile`
- `official_external_link`
- `manual_review`

Later providers may add provider-specific source types, but they must map into this shared vocabulary.

`claimType`:
- `home_or_base`
- `declared_country`
- `current_location`
- `ambiguous`

`status`:
- `candidate`
- `accepted`
- `rejected`
- `expired`

Rules:
- language must not be converted into a country
- timezone must not be converted into a country
- stream schedule must not be converted into a country
- names, nationality guesses, IP guesses, or inferred residence are prohibited
- a title such as `Japan trip tomorrow` is not current location
- a language tag such as `Japanese` is not geographic evidence
- unknown remains unknown

## 5. Location extraction sources

The extraction pipeline should inspect all available public source candidates rather than assuming one canonical source.

### 5.1 Account/profile text
Useful mainly for home/base claims such as `Based in Berlin`.

### 5.2 Current stream title
Useful for current-location candidates such as `LIVE FROM SEOUL` or `Walking around Shibuya`.

### 5.3 Stream tags
Geographic tags may create candidates. Language tags do not.

### 5.4 Channel/profile fields
Provider-specific public channel profile fields may create home/base or declared-country candidates.

### 5.5 Official external links
Only later if required by coverage. They must remain separately attributable and must not silently override platform-native evidence.

### 5.6 Multiple evidence records
If profile, title and tag all point to the same place, keep all accepted evidence records. Do not discard the fact that multiple sources support the location.

If sources conflict, preserve the conflict and do not silently merge them. Current-location evidence may take display priority only in a current-location mode and only while fresh.

## 6. Source-aware user controls

Source selection is a first-class Map control.

### 6.1 Default

```text
Location sources: All accepted
```

This shows every mapped record supported by any accepted source.

### 6.2 Multi-select filter
Users can select one or more evidence sources simultaneously.

Initial options:
- Account/Profile
- Stream title
- Stream tags
- Channel profile
- External official link
- Manual review

Examples:

```text
[✓] Account/Profile
[✓] Stream title
[ ] Stream tags
[ ] External official link
```

Semantics:
- default combination is OR: show a streamer if at least one selected accepted source supports the displayed location
- an optional later `Require all selected` mode may provide AND semantics, but is not required for first release
- source filters must update mapped count, mapped viewer total and coverage metrics

### 6.3 Location-type multi-select
Separate from evidence source.

Options:
- Home/base
- Declared country
- Current location

Multiple selection is required. Source and location type are independent dimensions.

Example:

```text
Sources: [Profile] [Title] [Tags]
Types:   [Home/base] [Current]
```

## 7. Badges and visual differentiation

Every selected streamer and drilldown row must make provenance visible without opening raw evidence.

Suggested badge vocabulary:
- `PROFILE`
- `TITLE`
- `TAG`
- `CHANNEL`
- `EXTERNAL`
- `REVIEWED`
- `CURRENT`
- `HOME`

A streamer may display multiple source badges.

Example:

```text
Streamer A   Japan   [PROFILE] [TAG]
Streamer B   Seoul   [TITLE] [CURRENT]
```

### 7.1 Color usage
Use a stable palette by evidence source or location type, but do not overload the same color channel with viewers/momentum/source simultaneously.

Recommended priority:
- bubble size = viewers
- primary bubble fill = location type or neutral ViewLoom map color
- source provenance = badge color / ring / small marker segment
- momentum, if shown later, must use a separate secondary encoding

The legend must always explain badge/ring colors.

## 8. Stage 1 user experience: Country Map + Unmapped

At page load the user sees:
- world map
- observed live-stream count
- mapped live-stream count
- unmapped live-stream count
- mapped viewer total
- mapped country count
- source coverage summary
- data freshness/state

Example:

```text
Observed 300
Mapped 64
Unmapped 236
Countries 21
Mapped viewers 183K
Sources: Profile 31 · Title 18 · Tag 22
```

### Country clusters
Known-country streams are aggregated by country. A country cluster shows country name, live-stream count and summed current viewers.

### Selecting a country
Selecting a country focuses the map and opens mapped live streams for that country. Each row shows streamer, viewers, category, language, location type and source badges.

### Selecting a streamer
Streamer detail shows:
- streamer
- viewers
- category
- language
- mapped country/city
- location type
- all accepted source badges
- evidence summary
- confidence/freshness
- links into existing ViewLoom views

If only home/base evidence exists, state explicitly that this is not necessarily the current physical location.

## 9. Unmapped live streams

Unmapped streams are not hidden. Show count and breakdown by language/category/viewers.

Unmapped reason values should distinguish at least:
- no location candidate
- candidate only / not accepted
- conflicting evidence
- expired current-location evidence

Language is analysis/filter metadata, never geographic placement.

## 10. Filters

Required Map filters:
- location evidence source multi-select
- location type multi-select
- category multi-select where practical
- language multi-select where practical
- minimum viewers
- Top N observed scope
- mapped/unmapped/both view

Top N semantics:
- choose observed Top N first
- then apply geographic/source filters
- never redefine Top N as top among mapped only

Filter state should be URL-shareable once the control set is stable.

## 11. Interaction

Desktop:
- drag = pan
- normal page scrolling must not be unnecessarily trapped
- map controls / modified wheel = zoom
- click/tap = select country or streamer

Mobile:
- tap = selection
- map interaction must not make normal page scrolling unusable
- explicit move-map mode may be used
- source/type multi-select opens in a compact sheet/popover rather than overflowing horizontally

## 12. Data states and coverage

Reuse ViewLoom states:
- Fresh
- Partial
- Stale
- Empty
- Demo
- Error

Map-specific coverage is separate from collector freshness.

Required coverage metrics:
```text
Observed
Mapped
Unmapped
Mapped coverage
Mapped viewers
Source coverage by source type
Current-location coverage
```

## 13. Progressive capability stages

### Stage 1 — Twitch Country Map + Unmapped
World map, country clusters, mapped/unmapped, country drilldown, source badges.

### Stage 2 — Source/type filters + analysis
Multi-select source filters, multi-select location types, category/language filters, viewer threshold, unmapped reasons.

### Stage 3 — Extraction pipeline + coverage expansion
Inspect account/profile, title, tags and channel profile; create candidates; review/accept/reject; measure source-by-source yield and conflicts.

### Stage 4 — City Map
Add city grouping only for reliable city records. Country-only records remain at country level.

### Stage 5 — Current Location
Use explicit fresh current-location evidence. Current location remains distinct from home/base.

### Stage 6 — IRL mode
Use current-location records where geography is meaningful.

### Stage 7 — Kick
Audit Kick fields/sources separately and reuse only proven shared semantics.

### Stage 8 — Location History / Replay
Store accepted historical location observations and optionally replay activity through time.

## 14. Non-goals for initial implementation

Do not initially implement:
- Google Maps
- detailed street maps
- address-level display
- automatic language-to-country placement
- IP geolocation
- combined Twitch/Kick map
- silent conflict resolution
- current-location claims without evidence

## 15. Stage 1 acceptance criteria

Stage 1 is accepted only when:
- `/twitch/map/` renders a real world map
- pan/zoom works on desktop/mobile
- country clusters render from accepted location records
- mapped/unmapped counts are explicit
- source badges are visible
- source filtering supports multiple selected source types
- location-type filtering supports multiple selected types
- selecting a country lists its live streams with provenance
- unknown/conflicting streams remain visible in Unmapped analysis
- no language-to-country inference exists
- no Kick behavior changes
- normal build/typecheck gates pass
