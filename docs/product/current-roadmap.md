# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.7.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
Audited runtime baseline: main `24cd444bfe564588b70c16a335f07d2c41627c0b`  
Last updated: 2026-09-05

## 1. Current milestone

**Twitch Country is closed at the current product boundary. Twitch City aggregate model/selection and City reference-geometry source audit are now the mainline implementation gates.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closeout accepted at runtime baseline `24cd444...`; public API/map, filters, choropleth, compact UI and production proof complete | maintenance/scoped defects only; no serial blocker |
| Twitch City | explicit API/UI, stable-ID coverage states, renderer isolation and production structural smoke implemented; visualization spec v0.1 accepted on merge | C1 aggregate model/selection + C2 reference-geometry source audit in parallel |
| Kick Country | source/identity/response foundations plus reviewed evidence bridge and review batches advanced | re-audit actual main readiness, then complete Kick-only API/public activation gates |
| Current / IRL | temporal contract/evaluator/candidate work plus stable-ID snapshot adapter implemented | re-audit fresh accepted evidence; public layer remains separate and fail-closed |
| Shared Map UI | Country mobile/desktop density and interaction work implemented | City accessibility/cross-mode verification as C1-C4 advance |
| Reviewed-evidence maintenance | bounded maintenance process | continue under its own policy only; not a Map-wide blocker |

## 3. Twitch Country — CLOSED at current product boundary

### Accepted state

Country provides:

- real Twitch population only;
- Top N / minimum viewers / category population controls;
- evidence source and location-type filters;
- accepted-evidence-only placement;
- Country drilldown;
- explicit unmapped/excluded accounting;
- inspectable reviewed evidence/provenance;
- filled Country regions as the primary renderer;
- small-country aggregate fallback only when polygon geometry is impractical;
- Streams/Viewers intensity with five log-scaled positive buckets;
- bounded geographic-context camera;
- selection independent of camera;
- explicit `World view` reset and selection-only `Clear country`.

### Accepted runtime order

```text
Map
-> selected Country when present
-> mapped countries / mapped streams
-> unmapped diagnostics
```

#1213 finalized the choropleth. #1218 finalized the compact interaction model. #1220 removed the remaining marker-first static source copy and the stale validator that required it.

### Closeout evidence

Authoritative closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Accepted runtime baseline:

`24cd444bfe564588b70c16a335f07d2c41627c0b`

Production evidence:

```text
Deploy Web Pages                     33934879891 success
Twitch Map Production Browser Smoke  33934879840 success
production Country + City rendering  success
```

Country does **not** return to the retired Markers/Regions experiment. Future Country work is scoped correctness/accessibility/evidence maintenance and does not block City, Kick or Current/IRL.

## 4. Twitch City — NOW

City is already beyond the old `NOT authorized` roadmap state.

Implemented before the new visualization gate:

- explicit `/api/twitch-stream-map?geography=city`;
- explicit `/twitch/map/?geography=city` runtime mode;
- City confidence/ambiguity semantics;
- no City inference from Country;
- Base City only from accepted `home_base` / `declared_location` evidence;
- current/temporary evidence excluded from Base City;
- stable Twitch identity retained internally when actually available;
- login is not a stable-ID substitute;
- City stable-ID coverage state exposed as `unavailable | partial | available` rather than fabricated;
- City UI state matrix/verifier (#1200-#1202);
- City renderer (#1204) suppresses Country aggregate markers and Country centroid placement;
- no creator City coordinates are published or inferred;
- country-only evidence remains accounted but is not promoted;
- Current-location placement remains zero in Base City mode;
- structural production smoke remains green at the Country closeout baseline.

### City visualization decision

`docs/product/stream-map-city-visualization-spec-v0.1.md` fixes the primary semantic object as a **City aggregate**, not a creator point.

Canonical aggregate key:

```text
countryCode + region + city
```

The exact list remains first-class even if map geometry is unavailable.

A City map target requires a separately reviewed public reference geometry source for the City/place itself. Preference order:

```text
reviewed City/municipal boundary
-> reviewed City aggregate reference point only when boundary unavailable
-> no map target / list remains fully usable
```

A reference target is never a creator coordinate. Country/region centroids, fuzzy geocoder guesses, venue substitution and inferred coordinates remain prohibited.

### City current work

Proceed in parallel:

**C1 — City aggregate model and selection**

- deterministic aggregate keys;
- exact stream/viewer totals;
- conflict/country-only exclusion from mapped aggregates;
- list selection independent of MapLibre;
- selected-City detail state.

**C2 — City reference-geometry source audit**

- source/license/update model;
- boundary vs aggregate reference-point semantics;
- deterministic `countryCode + region + city` matching;
- ambiguity and missing-geometry rules;
- build/runtime/network cost;
- no silent fuzzy matching.

C1 does not wait for C2. C3 map rendering starts only after a geometry source is accepted.

## 5. Kick Country — parallel lane

Current accepted direction remains Kick-only:

```text
Kick live population
-> unique official Channels join
-> broadcaster_user_id
-> Kick-only reviewed evidence
-> Country terminal state
-> future Kick API/UI activation
```

Recent merged progress includes:

- #1197 reviewed Kick Country evidence bridge;
- #1203 reviewed Country batches 03-04 on current main line.

This does not authorize Twitch evidence reuse, slug-only stable identity, automatic geography acceptance or public Kick Map activation by itself.

Next: re-audit current Kick persistence/response/public-readiness from main, then close only the missing provider-specific gates.

## 6. Current Location / IRL — parallel lane

Current remains separate from Home/Base and City.

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Temporal evaluator and candidate/reviewability work are already established. #1198 added a Twitch current-snapshot stable-ID adapter.

That adapter is identity plumbing only. It does not create accepted Current geography.

Public Current stays disabled unless fresh accepted current/temporary evidence exists and its own API/UI gate is accepted.

Hard boundary:

- no Home/Base mutation from Current;
- no expired Current placement;
- no future claim placed early;
- no event venue as presence proof by itself;
- no inferred travel path;
- no precise residential/GPS publication.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 reviewed-evidence maintenance policy remains valid for its own purpose.

It is **not** the Stream Map roadmap scheduler.

A weekly maintenance wait never blocks otherwise-safe:

- City aggregate/spec/fixture/UI work;
- City reference-geometry audit;
- Kick read-only/evidence/API work;
- Current/IRL read-only/evidence work;
- UI/accessibility work;
- documentation and CI work.

Automatic geography acceptance and an unsupported persistent crawler remain unauthorized.

## 8. Shared operational boundaries

Unless a separate accepted gate explicitly changes them, Stream Map feature work does not authorize:

- collector provider behavior changes;
- collector cadence changes;
- D1 schema/binding mutation;
- raw retention expansion;
- backfill;
- automatic recurring acquisition;
- production mutation outside the applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence.

## 9. Current execution order

Completed:

```text
1. documentation source-of-truth reconciliation          COMPLETE #1219
2. Country closeout and marker-first residue repair      COMPLETE #1220
```

Mainline now:

```text
3A. City C1 aggregate model + selection                  NOW
3B. City C2 reference-geometry source audit              NOW / parallel with C1
4.  City C3 aggregate map renderer                       after C2 acceptance
5.  City C4 responsive/detail UI                         after/with C3
6.  City C5 browser + production proof                   after C3/C4
```

Parallel throughout:

```text
Kick Country provider-specific readiness/API/public path
Current/IRL fresh accepted-evidence/API/UI path
reviewed-evidence maintenance under its own bounded policy
shared Map accessibility/verification
```

## 10. Authoritative current records

Read these for new Stream Map work:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.7.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/product/stream-map-city-visualization-spec-v0.1.md` for City visualization work
7. relevant lane contract, such as City confidence, Current/IRL, or Kick live-join contracts
8. current implementation/tests on `main`

Older `stream-map-spec-v0.6.md` and earlier versions, older implementation plans including `stream-map-implementation-plan-v0.6.md`, and pre-v0.7 execution snapshots are historical/superseded for current execution. They must not override the list above.

## 11. Documentation synchronization rule

A normative behavior change is incomplete if an active `source of truth` document remains knowingly contradictory.

Every Stream Map PR must consider spec, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact. Material spec changes should create a new versioned spec/plan rather than silently changing historical versions.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
