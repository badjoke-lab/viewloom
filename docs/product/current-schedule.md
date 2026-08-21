# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-08-21

## Current baseline

```text
Audited main head: c81ba53769b50263e6f4b6e4930146b551422381
PR #961 Kick History v2 dormant generator package: merged
Issue #962 Kick History v2 active migration decision: open
Stream Map foundation PR: #963
Stream Map foundation branch: feature/twitch-stream-map-foundation
Stream Map spec: docs/product/stream-map-spec-v0.3.md
Stream Map implementation plan: docs/product/stream-map-implementation-plan-v0.2.md
Stage 1D final live audit: docs/audits/twitch-stream-map-stage1d-location-yield-2026-08-21.md
Temporary Stage 1D Worker-preview PR #968: evidence frozen; close without merge
Twitch collector cadence: unchanged
Kick collector cadence: unchanged
Production Twitch Worker: unchanged by Stage 1D audit
Production Kick History authority: v1
Production Kick History v2 runtime: disabled/unwired
```

## Execution model

```text
LINE A — highest-priority product work
Twitch Stream Map

LINE B — parallel hardening work
Kick History v2 gated migration
```

Never combine both responsibilities in one implementation PR.

## LINE A — Twitch Stream Map schedule

### A0 — docs/boundary — COMPLETE ON FOUNDATION BRANCH

- [x] Stream Map spec/plan created
- [x] current roadmap/schedule synced
- [x] `/twitch/*` routing/build surface confirmed
- [x] Map/Kick-History boundary recorded
- [x] multi-source evidence, badges and multi-select filter requirements added

### A1 — Map PR-1: `/twitch/map/` route skeleton — COMPLETE ON FOUNDATION BRANCH

- [x] create `apps/web/twitch/map/index.html`
- [x] initial feature module under `apps/web/src/features/twitch-stream-map/`
- [x] current Twitch/ViewLoom shell
- [x] explicit unconnected-data state
- [x] no collector/runtime change in the route work

Gate: build/typecheck pass; existing Twitch/Kick pages unchanged.

### A2 — Map PR-2: MapLibre world basemap + interaction — COMPLETE ON FOUNDATION BRANCH

- [x] MapLibre GL JS
- [x] low-detail world basemap
- [x] country context/labels through the selected basemap
- [x] bounded world/country zoom
- [x] desktop/mobile-safe interaction baseline
- [x] no Google Maps or street/address dependency

### A3 — Map PR-3: normalized location + multi-source evidence contract — COMPLETE ON FOUNDATION BRANCH

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
parsedRegion?
parsedCity?
claimType
confidence
status
```

Initial source types:
```text
account_profile
stream_title
stream_tag
channel_profile
official_external_link
manual_review
```

Gate: multiple evidence records per streamer, conflicts retained, unknown first-class, no language/timezone/name/IP inference.

### A4 — Map PR-4: Twitch source extraction audit — COMPLETE; NATIVE COVERAGE WEAK

Real observed Twitch data was audited through a non-production Cloudflare Worker version preview. Final frozen sample:

```text
observed_streamers = 300 stream rows
unique_users = 299
profile_candidates = 3
title_candidates = 0
tag_candidates = 7
channel_candidates = 0 independent native field
any_candidates = 10
candidate_conflicts = 1
candidate_unknown = 290
home_or_base_candidates = 1
declared_country_candidates = 3
current_location_candidates = 0
ambiguous_candidates = 7
accepted_country_streamers = 3
accepted_country_evidence_records = 4
accepted_city_streamers = 0
accepted_current_location_streamers = 0
native_mapped_percent_after_review = 1.00%
```

Required audit metrics:
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
profile_only
title_only
tag_only
profile+title
profile+tag
title+tag
3+_sources
```

Gate result:
- [x] actual source yield measured
- [x] source overlap measured
- [x] ambiguous wording reviewed
- [x] generic title false-positive cue removed
- [x] claim types separated (`home_or_base`, `declared_country`, `current_location`, `ambiguous`)
- [x] language never used for placement
- [x] bounded candidate review frozen
- [x] production D1 writes = 0
- [x] production Worker deployment = none

Decision: native accepted coverage is only 1.00%, so **do not treat A4 as sufficient evidence for a broad map rollout**. The measured gap authorizes an acquisition-improvement audit before relying on A5/A7 public coverage.

### A4.1 — Evidence acquisition expansion — NEXT

Measured Stage 1D weakness justifies the previously deferred sources:
- official external links attributable to the streamer/channel
- bounded manual review with retained provenance
- any independently proven public channel/profile geographic source

Required constraints:
- no language/timezone/name/IP inference
- no tag-only acceptance without corroboration
- no current-location claim from home/base or origin evidence
- source/type retained per accepted evidence record
- acquisition cost and API/request burden measured before persistence or recurring collection

Gate: demonstrate materially better accepted-country coverage on a bounded sample before broad real-live map publication work proceeds.

### A5 — Map PR-5: real Twitch live join + source-aware coverage — BLOCKED ON A4.1 COVERAGE IMPROVEMENT

- join accepted evidence-backed locations to current Twitch live observations
- stable Twitch identity only
- no second Twitch collector

Required metrics:
```text
observed_streams
mapped_streams
unmapped_streams
mapped_percent
observed_viewers
mapped_viewers
mapped_viewer_percent
countries_represented
source_yield_by_type
current_location_coverage
```

A bounded join may be used for measuring acquisition experiments, but broad/public live-join work must not imply useful coverage while accepted native coverage is ~1%.

### A6 — Map PR-6: source badges + multi-select source/type filters

Required evidence source filter:
```text
All accepted
Account/Profile
Stream title
Stream tags
Channel profile
External official link
Manual review
```

Multiple source selections required. v1 combination semantics = OR.

Required location-type filter:
```text
Home/base
Declared country
Current location
```

Multiple type selections required.

Required visual provenance:
```text
PROFILE
TITLE
TAG
CHANNEL
EXTERNAL
REVIEWED
HOME
CURRENT
```

Use stable badge/ring colors and visible legend. Bubble size remains viewers.

Gate: multiple source/type selection works, streamer can show multiple badges, counts/coverage recalculate correctly.

### A7 — Map PR-7: country clusters + drilldown

- country bubble/cluster
- country focus
- summary
- currently-live streamer list
- source/type badges
- evidence summary
- links to existing ViewLoom analysis

Gate: world -> country -> streamer works desktop/mobile; home/base never presented as current location.

### A8 — Map PR-8: general filters + Unmapped analysis + mobile QA

- category multi-select where practical
- language multi-select where practical
- minimum viewers
- Top N observed scope
- mapped / unmapped / both
- unmapped reason: no candidate / candidate-only / conflict / expired current evidence
- mobile/browser/accessibility QA

Critical rule: language filters population only; never geographic placement.

### A9 — Coverage / acquisition gate — REQUIRED BEFORE CITY

Measure:
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
- useful coverage -> A10 City
- weak coverage -> improve evidence acquisition first
- external official links/manual review only if measured gap justifies them
- never fill gaps with language placement

Stage 1D has already established a native-source warning baseline of 1.00% accepted streamer coverage. A9 still remains the formal pre-City decision after the acquisition/live-join work.

### A10 — City
Reliable city records only. Country-only records remain visible at country level.

### A11 — Current Location
Explicit fresh current-location evidence only; source/timestamp required; stale claims expire or visibly age.

### A12 — IRL mode
Only after current-location coverage is useful.

### A13 — Kick Map
Audit Kick account/channel/title/tag source availability and yield separately.

### A14 — Location History / Replay
Only after live-map/source semantics and storage cost are accepted.

## LINE B — Kick History v2 parallel schedule

### B1 — Issue #962 decision — CURRENT
Decision artifact/verifier/PR-only CI only. No production activation or mutation.

### B2 — disabled-by-default Draft candidate — ONLY IF #962 = GO

Required selector semantics:
```text
absent + enabled -> v1 only
v1 + enabled -> v1 only
v2 + enabled -> v2 only
enabled false -> neither
invalid selector -> fail closed to neither
```

Active Wrangler production config remains unchanged.

### B3 — later production migration gate — NOT AUTHORIZED
Separate future decision required.

## Near-term interleaving

```text
1. A4.1 acquisition expansion audit
2. B1 #962 decision gate
3. freeze acquisition source yield / request cost / acceptance rules
4. if materially improved, A5 real Twitch join + source-aware coverage
5. B2 Draft migration candidate only if B1 = GO
6. A6 source badges + multi-select filters
7. A7 country drilldown only when accepted coverage is useful enough to display honestly
8. A8 general filters + unmapped + mobile QA
9. A9 formal coverage/acquisition gate
10. choose further acquisition improvement or A10 City from measured results
```

## Merge and hard-stop rules

- no direct implementation work on `main`
- one responsibility per branch/PR
- Map and Kick History remain separate
- re-audit main/open PR/open Issue/Actions before each new branch
- no `language -> country` placement
- no current-location claim from home/base country
- no silent conflict collapse
- no tag-only placement acceptance without corroboration
- no combined Twitch+Kick Map totals in Twitch-first stages
- no automatic Kick Map rollout
- no automatic Kick History v2 production activation
- no collector cadence/retention expansion from Map work
- no City/Current/IRL before A9 decision
- temporary Stage 1D Worker-preview tooling must not be merged into production solely to preserve audit machinery
