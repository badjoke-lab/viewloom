# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.7.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `801860483b50bf418d8edfb5295542244e69c138`  
Last updated: 2026-09-05

## 1. Current milestone

**Twitch Country is closed. Twitch City C1 aggregate selection is in review, and C2 geometry-source semantics are frozen by #1223 on merge. The next geometry step is a bounded reviewed registry for the City aggregates ViewLoom can actually place.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed at current product boundary; choropleth/UI/production proof complete | scoped defects/accessibility/evidence maintenance only |
| Twitch City | explicit API/UI + stable-ID state + isolation implemented; City aggregate spec accepted; C1 #1222 in review; C2 #1223 source contract in review | merge C1/C2, review bounded geometry registry, then C3 |
| Kick Country | provider-specific source/identity/response and reviewed evidence foundations advanced | re-audit actual main readiness, then missing Kick-only public gate |
| Current / IRL | temporal evaluator/candidate work + stable-ID snapshot adapter implemented | re-audit fresh accepted evidence; remain fail-closed otherwise |
| Shared Map UI | Country responsive interaction accepted; City list-first accessibility now defined | verify C1/C3/C4 across desktop/mobile |
| Reviewed-evidence maintenance | bounded maintenance process | continue only under its own policy; never block Map lanes |

## 3. Twitch Country — CLOSED

Accepted Country state includes:

- accepted-evidence-only Country placement;
- Top N / minimum viewers / category + evidence filters;
- filled Country regions as primary visualization;
- small-country aggregate fallback only;
- Streams/Viewers five log-scaled buckets;
- selection independent of camera;
- explicit `World view` reset;
- Map → selected Country → mapped results → unmapped diagnostics runtime order;
- no creator coordinate semantics.

Closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Accepted production evidence:

```text
main                              24cd444bfe564588b70c16a335f07d2c41627c0b
Deploy Web Pages                  33934879891 success
Twitch Map Production Browser     33934879840 success
Country + City structural render  success
```

Country does not return to the retired Markers/Regions experiment and is not a serial blocker.

## 4. Twitch City — ACTIVE MAINLINE

Existing accepted City boundary remains:

- explicit `/api/twitch-stream-map?geography=city` and `/twitch/map/?geography=city`;
- Base City only from accepted `home_base` / `declared_location` evidence;
- country-only evidence retained but not promoted;
- Base City conflicts fail closed;
- current/temporary evidence does not become Base City;
- stable Twitch ID state is honest: `unavailable | partial | available`;
- login is not stable identity;
- no creator address/GPS/coordinates;
- no Country-centroid City placement;
- Current placement remains zero in Base City mode.

### City visualization semantic object

The primary City object is a **City aggregate**.

```text
cityAggregateKey = countryCode + normalized region (or __none__) + normalized city
```

The list is first-class and must remain usable without geometry.

### C1 — aggregate model + selection — IN REVIEW #1222

#1222 implements:

- deterministic aggregate keys;
- same-name City separation across region/country;
- exact stream/viewer/source totals;
- selectable aggregate rows;
- selected-City detail + existing stream provenance drilldown;
- retained selection when active evidence filters reduce it to zero;
- population/category payload refresh handling;
- mobile list-first behavior;
- no City geometry/creator point layer.

### C2 — reference geometry source strategy — IN REVIEW #1223

Source audit:

`docs/audits/twitch-stream-map-city-reference-geometry-source-audit-2026-09-05.md`

Contract:

`docs/product/stream-map-city-reference-geometry-contract-v0.1.md`

Accepted architecture on #1223 merge:

```text
accepted City aggregate
-> exact reviewed registry lookup
   -> geoBoundaries gbOpen City/municipal boundary when a reviewer confirms semantics
   -> otherwise Natural Earth Populated Places aggregate reference point when unambiguous
   -> otherwise no_geometry / list-only
```

Key boundary decisions:

- no global automatic City-name resolver;
- no fixed `ADM level = City` assumption;
- geoBoundaries ADM semantics reviewed per entry;
- Natural Earth point is aggregate reference only, never creator location;
- Overture Divisions deferred for v0.1 because locality coverage is documented as spotty and its divisions theme is ODbL;
- public Nominatim rejected as runtime/bulk resolver;
- no runtime external geometry API;
- no fuzzy/nearest matching;
- no Country/region centroid;
- no venue or creator coordinate substitution;
- geometry absence does not change accepted City evidence.

### Next City geometry work

After #1223:

1. enumerate current accepted City aggregate keys;
2. review only those keys against the accepted sources;
3. retain feature ID/version/source URL/license/attribution;
4. produce a bounded static registry/artifact;
5. unresolved/ambiguous aggregates remain list-only;
6. C3 renders only accepted entries.

This avoids bundling a worldwide municipal database or adding a runtime geocoder just to display the observed City set.

## 5. Kick Country — parallel lane

Kick remains provider-separated:

```text
Kick live population
-> official Channels join
-> broadcaster_user_id
-> Kick-only reviewed evidence
-> Country terminal state
-> future Kick public activation
```

No Twitch evidence reuse, slug/login stable-ID substitution, automatic geography or demo placement.

Next: re-audit current main persistence/response/public-readiness and close only the missing provider-specific gate.

## 6. Current Location / IRL — parallel lane

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Stable-ID plumbing does not create Current geography.

Public Current remains disabled unless fresh accepted current/temporary evidence and its own API/UI gate exist.

Hard boundary:

- no Base/Home mutation from Current;
- no expired/future-early placement;
- no event venue as presence proof by itself;
- no inferred travel path;
- no precise residential/GPS publication.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 policy remains valid only for its own maintenance work.

Its cadence never pauses:

- City C1/C2/C3/C4 work;
- Kick read-only/evidence/API work;
- Current/IRL read-only/evidence work;
- accessibility/UI work;
- docs, fixtures, CI and preview-only verification.

Automatic geography acceptance and unsupported persistent crawlers remain unauthorized.

## 8. Shared operational boundaries

Unless separately authorized, Stream Map work does not change:

- collector provider behavior;
- collector cadence;
- D1 schema/bindings;
- retention;
- backfill;
- automatic recurring acquisition;
- production data outside applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence.

## 9. Current execution order

```text
DONE      documentation reconciliation #1219
DONE      Country closeout #1220
DONE      City visualization spec #1221
IN REVIEW City C1 aggregate selection #1222
IN REVIEW City C2 geometry source contract #1223
NEXT      reviewed current-City geometry registry + static artifact
NEXT      City C3 aggregate map renderer
NEXT      City C4 responsive/detail UI
THEN      City C5 browser + production proof
```

Parallel throughout:

```text
Kick Country provider-specific readiness/API/public path
Current/IRL fresh accepted-evidence/API/UI path
reviewed-evidence maintenance
shared accessibility/verification
```

## 10. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.7.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/product/stream-map-city-confidence-contract-v0.1.md`
7. `docs/product/stream-map-city-visualization-spec-v0.1.md`
8. `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`
9. relevant Kick/Current lane contracts
10. current implementation/tests on `main`

Older Stream Map specs/plans and execution snapshots remain historical and cannot override this chain.

## 11. Documentation synchronization rule

A normative behavior change is incomplete if a known contradictory active source-of-truth document remains.

Every Stream Map PR must consider spec, active plan, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
