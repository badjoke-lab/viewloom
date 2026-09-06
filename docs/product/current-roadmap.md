# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `db37167696aae41c9600822b417ac53724771859`  
Last updated: 2026-09-06

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. The shared Twitch Map keyboard/mobile/legend regression batch is closed through #1247, and the already-public `/twitch/map/` route is now included in the permanent sitemap/public-surface/browser/production-smoke inventory through #1259. The later fail-closed data-error closeout is complete through #1275/#1276: failed population/API refreshes no longer retain stale geography/counts or stale population copy, and unavailable unmapped accounting is rendered explicitly until fresh recovery. Current / IRL remains fail-closed: the latest September 6 Top300 refresh measured 300 unique stable identities, reviewed 10 candidates across all 4 accepted evidence classes (40 identity/class pairs), and still produced zero fresh accepted Current placements. Kick Country K1 staging, K2 production stable-ID persistence, K3 production reviewed-Country runtime connection and KUI1/KUI2/KUI3a/KUI3b pre-public UI/proof are complete. K4 preactivation proof and the exact K4 cutover contract are also complete through #1255/#1265, but `/kick/map/` remains intentionally absent because K4 activation itself still requires separate explicit authorization.**

The Map program is not scheduled by the weekly Top-20 evidence-maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; #1214 completed; compact control/legend regression closeout #1245-#1246 complete | scoped defects/accessibility/evidence maintenance only |
| Twitch City | C1-C6 complete; public City activation, reviewed aggregate references/list-only fallback and production acceptance complete; mobile action-target regression closeout #1247 complete | scoped quality/coverage only |
| Kick Country runtime | K1 #1239 complete; K2 #1249 complete; K3 #1252 complete in production; production smoke `34010236817` verifies reviewed Country runtime and K4 block | K4 remains separate explicit public gate |
| Kick Country UI | KUI1 #1241 + KUI2 #1242 + KUI3a #1244 + KUI3b #1253 complete; preactivation #1255 and exact cutover contract #1265 complete; real-production browser proof remains green | K4 activation only after separate explicit authorization |
| Current / IRL | 2026-09-06 latest bounded refresh: 300 unique stable IDs, 10 reviewed, 40 accepted-class pairs, 0 fresh qualifying evidence, 0 accepted, 0 true cross-country conflicts; public control disabled | fail closed; production stable-ID persistence and any public Current path remain separately gated |
| Shared Map UI | #1245 geography controls + #1246 Country compact controls/legend + #1247 City mobile targets complete; #1259 adds Twitch Map to permanent public-surface/browser/smoke coverage; #1275-#1276 close stale-data fail-closed and unavailable-copy regressions | scoped regression/accessibility work only |
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

## 5. Kick Country — K1/K2/K3 + KUI1/KUI2/KUI3a/KUI3b COMPLETE / K4 CONTRACT FROZEN / ACTIVATION BLOCKED

Provider boundary:

```text
Kick live population
-> official broadcaster_user_id retained in production
-> Kick-only reviewed terminal Country catalog
-> deterministic stable-ID join
-> public projection strips stable ID
-> Country aggregate UI proof
-> exact K4 cutover contract
-> separate K4 public activation gate
```

Reviewed evidence catalog:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

### Runtime/data track

K1 completed in PR #1239. The read-only snapshot source, stable-ID-aware join, reviewed Country bridge, Country response core, internal staging and readiness gate were validated against all four manual result files.

K2 completed in PR #1249 by retaining `broadcaster_user_id` directly from the already-used official `/public/v1/livestreams` response. No additional Channels request, D1 schema/binding change, cadence change, retention/backfill change or Twitch collector change was added. Provider-scoped deploy run `34008654160` deployed Kick only and skipped Twitch. Production proof run `34008795931` observed 100/100 stable identities.

K3 completed in PR #1252. The production `/api/kick-stream-map` route now joins live snapshot rows to the reviewed catalog by `broadcaster_user_id` only. Runtime terminal data retains only stable ID, outcome and accepted Country code; public rows strip `broadcaster_user_id` / `stableKickUserId` and expose no City, Current, precise address/coordinate, evidence prose or source provenance.

Accepted production chain:

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

Live reviewed/mapped counts vary with the current live Top100 and are not fixed review-catalog totals.

Draft #1083 is superseded by #1249 and closed.

### Pre-public UI track

KUI1 PR #1241 added `apps/web/preview/kick-stream-map/` as a `noindex,nofollow` fail-closed preview. It does not create `/kick/map/`, a public canonical URL, public navigation or a production Vite input.

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

The normal preview consumed the unchanged production payload and remained `country_blocked` with geography hidden because K4 is false. The renderer-proof scenario cloned that same production payload only inside local Chromium and lifted only the K4 authorization flag for test purposes; Country rows and accounting were not substituted. This is proof, not production activation.

### K4 preactivation and cutover contract

PR #1255 permanently froze K2/K3/KUI3b acceptance and proved that the only remaining Kick public blocker is:

```text
public_country_activation_not_authorized
```

PR #1265 then froze the exact K4 change surface without authorizing it. The authorized K4 PR, if/when separately approved, must include:

```text
runtime authorization
  apps/web/functions/api/kick-stream-map-public-adapter-core.mjs
  apps/web/functions/api/kick-stream-map-country-runtime-core.mjs
  apps/web/functions/api/kick-stream-map.ts

public surface
  apps/web/kick/map/index.html
  apps/web/src/features/kick-stream-map/public-entry.ts
  apps/web/vite.config.ts
  apps/web/src/provider-home-shell.ts
  apps/web/public/sitemap.xml

acceptance/inventory
  Kick readiness + production API smoke
  public-surface route/profile/inventory validators
  four-viewport browser matrix
  permanent primary-domain production smoke
```

The K4 contract explicitly forbids K4 from mutating collector directories, migrations, the reviewed Country runtime catalog or the four canonical manual review result files.

Expected current-public inventory only **after** authorized K4 cutover:

```text
Vite HTML inputs                 27
inventory entries incl. 404      28
indexable routes                 23
sitemap routes                   23
browser scenarios               108 (27 routes × 4 viewports)
```

Current public inventory remains one route lower because K4 is still false.

K4 remains a separate explicit public decision. `/kick/map/` is still absent and no public canonical/navigation/production Vite entry is authorized.

Current sequence:

```text
K1      reviewed Country staging/runtime contract                       DONE #1239
K2      persist official broadcaster_user_id in production snapshot    DONE #1249 / 100 of 100 proven
K3      connect reviewed Country path to production runtime            DONE #1252 / run 34010236817
KUI3b   real production-connected Country UI/API/browser proof         DONE #1253 / run 34010502534
K4-pre  freeze prerequisite proof                                      DONE #1255
K4-plan freeze exact cutover contract                                  DONE #1265
K4      create/activate canonical /kick/map/ + public navigation        BLOCKED / SEPARATE EXPLICIT GATE
```

## 6. Current Location / IRL — FAIL CLOSED

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

The two machine conflicts were `robcdee` and `joeykaotyk`, each with Japan Country + Tokyo City candidates. These are same-country granularity differences, not evidence for competing countries. Both remained unmapped because no separate fresh accepted-class Current statement established present geography; recent stream metadata for `joeykaotyk` instead pointed toward China but remained candidate-only under the Current evidence contract.

Current blockers:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

Stable identity alone never clears the evidence gate. Draft #1107 is closed unmerged; its old candidate implementation is not authorization for a production collector change.

Hard boundaries: no Base/Home mutation from Current, no expired/future-early placement, no venue-as-presence by itself, no inferred travel path, no residential/GPS precision.

## 7. Shared Map UI — CURRENT REGRESSION BATCH COMPLETE

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

PR #1259 fixed a separate public-surface monitoring defect: `/twitch/map/` was already public but missing from the canonical route inventory, sitemap, generic browser matrix and permanent production smoke. Current public coverage now includes the Twitch Map in:

```text
Vite HTML routes                 26
inventory entries incl. 404      27
indexable/sitemap routes         22
browser scenarios               104
```

PR #1275 fixed a later fail-closed defect in the already-public Twitch Map: after a successful population load, a later API/population refresh failure could leave the previous Country/stream/count payload visible under `Data error`. The page now clears those stale presentation surfaces while preserving renderer-only fallback behavior.

PR #1276 completed that error-state presentation contract. Population state is cleared to `Unavailable`, compact unmapped accounting renders `Unmapped accounting unavailable`, and fresh recovery restores current counts/reasons. Accepted candidate browser run `34041133229` passed the 104-scenario matrix plus the deterministic success → 503 → recovery audit with 3 API calls and 0 violations; artifact `9991741143`. Post-merge main production proof also passed Primary Domain Production Smoke `34041371788` and Twitch Map Production Browser Smoke `34041371752`; production artifact `9991785120` records Country/City `basemap-ready`, one canvas each, and zero page/console errors.

Read-only City presentation audit still shows explicit empty state, separate country-only accounting and separate Base City conflict accounting. No creator coordinates, Current placement or new geography semantics were added.

Shared UI is scoped maintenance/quality work only, not a serial blocker for Kick or Current prerequisites.

## 8. Reviewed-evidence maintenance — maintenance only

The bounded Top-20 process does not serialize Map development or authorize collector/schema/cadence/retention changes. Its wait periods never pause safe shared UI work, docs, fixtures, CI or other non-mutating preparation.

## 9. Shared operational boundaries

Unless separately authorized, Stream Map work does not change production collector behavior, collector cadence, D1 schema/bindings, retention, backfill, automatic recurring acquisition or production data outside applicable deployment policy.

Provider data remains separated. No demo geography substitutes for missing real evidence. The completed K2/K3 authorizations are consumed and do not authorize K4 or Twitch stable-ID persistence. K4 preactivation #1255 and cutover contract #1265 are proof/planning gates only and likewise do not authorize public activation.

## 10. Current execution order

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
DONE   Current fresh Sep 6 review #1264 / run 34015266644 / 299 -> 9 reviewed -> 0 accepted (superseded by sequence 4)
DONE   Kick exact K4 cutover contract #1265
DONE   Current live candidate probe sequence 4 #1272 / run 34036197901 / 300 -> 10 candidates
DONE   Current review queue refresh #1273 / run 34036562297 / 300 -> 10 reviewed -> 0 accepted
DONE   Twitch Map stale-data fail-closed recovery #1275
DONE   Twitch Map unavailable presentation closeout #1276 / run 34041133229 / artifact 9991741143
PAR    scoped shared Map regression/accessibility work and maintenance only
BLOCK  Kick K4 canonical /kick/map/ activation pending separate explicit authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.

## 11. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/audits/kick-stream-map-k4-cutover-contract-2026-09-06.json`
7. `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-06.json`
8. `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-06.json`
9. relevant City/Kick/Current lane contracts
10. current implementation/tests on `main`

Older Stream Map specs/plans and execution snapshots remain historical and cannot override this chain.

## 12. Documentation synchronization rule

A normative behavior change is incomplete if a known contradictory active source-of-truth document remains. Every Stream Map PR must consider spec, active plan, roadmap, schedule, lane boundaries, collector/D1/cadence/retention impact and production impact.

## Retained completed milestone: 12A Twitch category rollout

The Twitch Heatmap category-filter rollout remains completed and accepted. Its historical acceptance records remain valid and are not rewritten by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors for the completed category program; they do not override the Stream Map current milestone above.

The Twitch Heatmap category-filter rollout is complete

PR #741 fixed only the intrinsic mobile control width; the accepted Twitch category rollout remains complete and does not authorize Kick category UI or any collector/cadence/storage change.

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.