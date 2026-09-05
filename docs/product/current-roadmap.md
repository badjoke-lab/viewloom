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
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate reference points/list-only fallback and production acceptance complete | scoped quality/coverage work only; no new C-stage scheduled |
| Kick Country runtime | K1 complete: 100/100 reviewed evidence passes the internal stable-ID runtime staging path | K2 production `broadcaster_user_id` persistence only after explicit collector authorization; K3 after K2; K4 remains separate public gate |
| Kick Country UI | KUI1 fail-closed preview shell #1241 and KUI2 Country aggregate choropleth/results #1242 complete; production Vite/public route unchanged | KUI3 proof preparation may continue safely; real-data browser/API proof waits for K3 |
| Current / IRL | fresh 2026-09-05 Top300 probe/review complete: 300 measured, 8 reviewed, 0 accepted, 2 unresolved true conflicts; public control remains disabled | fail closed; rerun only on justified new signal/review window, or resume after separately authorized stable-ID/public-path prerequisites |
| Shared Map UI | Twitch Country/City accepted on desktop/mobile/browser production checks; Kick pre-public controls have fail-closed/tap/focus coverage | scoped regression/accessibility work |
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

## 5. Kick Country — K1 + KUI1/KUI2 COMPLETE / PRODUCTION DEPENDENCY BLOCKED

Provider boundary remains:

```text
Kick live population
-> official broadcaster_user_id when retained
-> Kick-only reviewed evidence
-> deterministic Country terminal state
-> Country aggregate UI
-> separate public activation gate
```

Current reviewed evidence is complete:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

### Runtime/data track

K1 was completed by PR #1239. Current code has:

- read-only latest snapshot source;
- optional `broadcaster_user_id` parsing;
- stable-ID-aware public adapter without slug fallback;
- reviewed Country evidence bridge;
- deterministic stable-ID live join;
- Country response core;
- internal reviewed-evidence runtime staging core;
- readiness gate.

The reviewed-evidence workflow validates the real four review files through the internal staging path: 100 reviewed, 7 accepted, 3 excluded non-person, 90 no qualifying evidence, 0 conflicts, reconciliation pass. Public activation remains false.

The reviewed runtime bridge intentionally omits slug/viewer/raw prose/source provenance and location detail beyond terminal reviewed Country. UI must not reconstruct evidence fields that the runtime contract deliberately removed.

### Pre-public UI track

KUI1 PR #1241 added a `noindex,nofollow` preview shell under `apps/web/preview/kick-stream-map/`. It displays real readiness/accounting from `/api/kick-stream-map`, requires both readiness and explicit activation before geography may render, and verifies that `/kick/map/` and the Kick Map production Vite input remain absent.

KUI2 PR #1242 added the Country aggregate visualization/result layer:

- aggregation only from `mappedStreams[].geography.countryCode`;
- local Country GeoJSON region fills;
- Viewers/Streams intensity;
- Country selection + World view reset;
- mapped streams plus unmapped/excluded/conflict accounting;
- reconciliation display;
- keyboard focus/minimum tap-target treatment;
- no marker-as-creator placement;
- no Twitch evidence reuse, City inference, Current promotion or creator coordinates.

### Current exact Kick blockers

```text
1. production livestream snapshot does not retain broadcaster_user_id
2. public Kick Country activation is not authorized
```

Blocker 1 is a production collector mutation and requires explicit authorization. Stale Draft #1083 is not a merge candidate as-is. If collector authorization is later given, create a clean current-main PR.

Next sequence:

```text
K2    persist official broadcaster_user_id in production snapshot   BLOCKED AUTH
K3    connect staged reviewed Country path to production runtime     AFTER K2
KUI3  prove real production-connected Country UI/API/browser         AFTER K3
K4    create/activate canonical /kick/map/ + public navigation       SEPARATE GATE
```

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

Authoritative fresh audit records:

- `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-05.json`
- `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-05.json`

Current exact blockers remain:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Blocker 1 requires explicit production collector authorization. Stable-ID plumbing alone never authorizes Current placement. Do not repeatedly rerun the same live review probe merely to search for a non-zero answer. A later rerun requires a justified new review window or new signal.

Stale Draft #1107 must not be merged as-is.

Hard boundary:

- no Base/Home mutation from Current;
- no expired/future-early placement;
- no event venue as presence proof by itself;
- no inferred travel path;
- no precise residential/GPS publication.

## 7. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 policy remains valid only for its own maintenance work.

Its cadence never pauses:

- safe shared Map regression/accessibility work;
- later justified Current/IRL evidence work;
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
DONE   Kick K1 collector-independent reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate preview renderer #1242
NEXT   Kick KUI3 non-mutating proof preparation where possible
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
WAIT   Kick K3 production runtime connection until K2
WAIT   Kick KUI3 real production-connected proof until K3
BLOCK  Kick K4 canonical /kick/map/ activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
PAR    safe shared Map regression/accessibility work and non-mutating lane maintenance
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.
