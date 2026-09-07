# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.8.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.11.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `4e609f1ccbc7be573969ce2f225ac832cf9fec75`  
K4 product commit: `ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b`  
Last updated: 2026-09-07

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. The shared Twitch Map keyboard/mobile/legend regression batch is closed through #1247, and the already-public `/twitch/map/` route is permanently covered by sitemap/public-surface/browser/production-smoke inventory through #1259. The later fail-closed data-error closeout is complete through #1275/#1276, and shared collector-state presentation / production-proof maintenance is closed through #1279-#1281. Current / IRL remains fail-closed: the latest September 6 Top300 refresh measured 300 unique stable identities, reviewed 10 candidates across all 4 accepted evidence classes (40 identity/class pairs), and still produced zero fresh accepted Current placements. Kick Country K1-K3, KUI1-KUI3b, K4 preactivation/cutover preparation and K4 itself are now complete. PR #1283 activated canonical `/kick/map/` in production. The next main product-development lane is Kick City, while Current / IRL remains an independently gated parallel lane.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; #1214 completed; compact control/legend regression closeout #1245-#1246 complete | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate references/list-only fallback and production acceptance complete; mobile action-target regression closeout #1247 complete | scoped quality/coverage only |
| Kick Country | K1 #1239 + K2 #1249 + K3 #1252 + K4 #1283 complete; `/kick/map/` public; production API state `ready` | maintenance only |
| Kick City | not implemented; must not be inferred from Country terminal data | KC1 contract/fixtures -> KC2 reviewed City evidence -> KC3 runtime/API -> KC4 browser proof -> KC5 public activation |
| Current / IRL | 2026-09-06 latest bounded refresh: 300 unique stable IDs, 10 reviewed, 40 accepted-class pairs, 0 fresh qualifying evidence, 0 accepted, 0 true cross-country conflicts; public control disabled | fail closed; production stable-ID persistence and any public Current path remain separately gated |
| Shared Map UI | #1245 geography controls + #1246 Country compact controls/legend + #1247 City mobile targets complete; #1259 permanent Twitch Map inventory; #1275-#1276 stale-data/unavailable closeout; #1279-#1281 collector-state/screenshot reliability closeout | scoped regression/accessibility work only |
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
- Map -> selected Country -> mapped results -> unmapped diagnostics;
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

## 5. Kick Country — K1-K4 COMPLETE / PUBLIC

Provider boundary:

```text
Kick live population
-> official broadcaster_user_id retained in production
-> Kick-only reviewed terminal Country catalog
-> deterministic stable-ID join
-> public projection strips stable ID
-> Country aggregate UI
-> canonical /kick/map/
```

Reviewed Country evidence catalog remains:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

### Runtime/data history

K1 completed in PR #1239. The read-only snapshot source, stable-ID-aware join, reviewed Country bridge, Country response core, internal staging and readiness gate were validated against all four manual result files.

K2 completed in PR #1249 by retaining `broadcaster_user_id` directly from the already-used official `/public/v1/livestreams` response. No additional Channels request, D1 schema/binding change, cadence change, retention/backfill change or Twitch collector change was added. Provider-scoped deploy run `34008654160` deployed Kick only and skipped Twitch. Production API proof run `34008795931` observed 100/100 stable identities.

K3 completed in PR #1252. The production `/api/kick-stream-map` route joins live snapshot rows to the reviewed Country catalog by `broadcaster_user_id` only. Runtime terminal data retains only stable ID, outcome and accepted Country code; public rows strip `broadcaster_user_id` / `stableKickUserId` and expose no City, Current, precise address/coordinate, evidence prose or source provenance.

The accepted K3 proof remains historical prerequisite evidence:

```text
#1252 production commit       0e7b6b0682df21864551b6d47d9520209f42829f
Deploy Web Pages             34010236812 success
Country readiness            34010236815 success
Production API Smoke         34010236817 success
observedStreams              100
stableIdentityStreams        100
state                         blocked_public_activation
publicActivationAuthorized   false
reconciliation               pass
stable identity published    false
```

That `blocked_public_activation` state describes K3 before K4 and is no longer the current production state.

### Pre-public UI history

KUI1 PR #1241 added `apps/web/preview/kick-stream-map/` as a `noindex,nofollow` fail-closed preview. At that stage it intentionally did not create `/kick/map/` or public navigation.

KUI2 PR #1242 added deterministic Country aggregation, Country region fills, Viewers/Streams intensity, selection/reset, accounting, keyboard/tap-target treatment, and no creator-coordinate/Twitch-evidence/City/Current semantics.

KUI3a PR #1244 completed deterministic pre-public proof. Accepted browser run `33978336854`:

```text
fixtures                       5
viewports                      2 (1440 desktop / 390 mobile)
browser scenarios             10
violations                     0
mobile horizontal overflow     0 in every scenario
ready-state action targets     44px minimum
creator markers                0
Twitch API requests            0
public /kick/map/ links         0
public canonical               absent
```

Those no-public-route assertions were correct for the pre-K4 stage and are now historical.

KUI3b PR #1253 completed real production-connected renderer/API proof. Accepted post-merge main run `34010502534`, artifact `9982308317`, digest `a97098e9902b2529fc8999b251858089142533934fc78699d7cc94aeba5f8666`.

Accepted sample:

```text
production deployment commit  0e7b6b0682df21864551b6d47d9520209f42829f
observedStreams               100
stableIdentityStreams         100
reviewedIdentityStreams         9
mappedStreams                   2
mappedViewers               12848
mappedCountryCount              2
mappedCountryCodes          BR, PL
reconciliation                pass
stable identity published     false
viewports                       2
browser scenarios               4
violations                      0
```

The normal preview was still `country_blocked` because K4 was false; the renderer proof lifted only the authorization flag inside local Chromium. This remains prerequisite proof, not the later production cutover itself.

### K4 preactivation/cutover history

PR #1255 froze K2/K3/KUI3b acceptance. PR #1265 froze the exact K4 change surface and explicitly excluded collector directories, migrations, the reviewed Country runtime catalog and the four canonical review result files. These were preparation gates only.

### K4 production activation — COMPLETE #1283

The user separately authorized K4 and PR #1283 consumed that authorization without broadening it into collector/D1/Current changes.

Accepted production cutover:

```text
product commit                       ffe6b28bd833ebd5c0ebf87a99ca65fe7f66df5b
Deploy Web Pages                     34048677710 success
Production Smoke                     34048677691 success
Production Smoke artifact            9993885992
Kick Production API Smoke            34048677721 success
Kick API proof artifact              9993884302
/kick/map/                           HTTP 200
publicActivationAuthorized           true
state                                ready
observedStreams                      100
stableIdentityStreams                100
reviewedIdentityStreams               35
mappedStreams                          4
mappedViewers                      28375
mappedCountryCount                     4
unmappedStreams                       95
excludedStreams                        1
conflictStreams                        0
reconciliation                       100/100 pass
stable identity published            false
City / Current / coordinates         absent
```

Current public inventory after K4:

```text
Vite HTML inputs                 27
inventory entries incl. 404      28
indexable routes                 23
sitemap routes                   23
browser scenarios               108 (27 routes × 4 viewports)
```

K4 is closed. Its authorization is consumed and does not authorize any future collector, D1/schema, cadence, retention/backfill, reviewed-catalog, Current or provider-crossing change.

## 6. Kick City — NEXT MAIN PRODUCT LANE

Kick City is independent of the Country terminal catalog. Country acceptance never implies City.

Required sequence:

```text
KC1  deterministic Kick City contract + fixtures
KC2  Kick-only reviewed City evidence catalog keyed by broadcaster_user_id
KC3  explicit Kick City runtime/API mode
KC4  City renderer + real production-connected desktop/mobile browser proof
KC5  separate public City activation
```

Accepted Base City claim kinds are only:

- `home_base`
- `declared_location`

Not valid for Kick Base City placement by themselves:

- Country-only evidence;
- current/temporary location;
- birthplace or nationality;
- language/timezone/name cues;
- organization headquarters;
- event venue;
- planned/future travel.

Public Kick City output must strip stable identity and must not expose creator address/GPS/precise coordinates, Current location or inferred travel paths. Reviewed aggregate reference geometry describes City aggregate UI targets only. `no_geometry` remains list-only.

## 7. Current Location / IRL — FAIL CLOSED

```text
Base/Home    accepted durable base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Latest September 6 refresh:

```text
source run                               34036562297
artifact                                 9990351519
requested population                            300
unique stable identities measured               300
duplicate stable-ID page overlap dropped          0
reviewable candidates                             10
future/planned travel rejected                     2
accepted-class identity pairs reviewed            40
fresh qualifying evidence                          0
accepted Current placement                         0
no-fresh-qualifying outcomes                      10
true unresolved cross-country conflicts            0
same-country granularity conflicts closed          2
```

The two machine conflict rows were `robcdee` and `joeykaotyk`, each with Japan Country + Tokyo City candidates. These are same-country granularity differences, not evidence for competing countries. Both remained unmapped because no separate fresh accepted-class Current statement established present geography.

Current blockers:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Stable identity alone never clears the evidence gate. Draft #1107 is closed unmerged; its old candidate implementation is not authorization for a production collector change.

Hard boundaries: no Base/Home mutation from Current, no expired/future-early placement, no venue-as-presence by itself, no inferred travel path, no residential/GPS precision.

Do not repeatedly rerun the same live review only to seek a non-zero result. A later run requires a justified new signal/window.

## 8. Shared Map UI — CURRENT REGRESSION BATCH COMPLETE

The September 6 safe regression/accessibility batch is complete through #1247:

```text
#1245  geography resolution controls
       44px targets + focus-visible
       keyboard Country/City switching
       URL-state / aria-pressed / Current-disabled browser proof

#1246  compact Country controls + legend
       44px geography/metric/World view/mobile controls
       duplicate native metric select removed from keyboard path
       active Streams/Viewers five-step log legend exposed accessibly
       390px/1440px Chromium proof + renderer regression alignment

#1247  City mobile controls
       selected-City actions/evidence filters/population selects/MapLibre controls >=44px
       390px City reference-point proof enumerates visible enabled targets
```

PR #1259 fixed a separate public-surface monitoring defect: `/twitch/map/` was already public but missing from the canonical route inventory, sitemap, generic browser matrix and permanent production smoke.

PR #1275 fixed the stale-data fail-closed defect. PR #1276 completed unavailable-state presentation and success -> 503 -> recovery proof. Candidate Public Browser Audit `34041133229` passed with artifact `9991741143`; post-merge production proof passed Primary Domain Production Smoke `34041371788` and Twitch Map Production Browser Smoke `34041371752`, artifact `9991785120`.

PR #1279 fixed shared collector-state aggregation so real `partial` remains available. Candidate Web verification `34043741206`, Web checks `34043741268` and Public Browser Audit `34043741261` passed; post-merge Deploy Web Pages `34043914846`, Production Smoke `34043914776`, Primary Domain Production Smoke `34043914876` and Twitch Map Production Browser Smoke `34043914798` passed.

PR #1280 made permanent Twitch Map production proof wait for `window.__viewloomCountryRegionMap.loaded()` before accepted Country screenshots. Post-merge smoke `34044472299` and artifact `9992672074` captured the fully loaded basemap.

PR #1281 treats real `empty` status as an available observation rather than unavailable. Candidate Public Browser Audit `34045610303` passed all 104 then-current scenarios. Post-merge Deploy Web Pages `34045809819`, Production Smoke `34045809904`, Primary Domain Production Smoke `34045809822` and Twitch Map Production Browser Smoke `34045809886` passed; artifact `9993068572` records ready Country/City and zero page/console errors.

Shared UI is scoped maintenance/quality work only, not a serial blocker for Kick City or Current prerequisites.

## 9. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 process does not serialize Map development or authorize collector/schema/cadence/retention changes. Its wait periods never pause safe shared UI work, docs, fixtures, CI or other non-mutating preparation.

## 10. Shared operational boundaries

Unless separately authorized, Stream Map work does not change production collector behavior, collector cadence, D1 schema/bindings, retention, backfill, automatic recurring acquisition or production data outside applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence. Kick K2/K3/K4 authorizations are consumed. They do not authorize Twitch stable-ID persistence, Current activation, or future Kick City collector/storage changes.

## 11. Current execution order

```text
DONE   documentation reconciliation #1219
DONE   Country closeout + Country UI issue #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current current-main readiness gate #1234
DONE   Kick Country current-main readiness gate #1235
DONE   Kick K1 collector-independent reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate preview renderer #1242
DONE   Kick KUI3a non-mutating browser proof #1244 / run 33978336854
DONE   Shared Twitch geography control regression #1245
DONE   Shared Country compact controls/legend regression #1246
DONE   Shared City mobile target regression #1247
DONE   Kick K2 production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
DONE   Kick K3 production reviewed-Country runtime #1252 / run 34010236817
DONE   Kick KUI3b real production-connected proof #1253 / main run 34010502534
DONE   Kick K4 preactivation proof #1255
DONE   Twitch Map permanent public-surface inventory #1259 / 104 scenarios
DONE   Kick exact K4 cutover contract #1265
DONE   Current live candidate/review sequence 4 #1272-#1273 / 300 -> 10 reviewed -> 0 accepted
DONE   Twitch Map stale-data fail-closed recovery #1275
DONE   Twitch Map unavailable presentation closeout #1276 / run 34041133229 / artifact 9991741143
DONE   Shared collector partial-status presentation #1279 / production smoke 34043914798
DONE   Twitch Map production screenshot tile-readiness #1280 / run 34044472299 / artifact 9992672074
DONE   Shared collector empty-status presentation #1281 / production smoke 34045809886 / artifact 9993068572
DONE   Kick K4 public Country activation #1283 / product commit ffe6b28 / production API smoke 34048677721
NEXT   Kick City KC1 deterministic contract + fixtures
PAR    Kick City KC2 evidence preparation after KC1
PAR    scoped shared Map regression/accessibility work and maintenance only
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.

## 12. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.8.md`
3. `docs/product/stream-map-implementation-plan-v0.11.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/audits/kick-stream-map-k4-cutover-contract-2026-09-06.json`
7. `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-06.json`
8. `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-06.json`
9. relevant City/Kick/Current lane contracts
10. current implementation/tests on `main`

Older Stream Map specs/plans and execution snapshots remain historical and cannot override this chain.

## 13. Documentation synchronization rule

A normative behavior change is incomplete if a known contradictory active source-of-truth document remains. Every Stream Map PR must consider spec, active plan, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
