# ViewLoom Stream Map Implementation Plan v0.10

Status: accepted on merge / active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.9.md`  
Audited runtime baseline: main `ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a`  
Date: 2026-09-06

## 1. Current position

Twitch Country and Twitch City are closed at their current public product boundaries. The September 6 shared Twitch Map keyboard/mobile/legend regression batch is complete through #1247.

Current / IRL remains fail-closed after the September 5 Top300 review produced zero accepted temporal placements.

Kick Country remains split into runtime/data and pre-public UI tracks:

```text
runtime/data readiness
  K1 reviewed-evidence runtime staging              COMPLETE #1239
  K2 production broadcaster_user_id persistence    COMPLETE #1249
  K3 production reviewed-evidence runtime join     NEXT / SEPARATE AUTHORIZATION
  K4 public activation                             SEPARATE GATE

pre-public UI readiness
  KUI1 fail-closed preview shell                    COMPLETE #1241
  KUI2 Country aggregate choropleth/results UI      COMPLETE #1242
  KUI3a non-mutating browser proof                  COMPLETE #1244
  KUI3b real production-connected browser/API proof AFTER K3
```

The canonical public Kick Map route remains intentionally absent:

```text
/apps/web/kick/map/     absent
/kick/map/              not public
```

K2 does not activate K3 or K4.

## 2. K2 production acceptance — COMPLETE

PR #1249 implemented K2 from current main without the obsolete extra Channels enrichment from Draft #1083.

Production path:

```text
existing official /public/v1/livestreams request
-> raw broadcaster_user_id
-> KickOfficialStreamItem.broadcaster_user_id
-> existing minute_snapshots.payload_json
```

Properties:

- zero additional Kick API requests;
- no `/public/v1/channels` lookup added for stable identity;
- no legacy `kick.com/api/v2/channels/{slug}` stable-identity fallback;
- no D1 schema or binding change;
- no collector cadence change;
- no retention/backfill change;
- Twitch collector unchanged;
- slug/login remains display metadata only.

Provider-scoped production deploy run `34008654160` proved:

```text
deployKick      true
deployTwitch    false
providerScoped  true
deploy-kick     success
deploy-twitch   skipped
remote schema   success
```

Production API proof run `34008795931` observed the first accepted K2 state:

```text
updatedAt                    2026-09-06T03:21:00.627Z
sourceMode                   authenticated
observedStreams              100
stableIdentityStreams        100
missingStableIdentityStreams   0
stableIdentityPercent          1
mappedStreams                  0
mappedCountries                0
state                         blocked_reviewed_evidence
```

The public adapter continued to omit stable IDs from public unmapped rows and kept geography unpublished.

Exact remaining Kick public blockers after K2:

```text
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

Draft #1083 is superseded by #1249 and closed; its additional Channels enrichment must not be restored without a new justified decision.

## 3. Authority and execution rule

Read Stream Map work in this order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. relevant lane contracts/specifications
7. current implementation/tests on `main`

Older implementation plans remain historical and do not override v0.10.

A blocked or authorization-gated production dependency in one lane does not pause safe work in another lane. K2 authorization was specific to Kick stable-ID persistence and is consumed; it is not reusable authorization for K3, K4, Twitch stable-ID persistence, schema/cadence/retention changes or other production mutations.

## 4. Twitch Country — CLOSED

Accepted boundary remains:

- choropleth / filled Country regions are primary;
- small-country aggregate markers are fallback controls only;
- Streams/Viewers intensity with five positive log-scaled buckets;
- map/list selection synchronized;
- Country selection independent of camera movement;
- explicit `World view` reset;
- accepted-evidence-only placement;
- no creator-coordinate semantics.

Issue #1214 remains completed and closed. Future work is scoped regression, accessibility and evidence-quality maintenance only.

## 5. Twitch City — C1-C6 COMPLETE

City remains an aggregate geography surface, not creator-coordinate mapping.

Accepted boundary:

- explicit `?geography=city` mode;
- Base City only from accepted `home_base` / `declared_location` evidence;
- Country-only evidence is not promoted to City;
- Base City conflicts fail closed;
- current/temporary evidence is excluded from Base City placement;
- login is not stable identity;
- no address/GPS/creator coordinate publication;
- no Country-centroid City placement;
- Current / IRL remains separate and disabled.

Reviewed reference geometry remains:

```text
reference_point  8
no_geometry      1
```

Natural Earth points remain `city_aggregate_reference` targets only, never municipal-boundary or creator-position claims. `no_geometry` remains list-only.

C1-C6 remain complete through #1233. Shared mobile/browser regression closeout is complete through #1247.

## 6. Kick Country K1 — COMPLETE

PR #1239 staged the reviewed-evidence runtime path:

```text
completed manual review results
-> buildKickReviewedCountryEvidence(...)
-> stable broadcaster_user_id join
-> buildKickCountryResponse(...)
```

Reviewed evidence remains:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

The reviewed-evidence runtime bridge keeps only the minimum terminal state needed for runtime Country placement. It deliberately drops slug, viewer counts, raw profile text, source prose and location detail beyond terminal reviewed Country. UI must not reconstruct provenance that the runtime contract removed.

## 7. Kick Country K3 — NEXT, NOT YET AUTHORIZED

K2 has removed the stable-identity prerequisite. K3 is now technically unblocked but remains a separate production runtime behavior change.

K3 scope, if separately authorized:

```text
real production minute snapshot
-> broadcaster_user_id stable join
-> existing Kick-only reviewed Country evidence
-> deterministic Country terminal state
-> production Kick Country response
```

K3 must preserve:

- stable join uses `broadcaster_user_id` only;
- slug/login remains display metadata only;
- Twitch evidence is never reused;
- terminal states remain mapped / unmapped / excluded / conflict;
- Country code is the only geography needed for the Country surface;
- no City inference;
- no Current inference;
- no creator coordinates;
- no provenance fabrication;
- no public canonical route activation.

K3 by itself does not authorize K4.

## 8. Kick KUI1/KUI2/KUI3a — COMPLETE / NON-PUBLIC

KUI1 #1241, KUI2 #1242 and KUI3a #1244 remain under the non-production preview surface.

KUI3a accepted browser proof run `33978336854`:

```text
fixtures                       5
viewports                      2 (1440 / 390)
scenarios                     10
violations                     0
mobile horizontal overflow     0
minimum ready action target    44px
creator markers                0
Twitch API requests            0
public /kick/map/ links         0
canonical public URL           absent
```

KUI2 aggregates only `mappedStreams[].geography.countryCode`, uses local Country GeoJSON region fills, supports Streams/Viewers intensity, Country selection and World view, and keeps mapped/unmapped/excluded/conflict accounting explicit.

KUI3a is fixture-based proof only and cannot satisfy KUI3b.

## 9. Kick KUI3b — AFTER K3

Once K3 is separately authorized and production-connected reviewed Country rows exist, KUI3b must run the actual Kick UI against real production data:

```text
production snapshot
-> stable broadcaster_user_id join
-> reviewed Kick Country response
-> Country aggregate UI
-> desktop/mobile/browser verification
-> API/UI accounting reconciliation
```

KUI3b must prove at minimum:

- no fixture/demo geography substitution;
- Country totals equal the production response;
- mapped/unmapped/excluded/conflict accounting reconciles;
- Country selection never changes evidence acceptance;
- no creator coordinates emitted or inferred;
- no Twitch evidence consumed;
- empty/blocked states explicit.

KUI3b does not authorize K4 by itself.

## 10. Kick K4 — SEPARATE PUBLIC ACTIVATION GATE

Only K4 may create or activate canonical `/kick/map/`, add public navigation, or add the route to production Vite inputs.

K4 requires a separate explicit decision after K3 and KUI3b proof. Until then:

```text
/apps/web/kick/map/  absent
/kick/map/           not public
public activation    false
mapped public rows   0
```

## 11. Current Location / IRL — FAIL CLOSED

Fresh September 5 bounded review remains:

```text
population measured          300
reviewable candidates          8
identities reviewed             8
fresh qualifying evidence       0
accepted Current placement      0
no qualifying evidence          6
true unresolved conflicts       2
```

Current blockers remain:

```text
1. production Twitch minute snapshot does not retain user_id / twitchUserId
2. public Twitch geography route has no Current mode
3. fresh reviewed Current evidence = 0 accepted placements
```

No Kick K2 authorization applies to Twitch. Current production stable-ID persistence still needs its own authorization, and stable identity alone cannot clear the temporal evidence gate.

Stale Draft #1107 must not be merged as-is. Current never becomes Base/Home or Base City, and expired Current evidence never survives as a placement.

## 12. Shared UI / accessibility — CURRENT BATCH COMPLETE

The September 6 shared Twitch Map regression batch is complete:

```text
#1245 geography resolution controls / 44px / keyboard / URL state
#1246 compact Country controls + five-step intensity legend
#1247 City mobile selected-City/filter/population/MapLibre targets >=44px
```

Production Twitch Country/City browser smoke remained green after the batch. Shared UI is scoped maintenance/quality work only, not a serial blocker.

## 13. Reviewed-evidence maintenance

The bounded Top-20 maintenance process remains maintenance only. It does not serialize Map development, impose weekly idle time on safe lanes, automatically accept geography, or authorize collector/schema/cadence/retention mutation.

## 14. Shared hard stops

- no language/timezone/name/category/IP geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-residence/current placement;
- no City inference from Country;
- no Current inference from Country/Home/Base;
- no Country/region centroid as creator City coordinate;
- no arbitrary/fuzzy geocoder placement;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no inferred travel path;
- no collector/D1/schema/cadence/retention mutation without its separate authorization/gate.

## 15. Immediate execution order

```text
DONE   Twitch Country current product boundary + #1214 closeout
DONE   Twitch City C1-C6 + production/browser/public acceptance
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed preview shell #1241
DONE   Kick KUI2 Country aggregate preview renderer #1242
DONE   Kick KUI3a non-mutating browser proof #1244 / run 33978336854
DONE   Shared Twitch regression/accessibility batch #1245-#1247
DONE   Kick K2 direct production stable-ID persistence #1249
DONE   Kick K2 production proof #1250 / run 34008795931 / 100 of 100 stable IDs
NEXT   Kick K3 production reviewed-evidence runtime connection — separate authorization required
WAIT   Kick KUI3b real production-connected proof until K3
BLOCK  Kick K4 public /kick/map/ activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending its own authorization
BLOCK  Current public route/evidence gates remain unresolved
PAR    scoped Map regression/accessibility and reviewed-evidence maintenance only
```

## 16. Remaining Map completion path

```text
Twitch Country remains usable/tested/evidence-safe
AND Twitch City remains useful without inferred creator precision
AND Kick K2 stable identity remains healthy in production
AND Kick K3 connects reviewed Country evidence only under separate authorization
AND Kick KUI3b proves real production-connected Country rendering after K3
AND Kick /kick/map/ is created only through separate K4 activation
AND Current/IRL reaches a public layer only if separately authorized identity prerequisites and fresh accepted temporal evidence both exist
AND provider/geography/evidence boundaries remain explicit
AND current plan/roadmap/schedule/index match main
```

## 17. Documentation synchronization gate

For every normative Stream Map change evaluate spec, active plan, roadmap, schedule, lane contracts, provider/geography boundaries, collector/D1/cadence/retention impact and production impact. Material plan changes require a new version; execution-state updates may remain in v0.10 when sequencing and semantics do not change.
