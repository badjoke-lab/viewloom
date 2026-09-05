# ViewLoom documentation index

Status: source-of-truth map  
Stream Map audited runtime baseline: main `801860483b50bf418d8edfb5295542244e69c138`  
Last updated: 2026-09-05

## Read first for Stream Map work

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.7.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. the relevant lane contract/specification
7. current implementation/tests on `main`

For Twitch City work, also read:

- `docs/product/stream-map-city-confidence-contract-v0.1.md`
- `docs/product/stream-map-city-visualization-spec-v0.1.md`
- `docs/product/stream-map-city-reference-geometry-contract-v0.1.md`

Older versioned Stream Map specs/plans remain history and do not override this current chain. `docs/product/stream-map-current-execution-v0.1.md` remains a superseded historical snapshot, not an active override.

## Permanent product records outside Stream Map

Stream Map updates must not delete or reinterpret accepted records for other ViewLoom surfaces.

### Local Watchlist

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

## Current Stream Map snapshot

```text
Program mainline                    Stream Map
Audited runtime baseline            801860483b50bf418d8edfb5295542244e69c138
Twitch Country                      closed at current product boundary
Country primary renderer            choropleth / filled regions
Country marker/region A-B switch    retired
Country production deploy           33934879891 success
Country + City production smoke     33934879840 success
City explicit API/UI                implemented
City stable-ID coverage states      implemented
City primary semantic object        City aggregate
City creator coordinates            not published / not inferred
City C1 aggregate selection         PR #1222 in review
City C2 geometry-source contract    PR #1223 in review / accepted on merge
City geometry runtime API           none authorized
City missing geometry               list-only / no_geometry
Current / IRL public placement      separate; fail closed without fresh accepted evidence
Kick reviewed Country path          advancing separately
Twitch/Kick aggregation             forbidden
Top20 weekly review                 maintenance sublane only
```

## Stream Map authority roles

### Normative product/data/UI semantics

`docs/product/stream-map-spec-v0.7.md`

### Active implementation sequence

`docs/product/stream-map-implementation-plan-v0.7.md`

### Current status

`docs/product/current-roadmap.md`

### Immediate order

`docs/product/current-schedule.md`

### Lane contracts

Important Stream Map contracts include:

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

## Current Country summary

Country is closed at its current product boundary.

```text
filled Country regions
-> Streams/Viewers intensity
-> 5 log buckets
-> persistent Country selection independent of camera
-> explicit World view reset
-> mapped Country/stream drilldown
-> explicit unmapped diagnostics
```

Small-country markers remain aggregate Country fallbacks only, never creator/current-location pins.

Effective runtime order:

```text
Map
-> selected Country when present
-> mapped countries / mapped streams
-> unmapped diagnostics
```

Closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Country maintenance does not block City/Kick/Current work.

## Current City summary

City remains explicit:

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Only accepted `home_base` / `declared_location` City evidence can place Base City. Country-only evidence is not promoted. Current/temporary evidence is not Base City. Conflicts fail closed.

Stable Twitch ID state is represented as `unavailable | partial | available`; login is not stable identity.

City visualization semantics:

```text
primary object              City aggregate
aggregate key               countryCode + region-or-__none__ + city
creator point layer         prohibited
exact aggregate list        first-class
map geometry                reviewed static registry only
missing/ambiguous geometry  no_geometry / list-only
```

### C1

PR #1222 implements deterministic City aggregate selection and selected-City stream drilldown without geometry.

### C2

PR #1223 freezes the geometry-source strategy:

```text
reviewed geoBoundaries gbOpen municipal/City polygon when semantically valid
-> otherwise reviewed Natural Earth Populated Places aggregate reference point
-> otherwise no geometry
```

Rules:

- no fixed ADM-level=City assumption;
- no fuzzy/nearest match;
- no Country/region centroid;
- no venue or creator-coordinate substitution;
- no runtime Nominatim/geocoder;
- Overture Divisions deferred for v0.1;
- no external geometry API in the public browser;
- geometry does not decide streamer placement.

Source audit:

`docs/audits/twitch-stream-map-city-reference-geometry-source-audit-2026-09-05.md`

Next after C2: review geometry only for the current accepted City aggregate keys, produce a bounded static registry/artifact, then C3 consumes only those accepted entries.

## Current / IRL boundary

```text
Home/Base    durable accepted base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Current never overwrites Base/Home automatically. Expired Current stops placing. Event venue alone does not prove presence. No inferred travel path or residential/GPS precision is published.

Stable-ID plumbing does not itself authorize Current.

## Kick boundary

Kick remains provider-separated. Its stable identity is the accepted official Channels join / `broadcaster_user_id`, not slug/login.

Twitch evidence reuse and automatic Kick geography remain prohibited.

## Scheduling rule

The reviewed-evidence Top-20 cadence is maintenance-only and does not block:

- City C1/C2/C3 work;
- Kick read-only/evidence/API work;
- Current/IRL read-only/evidence work;
- Map UI/accessibility work;
- docs, fixtures, CI and preview-only verification.

## Global Stream Map invariants

- provider-scoped identities remain provider-separated;
- no Twitch/Kick geography/viewer aggregation;
- no language/timezone/name/category/IP geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-residence/current placement;
- no City inference from Country;
- no Current inference from Country/Home/Base;
- no Country/region centroid as creator City coordinate;
- no fuzzy geocoder City placement;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no demo geography presented as real;
- no residential address/GPS publication;
- no inferred travel path;
- collector cadence, retention, D1 schema/binding, backfill and permanent acquisition changes remain separately gated.

## Current mainline order

```text
DONE      documentation source-of-truth reconciliation #1219
DONE      Country closeout #1220
DONE      City visualization specification #1221
IN REVIEW City C1 aggregate model/selection #1222
IN REVIEW City C2 reference-geometry source contract #1223
NEXT      reviewed current-City geometry registry/artifact
NEXT      City C3 aggregate renderer
NEXT      City C4 responsive/detail UI
THEN      City C5 production proof
```

Kick Country, Current/IRL, shared UI/accessibility and reviewed-evidence maintenance continue in parallel.

## Historical records

Older Stream Map specs/plans/execution snapshots remain useful for audit history but cannot override the current authority chain.

This does not make permanent non-Stream-Map records historical; the Watchlist records above remain accepted permanent product records.

## Documentation synchronization rule

A normative Stream Map change must not leave a known contradictory active source-of-truth document.

Every relevant PR must consider:

```text
spec impact
implementation-plan impact
roadmap impact
schedule impact
Country/City/Kick/Current boundary impact
collector/D1/schema/cadence/retention impact
production impact
```

Material changes to a versioned specification/plan use a new version rather than rewriting historical meaning.

## Retained Twitch category rollout

The completed Twitch category/Heatmap rollout remains a historical accepted milestone and is preserved independently of Stream Map changes.

- final seven-day audit accepted `2016 / 2016` expected slots;
- category-reference coverage was `0.995353`;
- PR #740 exposed Category + Top;
- PR #741 repaired the rejected 390px mobile overflow;
- accepted production SHA was `b006f45d0676c9ff3e05e5d6727458e43802de53`;
- no Kick category UI was authorized by the Twitch rollout.

Historical development-policy verifier anchors retained below; they do not redefine the current Stream Map milestone:

```text
Twitch category stability + Heatmap public rollout complete
Public production acceptance run 31244148651 success
12a5-twitch-heatmap-category-public-cutover-acceptance.json
Current-main documents and accepted contracts override cached handoffs
```
