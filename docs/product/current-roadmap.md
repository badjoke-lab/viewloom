# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `6b8668492d2a35e9fb83e1d93929fef8b58de215`  
Last updated: 2026-09-06

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. Current / IRL remains fail-closed with zero accepted temporal placements. Kick Country K1 runtime staging plus KUI1/KUI2 pre-public UI are complete through #1242. Kick production stable-ID persistence remains blocked pending explicit collector authorization, and `/kick/map/` is still intentionally absent.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; #1214 completed | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate references/list-only fallback and production acceptance complete | scoped quality/coverage only |
| Kick Country runtime | K1 complete: 100/100 reviewed evidence passes the internal stable-ID staging path | K2 production `broadcaster_user_id` persistence after explicit collector authorization; K3 after K2; K4 separate public gate |
| Kick Country UI | KUI1 fail-closed preview #1241 and KUI2 Country choropleth/results #1242 complete; production Vite/public route unchanged | KUI3a safe proof preparation; KUI3b real-data proof after K3 |
| Current / IRL | 2026-09-05 Top300 review: 300 measured, 8 reviewed, 0 accepted, 2 unresolved true conflicts; public control disabled | fail closed; later work only on justified new evidence window or separately authorized prerequisites |
| Shared Map UI | Twitch Country/City accepted on desktop/mobile/browser production checks; Kick preview controls have fail-closed/focus/tap coverage | scoped regression/accessibility work |
| Reviewed-evidence maintenance | bounded maintenance only | never block Map lanes |

## 3. Twitch Country — CLOSED

Accepted boundary:

- accepted-evidence-only Country placement;
- Top N / minimum viewers / category + evidence filters;
- filled Country regions as the primary visualization;
- small-country aggregate fallback only;
- Streams/Viewers five log-scaled buckets;
- Country selection independent of camera movement;
- explicit `World view` reset;
- Map → selected Country → mapped results → unmapped diagnostics;
- no creator-coordinate semantics.

Issue #1214 is completed and closed. Country does not return to the retired Markers/Regions experiment and is not a serial blocker.

## 4. Twitch City — C1-C6 COMPLETE

Accepted City boundary:

- explicit `/api/twitch-stream-map?geography=city` and `/twitch/map/?geography=city`;
- Base City only from accepted `home_base` / `declared_location` evidence;
- Country-only evidence is not promoted to City;
- Base City conflicts fail closed;
- current/temporary evidence does not become Base City;
- stable Twitch ID state is `unavailable | partial | available`;
- login is not stable identity;
- no creator address/GPS/coordinates;
- no Country-centroid City placement;
- Current placement remains zero in Base City mode.

The primary City object is a City aggregate:

```text
cityAggregateKey = countryCode + normalized region (or __none__) + normalized city
```

Completed sequence:

```text
C1  deterministic City aggregate model + selection                         #1222
C2  reference-geometry source strategy                                    #1223
C3  bounded reviewed City reference-geometry registry                     #1224-#1226
C4  reviewed aggregate reference-point rendering + map/list sync          #1227
C5  public activation/production structural verification                  #1228-#1229
C6  presentation cleanup + public acceptance                              #1230-#1233
```

Current geometry registry:

```text
reference_point  8
no_geometry      1
```

Natural Earth points are `city_aggregate_reference` targets only, never creator coordinates or municipal-boundary claims. `Sant Cugat del Valles` remains `no_geometry` and list-only.

## 5. Kick Country — K1 + KUI1/KUI2 COMPLETE / PRODUCTION DEPENDENCY BLOCKED

Provider boundary:

```text
Kick live population
-> official broadcaster_user_id when retained
-> Kick-only reviewed evidence
-> deterministic Country terminal state
-> Country aggregate UI
-> separate public activation gate
```

Reviewed evidence:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

### Runtime/data track

K1 completed in PR #1239. Current code includes the read-only latest snapshot source, optional `broadcaster_user_id` parsing, stable-ID-aware adapter without slug fallback, reviewed Country bridge, deterministic stable-ID join, Country response core, internal runtime staging and readiness gate.

The real four review files reconcile in the staged runtime path. Public activation remains false.

The reviewed runtime bridge deliberately omits slug/viewer/raw prose/source provenance and detail beyond terminal reviewed Country. UI must not reconstruct evidence fields the runtime contract removed.

### Pre-public UI track

KUI1 PR #1241 added `apps/web/preview/kick-stream-map/` as a `noindex,nofollow` fail-closed preview. It reads real readiness/accounting from `/api/kick-stream-map`, but does not create `/kick/map/`, a public canonical URL, public navigation or a production Vite input.

KUI2 PR #1242 added:

- aggregation only from `mappedStreams[].geography.countryCode`;
- local Country GeoJSON region fills;
- Viewers/Streams intensity;
- Country selection + World view reset;
- mapped streams plus unmapped/excluded/conflict accounting;
- reconciliation display;
- keyboard focus/minimum tap-target treatment;
- no marker-as-creator placement;
- no Twitch evidence reuse, City inference, Current promotion or creator coordinates.

Current exact blockers:

```text
1. production livestream snapshot does not retain broadcaster_user_id
2. public Kick Country activation is not authorized
```

Blocker 1 is a production collector mutation and requires explicit authorization. Stale Draft #1083 is not a merge candidate as-is.

Next sequence:

```text
KUI3a  non-mutating proof preparation                                  NOW SAFE
K2     persist official broadcaster_user_id in production snapshot     BLOCKED AUTH
K3     connect staged reviewed Country path to production runtime       AFTER K2
KUI3b  real production-connected Country UI/API/browser proof           AFTER K3
K4     create/activate canonical /kick/map/ + public navigation         SEPARATE GATE
```

## 6. Current Location / IRL — FAIL CLOSED

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Fresh September 5 review:

```text
population measured          300
reviewable candidates          8
identities reviewed             8
fresh qualifying evidence       0
accepted Current placement      0
no qualifying evidence          6
true unresolved conflicts       2
```

Current blockers:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Stable identity alone never clears the evidence gate. Do not repeatedly rerun the same live review merely to seek a non-zero answer. Stale Draft #1107 is not a merge candidate as-is.

Hard boundaries: no Base/Home mutation from Current, no expired/future-early placement, no venue-as-presence by itself, no inferred travel path, no residential/GPS precision.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 process does not serialize Map development or authorize collector/schema/cadence/retention changes. Its wait periods never pause safe shared UI work, Kick KUI3a, docs, fixtures, CI or other non-mutating preparation.

## 8. Shared operational boundaries

Unless separately authorized, Stream Map work does not change production collector behavior, collector cadence, D1 schema/bindings, retention, backfill, automatic recurring acquisition or production data outside applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence.

## 9. Current execution order

```text
DONE   documentation reconciliation #1219
DONE   Country closeout + Country UI issue #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current current-main readiness gate #1234
DONE   Kick Country current-main readiness gate #1235
DONE   Current fresh Top300 probe + 8-identity temporal review, accepted 0
DONE   Kick K1 collector-independent reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate preview renderer #1242
NOW    Kick KUI3a non-mutating proof preparation
PAR    safe shared Map regression/accessibility work and maintenance
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
WAIT   Kick K3 production runtime connection until K2
WAIT   Kick KUI3b real production-connected proof until K3
BLOCK  Kick K4 canonical /kick/map/ activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.

## 10. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant City/Kick/Current lane contracts
7. current implementation/tests on `main`

Older Stream Map specs/plans and execution snapshots remain historical and cannot override this chain.

## 11. Documentation synchronization rule

A normative behavior change is incomplete if a known contradictory active source-of-truth document remains. Every Stream Map PR must consider spec, active plan, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
