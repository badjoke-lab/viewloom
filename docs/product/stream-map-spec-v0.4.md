# ViewLoom Stream Map Specification v0.4

Status: current authoritative specification  
Platform scope: Twitch first; Kick later and separately  
Current implementation baseline: main `17bbe766a79903436501b05dc1e4ccb0379aa00a`  
Last updated: 2026-08-22

## 1. Product role

Stream Map is ViewLoom's geographic observation view.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

The map must not imply that every observed streamer has a known physical location. Unknown, conflicting, candidate-only and rejected geography remains unmapped.

## 2. Current public surface

Twitch:

- page: `/twitch/map/`
- data API: `/api/twitch-stream-map`
- live population: latest observed Twitch Top 300 snapshot
- renderer: MapLibre GL JS
- world basemap: OpenFreeMap dark style
- current grouping: country-level markers and mapped-stream list

Kick has no authorized Stream Map surface yet. Twitch and Kick geography must not be aggregated.

## 3. Evidence vocabulary

Accepted evidence sources are kept distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location types:

```text
home_base
declared_location
current_location
```

Confidence values currently used by the map evidence contract include:

```text
explicit
corroborated
reviewed
candidate_only
```

`candidate_only` is not an accepted placement confidence.

## 4. Entity eligibility

A geographic claim and a mappable person are separate questions.

Entity kinds relevant to the current gate:

```text
person
organization
event_broadcast
unknown
```

Only `person` may be placed on the streamer map.

`organization` and `event_broadcast` remain part of observed/unmapped accounting but must not be placed as if the channel represented a person's residence or current physical position.

## 5. Claim eligibility

Placement-capable claims:

- explicit home/base
- explicit declared location
- explicit current location while the claim remains valid

Context-only claims do not place a streamer:

- birthplace
- nationality
- event venue
- organization headquarters
- future/planned travel

Examples:

- `LIVE FROM SEOUL` may create a current-location candidate.
- `Japan trip tomorrow` must not establish current location.
- `born in Osaka` must not establish current residence or current location.
- an esports event venue must not locate the organization/event channel as a person.

## 6. Prohibited inference

The following must never determine geographic placement:

- language
- timezone
- schedule
- inferred ethnicity/nationality
- name-based guesses
- IP geolocation
- category alone

Language/category may later filter or describe the observed population, but they do not create placement evidence.

## 7. Conflicts and provenance

One streamer may retain multiple evidence records.

Rules:

- evidence sources remain separate after normalization;
- agreeing evidence may coexist rather than being collapsed into one opaque source;
- conflicting accepted countries remain unmapped until explicitly resolved;
- current-location evidence never silently overwrites home/base evidence;
- source URL and observation time remain attributable where available.

## 8. Live join contract

PR #972 introduced the read-only live join.

The current API joins:

```text
latest DB_TWITCH_HOT.minute_snapshots payload
+ reviewed Twitch location evidence
by stable channelLogin identity
```

The API returns at least:

- observed streams/viewers
- mapped streams/viewers
- unmapped streams/viewers
- eligible unmapped count
- excluded non-person streams/viewers
- mapped country count
- current-location coverage
- mapped counts by evidence source
- unmapped reasons
- mapped stream records with distinct evidence records

No demo fallback may replace failed or empty real geography.

## 9. Source and type filters

PR #974 introduced the public source/type filtering UI.

### Source dimension

Multiple selected sources use OR semantics.

Example:

```text
Profile OR Title OR Tag
```

### Location-type dimension

Multiple selected types also use OR semantics.

Example:

```text
Home/base OR Current location
```

### Across dimensions

Source and type dimensions combine with AND semantics.

Example:

```text
(Profile OR Title) AND Current location
```

### Empty selection

No source selected and no type selected means:

```text
All accepted
```

Filtering recalculates the current view's:

- mapped stream count
- unmapped stream count
- mapped/unmapped viewers
- mapped country count
- current-location count
- visible markers and streamer/evidence rows

## 10. Badge semantics

Source provenance has stable visual differentiation. Current palette categories are:

- Account/Profile = blue
- Stream title = green
- Stream tag = amber
- Channel profile = cyan
- Official external = purple
- Manual review = pink/red

Location-type badges are visually separate from source provenance.

A streamer may display multiple source badges.

## 11. Coverage is dynamic, not a fixed target

Two production observations demonstrate that the live join changes with the current Top 300:

### 2026-08-21T16:45:07.733Z

- observed streams: 300
- observed viewers: 1,805,401
- mapped streams: 1
- mapped viewers: 17,893
- mapped countries: 1
- current-location streams: 0
- excluded non-person streams: 5
- mapped source: `official_external`

### 2026-08-22T01:55:42.393Z

- observed streams: 300
- observed viewers: 907,197
- mapped streams: 0
- mapped viewers: 0
- mapped countries: 0
- current-location streams: 0
- excluded non-person streams: 3

These are timestamped observations, not constants. Low coverage must remain visible rather than being filled by inference.

## 12. Acquisition boundary

The Stage 1D/A4.1 audit established:

- title/tags/language are available from existing `/helix/streams` collection payloads, although title/tags/language were not persisted for map placement;
- language is supporting context only;
- Twitch user description requires `/helix/users` and is an additional API request;
- a bounded Top 300 audit returned 300 requested profiles and 277 non-empty descriptions;
- native/profile extraction yielded only a small candidate set;
- a bounded external review sample did not justify a permanent unsupported social-link/panel crawler;
- Twitch social links/panels do not have a supported API surface used by ViewLoom.

Persistent external crawling must not be introduced merely to inflate map coverage.

## 13. Current completion state

Implemented and merged:

- source inventory/audit — #964
- read-only live probe — #965
- title/tag candidate extraction — #966
- entity/claim eligibility + A4.1 evidence record — #971
- real latest-snapshot join API — #972
- public route, MapLibre renderer, source/type filters and provenance badges — #974
- production route/API read verification — #975, closed without merge after successful verification

## 14. Next required gates

### Stage 1G — country selection and drilldown

Current country markers and country/stream lists exist. Next work must add a true selected-country state:

- marker/country-row selection
- selected country summary
- filtered streamer drilldown for that country
- clear selection
- source/type filters continue to apply
- home/base is never described as current physical location

### Stage 2 — Unmapped analysis

Expose reason-aware unmapped analysis, including at least:

- no reviewed evidence
- candidate-only/unaccepted evidence
- conflicting accepted evidence
- excluded non-person
- expired current-location evidence when that lifecycle is implemented

Category/language/min-viewer/Top-N controls may be added only with explicit semantics that preserve Top-N-before-geographic-filter behavior.

### Coverage expansion gate

Expand accepted evidence only through supported, attributable and reviewable sources. Do not use language or other inferred geography to meet a coverage target.

### Later stages

1. reliable city grouping
2. explicit fresh current-location mode
3. IRL-oriented views only if current-location coverage justifies them
4. separate Kick source audit and implementation
5. location history/replay after live semantics stabilize

## 15. Hard invariants

- no language-to-country placement
- no candidate-only placement
- no non-person-as-person placement
- no silent country conflict resolution
- no Twitch/Kick geographic aggregation
- no demo geography presented as real
- no coverage inflation by unsupported inference
- D1/schema/cadence/retention changes require separate review and are not implied by Stream Map UI work
