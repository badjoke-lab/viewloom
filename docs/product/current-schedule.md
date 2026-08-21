# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-21

## Current baseline

```text
Audited main head before Stream Map foundation: df99141aced36be5236bf178720521bd81db4e33
PR #961 Kick History v2 dormant generator package: merged
Issue #962 Kick History v2 active migration decision: open
Stream Map foundation branch: feature/twitch-stream-map-foundation
Stream Map spec: docs/product/stream-map-spec-v0.2.md
Stream Map implementation plan: docs/product/stream-map-implementation-plan-v0.1.md
Twitch collector cadence: unchanged
Kick collector cadence: unchanged
Production Kick History authority: v1
Production Kick History v2 runtime: disabled/unwired
```

## Execution model

Two independent work lines are active.

```text
LINE A — highest-priority product work
Twitch Stream Map

LINE B — parallel hardening work
Kick History v2 gated migration
```

The two lines may alternate, but they must not be combined into one implementation PR.

## LINE A — Twitch Stream Map schedule

### A0 — documentation and boundary — COMPLETE ON FOUNDATION BRANCH

- [x] create `feature/twitch-stream-map-foundation`
- [x] add `docs/product/stream-map-spec-v0.2.md`
- [x] add `docs/product/stream-map-implementation-plan-v0.1.md`
- [x] confirm `/twitch/*` routing convention
- [x] confirm web build/typecheck surface
- [x] record Map/Kick-History separation

**Outcome:** implementation can start from an explicit product contract instead of ad-hoc Map code.

### A1 — Map PR-1: `/twitch/map/` route skeleton — NEXT

Scope:

- create `apps/web/twitch/map/index.html`;
- create the initial map feature module under `apps/web/src/features/twitch-stream-map/`;
- match the existing ViewLoom/Twitch shell;
- render an explicit empty/not-connected map state;
- do not add the route to public feature navigation until route/build QA passes;
- do not touch collectors or Kick runtime.

Gate:

```text
web build pass
typecheck pass
existing Twitch pages unchanged
Kick pages unchanged
no production runtime change
```

**Outcome:** `/twitch/map/` exists as an isolated page.

### A2 — Map PR-2: MapLibre world basemap + interaction

Scope:

- MapLibre GL JS;
- low-detail world basemap compatible with PMTiles/Protomaps-style delivery;
- dark ViewLoom style;
- country borders and labels;
- optional major-city labels;
- bounded world/country zoom;
- desktop pan/zoom;
- mobile-safe tap/pan behavior;
- no Google Maps dependency;
- no street/address requirement.

Gate:

```text
world map renders
pan/zoom usable on desktop
mobile page scroll is not trapped
no paid map API required as a hard dependency
```

**Outcome:** the geographic surface itself is production-usable before streamer geography is claimed.

### A3 — Map PR-3: location contract + fixtures/tests

Minimum model:

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

Rules:

```text
no language -> country inference
no timezone inference
unknown remains unknown
home/declared country != current location
provenance retained
```

Gate:

- contract supports later City/Current Location without redesign;
- unknown is first-class;
- fixture/test coverage proves provenance and type separation.

**Outcome:** data quality semantics are fixed before real Map joins.

### A4 — Map PR-4: real Twitch live join + coverage accounting

Scope:

- reuse existing Twitch live observation payload/data path;
- join accepted location records by stable Twitch identity;
- do not add a second Twitch collector;
- calculate observed/mapped/unmapped coverage.

Required output:

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

Gate:

- mapped + unmapped reconcile to observed scope;
- live data is real;
- demo/fixture data is never presented as real;
- mapped coverage is explicit.

**Outcome:** real currently-live Twitch streams begin appearing on the map.

### A5 — Map PR-5: country clusters + drilldown

Scope:

- country bubble/cluster;
- bubble size based on summed current viewers with visual compression;
- click/tap country -> country focus;
- country summary;
- currently-live streamer list;
- streamer detail;
- location type/source/confidence;
- links back to existing ViewLoom analysis where appropriate.

Gate:

- world -> country -> streamer flow works on desktop/mobile;
- country/home location is never called exact/current location.

**Outcome:** the first genuinely useful geographic analysis flow exists.

### A6 — Map PR-6: filters + Unmapped analysis + mobile QA

Scope:

- Category filter;
- Language filter;
- minimum viewers;
- Top N observed scope;
- unmapped summary/list;
- unmapped language/category breakdown;
- mobile layout/accessibility/browser QA.

Critical rule:

- Language may filter or describe the observed population, but never determines map placement.

Gate:

- filters recalculate coverage correctly;
- Top N is based on observed population before geographic placement;
- unmapped streams remain inspectable;
- desktop/mobile QA passes.

**Outcome:** Stream Map Stage 1 is complete.

### A7 — Coverage Gate — REQUIRED BEFORE CITY

Measure production-like coverage:

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

- useful coverage -> proceed to A8 City;
- weak coverage -> insert country-evidence acquisition improvement before A8;
- never fill weak coverage with language-derived geographic placement.

### A8 — City

Only after A7 passes.

**Outcome:** reliable city records can drill down below country; country-only records remain visible at country level.

### A9 — Current Location

Only explicit/reliable current-location records, with source and freshness.

**Outcome:** current location becomes a separate map mode, not a reinterpretation of home country.

### A10 — IRL mode

Only after current-location coverage is useful.

**Outcome:** geography-sensitive live/IRL activity can be observed without pretending all streams have real-time positions.

### A11 — Kick Map

Audit Kick independently, then port accepted semantics only.

### A12 — Location History / Replay

Only after live-map semantics and storage cost are accepted.

## LINE B — Kick History v2 parallel schedule

### B1 — Issue #962 decision — CURRENT

Produce only the authorized decision artifact/verifier/PR-only CI deciding whether to prepare a disabled-by-default active migration candidate.

Hard boundary:

- no production enablement;
- no production D1 mutation;
- no active Wrangler v2 selection;
- no cron/retention change;
- no History API/UI cutover;
- no Twitch rollout from this gate.

### B2 — disabled-by-default Draft candidate — ONLY IF #962 = GO

Candidate requirements:

```text
selector absent + enabled -> v1 only
selector v1 + enabled -> v1 only
selector v2 + enabled -> v2 only
enabled false -> neither
invalid selector -> fail closed to neither
```

Additional requirements:

- v1 and v2 can never be authoritative together;
- active Wrangler production config remains unchanged;
- candidate remains Draft/unmerged until separately authorized;
- no new cron, backfill, retention, API/UI, Twitch, or cross-provider behavior.

### B3 — later production migration gate — NOT AUTHORIZED YET

A separate future decision is required before production v2 selection, v1 disablement, deployment, or production verification.

## Interleaving rule

Execution should normally alternate at completed gates, not mix responsibilities inside a PR.

Recommended near-term order:

```text
1. A1 Map route skeleton
2. B1 #962 decision gate
3. A2 MapLibre basemap
4. B2 Draft migration candidate only if B1 = GO
5. A3 location contract
6. A4 real Twitch join
7. A5 country drilldown
8. A6 filters + unmapped + mobile QA
9. A7 coverage gate
10. choose country-coverage improvement or A8 City based on measured results
```

If one line is blocked by an external gate, continue the other line without weakening its own acceptance criteria.

## Merge and branch rules

- no direct implementation work on `main`;
- one responsibility per branch/PR;
- Map changes and Kick History changes must remain separate;
- before every new branch, re-audit current main, open PRs, open issues, and relevant Actions;
- if main advances while a Map branch is open, rebase/compare before merge;
- shared-file conflicts are resolved explicitly, not by silently discarding either line.

## Hard stops

- No `language -> country` placement.
- No current-location claim from home/declared country.
- No combined Twitch+Kick Map totals/rankings in Twitch-first stages.
- No automatic Kick Map rollout.
- No automatic Kick History v2 production activation.
- No collector cadence or retention expansion from Map work.
- No city/current-location/IRL implementation before the A7 coverage decision.

## Previously accepted historical baseline

The earlier Twitch category rollout remains accepted history and must not be reinterpreted by this schedule:

- seven-day audit: `2016 / 2016` accepted slots;
- public Twitch Heatmap Category + Top controls accepted;
- accepted production SHA for that rollout: `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- current Stream Map work is a new, separately gated product line.
