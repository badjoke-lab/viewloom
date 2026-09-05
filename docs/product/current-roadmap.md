# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.8.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `13af00ce399bcf85d3699815730deda5cd78288f`  
Last updated: 2026-09-05

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. The active Map work is now the provider-separated Kick Country and Current / IRL lanes, both with explicit blockers that must not be bypassed by stale production-collector Drafts.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; #1214 completed | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate reference points/list-only fallback and production acceptance complete | scoped quality/coverage work only; no new C-stage scheduled |
| Kick Country | 100/100 review complete; snapshot parser/public adapter/reviewed-evidence bridge/live join/response core ready in code | explicit collector authorization for stable `broadcaster_user_id`, then connect reviewed runtime and separately authorize public activation |
| Current / IRL | stable-ID-capable common core + Current response core/readiness gate ready in code; public control remains disabled | explicit collector authorization for Twitch stable ID + fresh accepted Current evidence + separate public route/UI gate |
| Shared Map UI | Country and City accepted on desktop/mobile/browser production checks | scoped regression/accessibility work |
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

Issue #1214 is closed as completed. Country does not return to the retired Markers/Regions experiment and is not a serial blocker.

## 4. Twitch City — C1-C6 COMPLETE

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

The primary City object remains a **City aggregate**:

```text
cityAggregateKey = countryCode + normalized region (or __none__) + normalized city
```

### Completed City sequence

```text
C1  deterministic City aggregate model + selection                         #1222
C2  reference-geometry source strategy                                    #1223
C3  bounded reviewed City reference-geometry registry                     #1224-#1226
C4  reviewed aggregate reference-point rendering + map/list sync          #1227
C5  public activation/production structural verification                  #1228-#1229
C6  presentation cleanup + public acceptance                              #1230-#1233
```

Current reviewed geometry registry:

```text
reference_point  8
no_geometry      1
```

Natural Earth v5.1.2 points are explicitly `city_aggregate_reference` targets only. They are not creator coordinates and are not municipal-boundary claims. `Sant Cugat del Valles` remains `no_geometry` and list-only.

C6 accepted presentation also includes:

- Current-location evidence filter disabled in City mode;
- mapped City results before unmapped diagnostics;
- full-width City mapped-stream results;
- Country aggregate markers hidden in City;
- Current / IRL activation remains false.

Current acceptance audit:

`docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json`

No roadmap item sends development back to C1-C5 as unfinished work.

## 5. Kick Country — ACTIVE PARALLEL LANE / BLOCKED PRODUCTION DEPENDENCY

Provider boundary remains:

```text
Kick live population
-> official broadcaster_user_id when retained
-> Kick-only reviewed evidence
-> deterministic Country terminal state
-> separate public activation gate
```

Current reviewed evidence is complete:

```text
reviewed identities       100
accepted Country          7
excluded non-person       3
no qualifying evidence   90
```

Current main already has these components ready in code:

- read-only latest snapshot source;
- optional `broadcaster_user_id` parsing;
- stable-ID-aware public adapter without slug fallback;
- reviewed Country evidence bridge;
- deterministic stable-ID live join;
- Country response core;
- readiness gate.

Current exact blockers:

```text
1. production livestream snapshot does not retain broadcaster_user_id
2. reviewed Kick Country evidence is not connected to the public runtime
3. public Kick Country activation is not authorized
```

Blocker 1 is a production collector mutation and requires explicit authorization. Stale Draft #1083 is not a merge candidate as-is. If authorization is later given, create a clean current-main PR rather than blindly merging/rebasing the stale Draft.

## 6. Current Location / IRL — ACTIVE PARALLEL LANE / BLOCKED

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Current main already has:

- common Stream Map parsing for optional `twitchUserId` / `user_id`;
- stable-ID coverage state;
- fail-closed Current response core;
- Current public-readiness validator;
- disabled Current / IRL public control.

Current exact blockers:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Blocker 1 requires explicit production collector authorization. Stable-ID plumbing alone never authorizes Current placement, so blocker 3 remains substantive even after identity persistence exists.

Stale Draft #1107 must not be merged as-is. A future authorized collector change must be recreated/re-audited on current main.

Hard boundary:

- no Base/Home mutation from Current;
- no expired/future-early placement;
- no event venue as presence proof by itself;
- no inferred travel path;
- no precise residential/GPS publication.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 policy remains valid only for its own maintenance work.

Its cadence never pauses:

- Kick/Current read-only audits and evidence work;
- accessibility/UI regression work;
- docs, fixtures, CI and preview-only verification;
- clean non-mutating preparation for blocked lanes.

Automatic geography acceptance and unsupported persistent crawlers remain unauthorized.

## 8. Shared operational boundaries

Unless separately authorized, Stream Map work does not change:

- production collector provider behavior;
- collector cadence;
- D1 schema/bindings;
- retention;
- backfill;
- automatic recurring acquisition;
- production data outside applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence.

## 9. Current execution order

```text
DONE   documentation reconciliation #1219
DONE   Country closeout + Country UI issue #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current current-main readiness gate #1234
DONE   Kick Country current-main readiness gate #1235
NOW    safe non-mutating Kick/Current evidence, validator and preparation work
BLOCK  Kick production stable-ID persistence pending explicit collector authorization
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.

## 10. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.8.md`
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
