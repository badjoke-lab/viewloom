# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.8.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `119505fa5742802f6b9bf8df95d95c4bc0ba8b2d`  
Last updated: 2026-09-05

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. Current / IRL completed a fresh September 5 Top300 review and remains fail-closed with zero accepted temporal placements. The active collector-independent implementation lane is therefore Kick Country runtime preparation; production collector mutations still require explicit authorization.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; #1214 completed | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate reference points/list-only fallback and production acceptance complete | scoped quality/coverage work only; no new C-stage scheduled |
| Kick Country | 100/100 review complete; snapshot parser/public adapter/reviewed-evidence bridge/live join/response core ready in code | stage collector-independent reviewed-evidence runtime integration; stable production identity remains separately blocked |
| Current / IRL | fresh 2026-09-05 Top300 probe/review complete: 300 measured, 8 reviewed, 0 accepted, 2 unresolved true conflicts; public control remains disabled | fail closed; rerun only on justified new signal/review window, or resume after separately authorized stable-ID/public-path prerequisites |
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

Blocker 1 is a production collector mutation and requires explicit authorization. Blocker 2 can be prepared/staged without public activation so long as the runtime remains fail-closed when stable identity is absent. Stale Draft #1083 is not a merge candidate as-is. If collector authorization is later given, create a clean current-main PR rather than blindly merging/rebasing the stale Draft.

## 6. Current Location / IRL — FRESH REVIEW COMPLETE / FAIL CLOSED

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

### September 5 fresh review

Fresh bounded probe:

```text
workflow run              33961161696
population measured       300
reviewable candidates       8
machine conflict rows       3
future-travel rejects       0
invalid identity rows       0
production deployment       false
D1 writes                   0
```

Manual accepted-evidence review:

```text
identities reviewed          8
fresh qualifying evidence    0
accepted Current placement   0
no qualifying evidence       6
true unresolved conflicts    2
```

The three machine conflict rows included one same-place granularity pair (`Japan` + `Tokyo`) that was reviewed as `no qualifying evidence`, not as a competing-country conflict. The two true unresolved conflicts are the multi-country candidate cases.

Authoritative fresh audit records:

- `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-05.json`
- `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-05.json`

Current exact blockers remain:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Blocker 1 requires explicit production collector authorization. Stable-ID plumbing alone never authorizes Current placement. Blocker 3 was freshly re-audited on September 5 and remains substantive.

Do not repeatedly re-run the same live review probe merely to search for a non-zero answer. A later rerun requires a justified new review window or new signal. Until then Current remains disabled/fail-closed.

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

- Kick collector-independent runtime preparation;
- later justified Current/IRL evidence work;
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
DONE   Current fresh Top300 probe + 8-identity temporal review, accepted 0
NOW    Kick collector-independent reviewed-evidence runtime preparation
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
