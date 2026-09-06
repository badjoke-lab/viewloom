# ViewLoom documentation index

Status: source-of-truth map  
Stream Map audited runtime baseline: main `ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a`  
Last updated: 2026-09-06

## Read first for Stream Map work

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. the relevant lane contract/specification
7. current implementation/tests on `main`

Current-main documents and accepted contracts override cached handoffs, old chat summaries and superseded branch-local plans.

For Twitch City work, also read:

- `docs/product/stream-map-city-confidence-contract-v0.1.md`
- `docs/product/stream-map-city-visualization-spec-v0.1.md`
- `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`

Older versioned Stream Map specs/plans remain historical and do not override this current chain.

## Current Stream Map snapshot

```text
Program mainline                         Stream Map
Audited runtime baseline                 ff220d1d141e2bcd190692a1f1ffbb7ee5f5390a
Twitch Country                           closed at current product boundary
Twitch City                              C1-C6 complete / public accepted
Shared Twitch UI regression              complete #1245-#1247
Current / IRL public activation          false / disabled
Current 2026-09-05 live review           300 measured / 8 reviewed
Current fresh qualifying evidence        0
Current accepted placement               0
Current true unresolved conflicts        2
Kick Country review                      100 reviewed / 7 accepted / 3 excluded / 90 no evidence
Kick K1 runtime staging                  complete #1239
Kick KUI1                                complete #1241 / non-public
Kick KUI2                                complete #1242 / non-public
Kick KUI3a                               complete #1244 / 10 scenarios / 0 violations
Kick K2 stable-ID persistence            complete #1249 / production
Kick K2 production proof                 run 34008795931 / 100 observed / 100 stable IDs
Kick current mapped streams              0
Kick current API state                   blocked_reviewed_evidence
Kick K3                                  next / separate authorization required
Kick KUI3b                               waits K3
Kick K4                                  separate public activation gate
Kick canonical /kick/map/                absent / not public
Twitch production stable ID for Current  blocked pending its own authorization
Top20 weekly review                      maintenance sublane only
```

## Stream Map authority roles

### Normative product/data/UI semantics

`docs/product/stream-map-spec-v0.7.md`

### Active implementation sequence

`docs/product/stream-map-implementation-plan-v0.10.md`

### Current status

`docs/product/current-roadmap.md`

### Immediate order

`docs/product/current-schedule.md`

### Important lane contracts

- `docs/product/stream-map-city-confidence-contract-v0.1.md`
- `docs/product/stream-map-city-visualization-spec-v0.1.md`
- `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`
- `docs/product/stream-map-current-location-irl-contract-v0.1.md`
- `docs/product/stream-map-current-location-reviewability-contract-v0.1.md`
- `docs/product/kick-stream-map-country-live-join-contract-v0.1.md`
- `docs/product/kick-stream-map-evidence-persistence-contract-v0.1.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`

A lane contract narrows only its lane and cannot authorize another geography/provider path.

## Twitch Country summary

Country is closed at its current product boundary:

```text
filled Country regions
-> Streams/Viewers intensity
-> five log buckets
-> persistent Country selection independent of camera
-> explicit World view reset
-> mapped Country/stream drilldown
-> explicit unmapped diagnostics
```

Small-country markers are aggregate Country fallbacks only, never creator/current-location pins. Issue #1214 remains completed and closed.

## Twitch City summary

City remains explicit:

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Only accepted `home_base` / `declared_location` City evidence may place Base City. Country-only evidence is not promoted. Current/temporary evidence is not Base City. Conflicts fail closed.

Primary City semantics:

```text
primary object              City aggregate
aggregate key               countryCode + region-or-__none__ + city
creator point layer         prohibited
map geometry                reviewed static registry only
reference_point             City aggregate reference only
missing/ambiguous geometry  no_geometry / list-only
```

Current reviewed geometry remains 8 `reference_point` entries and 1 `no_geometry`. These are aggregate references, not creator coordinates or municipal-boundary claims.

## Current / IRL boundary

```text
Home/Base    durable accepted base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

September 5 review:

```text
Top300 population            300
reviewable candidates          8
reviewed identities            8
fresh qualifying evidence      0
accepted Current placement     0
no qualifying evidence         6
true unresolved conflicts      2
```

Current blockers remain:

```text
production Twitch snapshot does not retain user_id / twitchUserId
public Twitch geography route has no Current mode
fresh reviewed Current evidence = 0 accepted placements
```

Kick K2 authorization does not authorize Twitch collector changes. Current remains fail-closed. Stale Draft #1107 is not a merge candidate as-is.

## Kick Country boundary

Kick remains provider-separated. Stable identity is `broadcaster_user_id`, never slug/login.

Reviewed Country evidence:

```text
reviewed identities       100
accepted Country            7
excluded non-person         3
no qualifying evidence     90
conflict unmapped            0
```

K1 #1239 staged the reviewed Country bridge/runtime internally. The bridge deliberately strips provenance/raw profile text/viewer details beyond the terminal reviewed Country state; UI must not reconstruct what the runtime contract removed.

## Kick K2 production acceptance

K2 is complete through #1249.

Implementation:

```text
existing /public/v1/livestreams request
-> raw broadcaster_user_id
-> normalized Kick stream row
-> existing minute snapshot JSON
```

No additional Channels request, D1 schema/binding change, cadence change, retention/backfill change or Twitch collector change was made.

Provider-scoped deploy run `34008654160` deployed Kick only and skipped Twitch.

Production proof run `34008795931` observed:

```text
updatedAt                    2026-09-06T03:21:00.627Z
observedStreams              100
stableIdentityStreams        100
missingStableIdentityStreams   0
stableIdentityPercent          1
mappedStreams                  0
state                         blocked_reviewed_evidence
```

Draft #1083 is superseded by #1249 and closed.

## Kick next gates

```text
K3     production reviewed-evidence runtime join     NEXT / separate authorization required
KUI3b real production-connected UI/API/browser proof AFTER K3
K4     canonical /kick/map/ public activation        SEPARATE GATE
```

K2 completion does not authorize K3 or K4.

Until K4:

```text
/apps/web/kick/map/  absent
/kick/map/           not public
public activation    false
mapped public rows   0
```

Current exact production Kick blockers are:

```text
reviewed_kick_country_evidence_runtime_not_connected
public_country_activation_not_authorized
```

## Kick pre-public UI

```text
KUI1  fail-closed preview shell                 COMPLETE #1241
KUI2  Country aggregate choropleth/results      COMPLETE #1242
KUI3a non-mutating browser proof                COMPLETE #1244
KUI3b real production-connected proof           AFTER K3
```

KUI3a accepted run `33978336854`: 10 scenarios, zero violations, zero mobile horizontal overflow, 44px minimum ready actions, zero creator markers, zero Twitch API requests, no public Kick map link/canonical.

KUI3a is fixture proof only and does not satisfy KUI3b.

## Shared Map UI

The September 6 regression batch is complete:

```text
#1245 geography controls / keyboard / URL state / 44px
#1246 compact Country controls + active five-step intensity legend
#1247 City selected-City/filter/population/MapLibre mobile targets >=44px
```

Shared UI work is now scoped maintenance and does not serialize Kick or Current lanes.

## Reviewed-evidence maintenance

The bounded Top-20 process is a maintenance sublane only. It does not govern the entire Stream Map schedule and does not authorize collector/schema/cadence/retention changes.

## Production safety

- `main` is production; no direct push.
- Provider identity/evidence remains separated; no Twitch/Kick aggregation.
- Home/Base and Current/IRL remain distinct.
- No language/timezone/name/category/IP geography inference.
- No creator residential/GPS precision.
- No production collector, D1/schema/binding, cadence, retention or backfill mutation without its own authorization/gate.
- K2 authorization was consumed by #1249 and is not reusable for K3, K4 or Twitch stable-ID persistence.

## Permanent product records outside Stream Map

Stream Map updates must not delete or reinterpret accepted records for other ViewLoom surfaces.

### Local Watchlist

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Historical accepted category-program state

These records remain historical acceptance evidence and do not override the current Stream Map authority chain.

Twitch category stability + Heatmap public rollout complete

Public production acceptance run 31244148651 success

Accepted cutover record: `docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json`

The completed Twitch Heatmap category-filter rollout remains accepted. Kick category UI was not authorized by that rollout. The accepted production SHA remains `b006f45d0676c9ff3e05e5d6727458e43802de53`.
