# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-08-21

## Current repository truth

- audited current main head: `c81ba53769b50263e6f4b6e4930146b551422381`
- PR #961 merged the dormant Kick History v2 generator package
- open Issue #962 is the current Kick History v2 decision gate
- Stream Map foundation work is isolated on PR #963 / `feature/twitch-stream-map-foundation`
- Stream Map specification: `docs/product/stream-map-spec-v0.3.md`
- Stream Map implementation plan: `docs/product/stream-map-implementation-plan-v0.2.md`
- final Twitch Stage 1D live audit: `docs/audits/twitch-stream-map-stage1d-location-yield-2026-08-21.md`
- Stage 1D temporary Worker-preview tooling is PR #968 and is not production authority

## Current product priority

Priority A is **Twitch Stream Map evidence acquisition after Stage 1D**. Priority B is the existing Kick History v2 gated migration line. They remain separate branches/PRs.

```text
Priority A: Twitch Stream Map Stage 1 evidence acquisition
Priority B: Kick History v2 gated migration work
Later: honest live join -> source filters -> country drilldown -> coverage gate -> City -> Current Location -> IRL -> Kick Map -> Location History / Replay
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
- home/base, declared country and current location remain distinct
- every accepted location keeps source/provenance
- one streamer may have multiple accepted evidence records
- conflicting evidence is preserved rather than silently merged
- tag-only country names remain ambiguous unless independently corroborated

### Location evidence sources

Platform-native sources audited in Stage 1D:
- account/profile description
- current stream title
- stream tags
- public channel/profile fields
- category/language only as context, never placement

Stage 1D measured result on the final 300-row live sample:

```text
profile candidates = 3
title candidates = 0
tag candidates = 7
independent native channel geographic field = 0
candidate streams = 10 / 300 = 3.33%
accepted streamers after bounded review = 3 / 300 = 1.00%
accepted country evidence records = 4
accepted city records = 0
accepted current-location records = 0
candidate conflicts = 1
```

The measured native-source gap now justifies the previously deferred acquisition sources:
- official external links attributable to the streamer/channel
- bounded manual review with retained provenance
- any separately proven public channel/profile geographic source

These sources are now **next**, not optional future decoration, because the native accepted coverage is only 1.00%.

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

### M1 — Route skeleton — COMPLETE ON FOUNDATION BRANCH
Add `/twitch/map/` without changing existing public navigation until route/build QA passes.

### M2 — World basemap and interaction — COMPLETE ON FOUNDATION BRANCH
MapLibre world rendering, ViewLoom styling, country context, bounded pan/zoom and mobile-safe interaction.

### M3 — Multi-source location contract — COMPLETE ON FOUNDATION BRANCH
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

### M4 — Twitch extraction audit — COMPLETE
Real Twitch profile/title/tag/channel surfaces were measured through a non-production Worker version preview. Candidate source text was reviewed only for the bounded candidate set; noncandidate raw text was not persisted.

Final required output:
```text
observed_streamers = 300
profile_candidates = 3
title_candidates = 0
tag_candidates = 7
channel_candidates = 0 independent native field
accepted_country_streamers = 3
accepted_country_evidence_records = 4
accepted_city = 0
current_location_candidates = 0
candidate_conflicts = 1
candidate_unknown = 290
accepted_unmapped = 297
native_accepted_mapped_percent = 1.00%
```

M4 decision: native evidence is insufficient for broad map coverage. Proceed to M4.1 acquisition improvement rather than pretending M5/M7 already has useful coverage.

### M4.1 — Evidence acquisition expansion — CURRENT

Audit separately attributable sources, beginning with official external links and bounded manual review. Measure:

```text
source availability
source yield
new accepted-country yield
source overlap
conflicts
request/API cost
review burden
provenance quality
```

Hard constraints:
- no language/timezone/name/IP inference
- no tag-only acceptance without corroboration
- no current-location claim from origin/home evidence
- no recurring collection or storage expansion before cost/yield are measured

### M5 — Real Twitch live join — BLOCKED ON M4.1
Join accepted evidence-backed locations to current live observations. Compute mapped/unmapped and source-aware coverage. A bounded experimental join may support acquisition measurement, but broad/public join work must not imply useful coverage while accepted native coverage is ~1%.

### M6 — Source badges + multi-select source/type filters
Add All/individual/multiple source filtering and multiple location-type filtering. Recalculate coverage after filters.

### M7 — Country clusters and drilldown
World -> country -> live streamer flow with provenance badges and evidence summary. Do not treat this as broadly useful until accepted coverage supports it.

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

## Stream Map implementation order from current state

```text
COMPLETE  Map PR-1 docs + /twitch/map/ route skeleton
COMPLETE  Map PR-2 MapLibre world basemap + interaction
COMPLETE  Map PR-3 normalized location + evidence contract
COMPLETE  Map PR-4 Twitch source extraction audit
CURRENT   Map PR-4.1 evidence acquisition expansion
BLOCKED   Map PR-5 real live join + source-aware coverage
LATER     Map PR-6 source badges + multi-select source/type filters
LATER     Map PR-7 country clusters + streamer drilldown
LATER     Map PR-8 general filters + unmapped analysis + mobile QA
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
- Stage 1D temporary Worker-preview tooling is not production authority and must not be merged merely to preserve audit machinery
