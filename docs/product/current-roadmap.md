# ViewLoom current roadmap

Status: source of truth for current Stream Map program state  
Normative specification: `docs/product/stream-map-spec-v0.7.md`  
Execution plan: `docs/product/stream-map-implementation-plan-v0.10.md`  
City visualization specification: `docs/product/stream-map-city-visualization-spec-v0.1.md`  
City reference-geometry contract: `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`  
Audited runtime baseline: main `ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a`  
Last updated: 2026-09-06

## 1. Current milestone

**Twitch Country and Twitch City are closed at their current public product boundaries. Shared Twitch Map regression closeout is complete through #1247. Kick K1 and KUI1/KUI2/KUI3a are complete, and K2 production stable-ID persistence is now complete through #1249 with production proof run `34008795931`: 100 observed streams / 100 stable IDs / 0 mapped streams. K3 is technically unblocked by K2 but remains a separate production runtime change requiring separate authorization. KUI3b waits for K3. K4 remains a separate public activation gate and `/kick/map/` remains intentionally absent. Current / IRL remains fail-closed with zero accepted fresh temporal placements.**

The Map program is not scheduled by the weekly Top-20 reviewed-evidence maintenance clock.

## 2. Current lane state

| Lane | Current state | Next product gate |
| --- | --- | --- |
| Twitch Country | closed; choropleth/UI/production proof complete; shared control/legend regression #1245-#1246 complete | scoped maintenance only |
| Twitch City | C1-C6 complete/public accepted; aggregate reference/list-only fallback; mobile target regression #1247 complete | scoped maintenance only |
| Kick Country runtime | K1 complete; K2 complete in production; 100/100 current observed rows carry `broadcaster_user_id` | K3 reviewed-evidence public runtime connection, separate authorization required |
| Kick Country UI | KUI1 #1241 + KUI2 #1242 + KUI3a #1244 complete/non-public | KUI3b only after K3 |
| Kick public activation | unauthorized; canonical `/kick/map/` absent | K4 separate authorization/proof |
| Current / IRL | 300 measured / 8 reviewed / 0 accepted / 2 true conflicts; public control disabled | fail closed; separate Twitch identity authorization plus fresh accepted temporal evidence required |
| Shared Map UI | September 6 regression batch complete #1245-#1247 | scoped regression/accessibility only |
| Reviewed-evidence maintenance | bounded maintenance only | never block Map lanes |

## 3. Twitch Country — CLOSED

Accepted boundary remains:

- accepted-evidence-only Country placement;
- filled Country regions as primary visualization;
- small-country aggregate fallback only;
- Streams/Viewers five log-scaled buckets;
- persistent Country selection independent of camera;
- explicit `World view` reset;
- mapped Country/stream drilldown plus explicit unmapped diagnostics;
- no creator-coordinate semantics.

Issue #1214 remains completed and closed.

## 4. Twitch City — C1-C6 COMPLETE

Accepted City boundary remains:

- explicit `/api/twitch-stream-map?geography=city` and `/twitch/map/?geography=city`;
- Base City only from accepted `home_base` / `declared_location` evidence;
- Country-only evidence is not promoted to City;
- Base City conflicts fail closed;
- current/temporary evidence does not become Base City;
- login is not stable identity;
- no creator address/GPS/coordinates;
- no Country-centroid City placement;
- Current placement remains zero in Base City mode.

Primary semantic object:

```text
cityAggregateKey = countryCode + normalized region (or __none__) + normalized city
```

Completed sequence:

```text
C1 deterministic City aggregate model + selection                  #1222
C2 reference-geometry strategy                                     #1223
C3 bounded reviewed reference registry                             #1224-#1226
C4 aggregate reference-point rendering + map/list sync             #1227
C5 public activation/production structural verification            #1228-#1229
C6 presentation cleanup + public acceptance                        #1230-#1233
```

Current geometry registry remains `reference_point=8`, `no_geometry=1`. Reference points are City aggregate references only, never creator coordinates or municipal-boundary claims.

## 5. Kick Country — K1 COMPLETE

Reviewed evidence remains:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

K1 #1239 connected these reviewed results to the internal stable-ID staging path. The runtime bridge deliberately keeps only terminal reviewed Country state and drops provenance/raw profile text/viewer metadata that the UI must not reconstruct.

## 6. Kick Country — K2 COMPLETE IN PRODUCTION

PR #1249 retained `broadcaster_user_id` directly from the already-used official `/public/v1/livestreams` response.

No additional Channels request was added. No D1 schema/binding, cadence, retention, backfill or Twitch collector change was made.

Production deployment run `34008654160`:

```text
deployKick      true
deployTwitch    false
deploy-kick     success
deploy-twitch   skipped
remote schema   success
```

Production API proof run `34008795931`:

```text
updatedAt                    2026-09-06T03:21:00.627Z
observedStreams              100
stableIdentityStreams        100
missingStableIdentityStreams   0
stableIdentityPercent          1
mappedStreams                  0
state                         blocked_reviewed_evidence
```

The stable-ID blocker is therefore closed. Draft #1083 was superseded by #1249 and closed.

## 7. Kick Country — K3 NEXT / SEPARATE AUTHORIZATION

K3 may now use the real production `broadcaster_user_id` to connect the already-staged reviewed Kick Country evidence to the production runtime.

K3 is **not** authorized merely because K2 completed. Required invariants remain:

- `broadcaster_user_id` is the only stable join key;
- slug/login is display metadata only;
- Twitch evidence is never reused;
- Country-only terminal states remain mapped / unmapped / excluded / conflict;
- no City or Current inference;
- no creator coordinates;
- public canonical route remains absent;
- public activation remains false.

Current exact Kick blockers after K2:

```text
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

## 8. Kick UI — KUI1/KUI2/KUI3a COMPLETE / KUI3b WAITS

```text
KUI1  fail-closed non-public preview              COMPLETE #1241
KUI2  Country aggregate choropleth/results        COMPLETE #1242
KUI3a fixture browser proof                       COMPLETE #1244
KUI3b real production-connected proof             AFTER K3
K4    canonical /kick/map/ public activation      SEPARATE GATE
```

KUI3a accepted run `33978336854`: 5 fixtures × 2 viewports = 10 browser scenarios, zero violations, zero mobile horizontal overflow, 44px minimum ready action targets, zero creator markers, zero Twitch API requests, no public `/kick/map/` link/canonical.

KUI3a remains fixture proof only. KUI3b must use real production-connected reviewed Country rows after K3.

## 9. Kick public route — STILL ABSENT

```text
/apps/web/kick/map/  absent
/kick/map/           not public
public navigation    unchanged
production Vite      unchanged for Kick canonical map
public activation    false
```

Only K4 may change this boundary after separate authorization and K3/KUI3b proof.

## 10. Current Location / IRL — FAIL CLOSED

Fresh September 5 review remains:

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

Kick K2 authorization does not authorize Twitch collector changes. Current stays fail-closed and Draft #1107 remains non-mergeable as-is.

## 11. Shared Map UI — CURRENT REGRESSION BATCH COMPLETE

```text
#1245 geography controls / keyboard / URL state / 44px
#1246 compact Country metric controls + five-step legend
#1247 City selected-City/filter/population/MapLibre mobile targets >=44px
```

Production Twitch Country/City browser smoke remained green. Shared UI is scoped maintenance only.

## 12. Reviewed-evidence maintenance — MAINTENANCE ONLY

Top-20 reviewed-evidence maintenance does not serialize Map development and does not authorize collector/schema/cadence/retention changes.

## 13. Shared operational boundaries

Unless separately authorized:

- no production collector mutation outside the explicitly approved gate;
- no D1 schema/binding change;
- no cadence change;
- no retention/backfill change;
- no Twitch/Kick evidence or identity aggregation;
- no demo geography as real evidence;
- no creator-coordinate inference;
- no Home/Base and Current/IRL conflation.

The K2 authorization has been consumed by #1249 and cannot be reused as authorization for K3/K4 or Twitch stable-ID persistence.

## 14. Current execution order

```text
DONE   Twitch Country current boundary + #1214 closeout
DONE   Twitch City C1-C6 through #1233
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 #1241
DONE   Kick KUI2 #1242
DONE   Kick KUI3a #1244 / run 33978336854
DONE   Shared Twitch UI regression batch #1245-#1247
DONE   Kick K2 production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
NEXT   Kick K3 production reviewed-evidence runtime connection — separate authorization required
WAIT   Kick KUI3b until K3
BLOCK  Kick K4 canonical /kick/map/ activation pending separate authorization/proof
BLOCK  Current Twitch stable-ID persistence pending its own authorization
BLOCK  Current public route/evidence gates remain unresolved
PAR    scoped UI/evidence maintenance only
```

CI waiting or a blocked production dependency in one lane does not pause safe work in another lane.

## 15. Authoritative current records

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant lane contracts/specifications
7. current implementation/tests on `main`

Older plans/snapshots are historical and cannot override this chain.

## 16. Documentation synchronization rule

A normative behavior or accepted execution-state change is incomplete if a known contradictory active source-of-truth document remains.

## Retained completed milestone: 12A Twitch category rollout

The completed Twitch category rollout remains accepted historical evidence and is not reopened by Stream Map work.

## Current gate: post-rollout category program handoff

This heading and the following statements are retained as historical verifier anchors only; they do not override the Stream Map milestone above.

The Twitch Heatmap category-filter rollout is complete

Historical closeout action: close the completed Twitch replacement audit (#659). This sentence is retained solely for the accepted development-policy verifier and does not reopen that historical workstream.
