# ViewLoom documentation index

Status: source-of-truth map  
Stream Map audited runtime baseline: main `24cd444bfe564588b70c16a335f07d2c41627c0b`  
Last updated: 2026-09-05

## Read first for Stream Map work

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.7.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. the relevant lane-specific contract/specification
7. the current implementation/tests on `main`

For Twitch City visualization work, also read:

- `docs/product/stream-map-city-confidence-contract-v0.1.md`
- `docs/product/stream-map-city-visualization-spec-v0.1.md`

This is the current Stream Map authority chain. Older versioned Stream Map specs/plans remain in the repository as history but do not override the documents above.

`docs/product/stream-map-current-execution-v0.1.md` is a superseded historical execution snapshot, not an additional current override.

## Permanent product records outside the Stream Map authority chain

The source-of-truth index also retains accepted permanent records for other ViewLoom surfaces. Updating Stream Map authority must not delete these references or reinterpret their accepted contracts.

### Local Watchlist

- `docs/product/local-watchlist-spec.md`
- `docs/product/watchlist-v1-implementation-plan.md`
- `docs/operations/watchlist-production-acceptance-2026-06-25.md`

These Watchlist records remain permanent and independent of the Stream Map scheduling changes below.

## Current Stream Map snapshot

```text
Program mainline                    Stream Map
Audited runtime baseline            24cd444bfe564588b70c16a335f07d2c41627c0b
Twitch Country                      closed at current product boundary
Country primary renderer            choropleth / filled regions
Country marker/region A-B switch    retired
Country intensity                   Streams / Viewers, 5 log buckets
Country compact UI                  merged #1218
Country stale marker contract       repaired #1220
Country production deploy           33934879891 success
Country + City production smoke     33934879840 success
City explicit API/UI                implemented
City stable-ID coverage states      implemented
City primary semantic object        City aggregate
City creator coordinates            not published / not inferred
City C1 aggregate selection         NOW
City C2 geometry-source audit       NOW / parallel
Country -> City inference           forbidden
Current / IRL public placement      separate; fail closed without fresh accepted evidence
Kick reviewed Country path          advancing separately
Twitch/Kick aggregation             forbidden
Top20 weekly review                 maintenance sublane only
```

## Stream Map source-of-truth roles

### Normative product/data/UI semantics

`docs/product/stream-map-spec-v0.7.md`

Use this to answer what the product is allowed to mean and how Country/City/Kick/Current boundaries work.

### Active implementation sequence

`docs/product/stream-map-implementation-plan-v0.7.md`

Use this to answer what has already been implemented and the next gate inside each parallel lane.

### Current status

`docs/product/current-roadmap.md`

Use this for the current lane-level state and next product gate.

### Immediate order

`docs/product/current-schedule.md`

Use this for the current mainline order and parallel work that may continue without waiting.

### Lane contracts

Important Stream Map contracts include:

- `docs/product/stream-map-city-confidence-contract-v0.1.md`
- `docs/product/stream-map-city-visualization-spec-v0.1.md`
- `docs/product/stream-map-current-location-irl-contract-v0.1.md`
- `docs/product/stream-map-current-location-reviewability-contract-v0.1.md`
- `docs/product/kick-stream-map-country-live-join-contract-v0.1.md`
- `docs/product/kick-stream-map-evidence-persistence-contract-v0.1.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`

A lane contract narrows its lane. It does not authorize another lane or override newer normative product semantics outside its scope.

## Current Country contract summary

Country is closed at its current product boundary. Placement remains accepted-evidence-only.

Current renderer/UI:

```text
filled Country regions
-> Streams/Viewers intensity
-> 5 log buckets
-> click/tap Country selection
-> persistent selection independent of camera
-> explicit World view camera reset
-> mapped Country/stream drilldown
-> explicit unmapped diagnostics
```

Small-country fallback markers are Country aggregate interaction fallbacks only. They are not creator/current-location pins.

Effective Country runtime content order:

```text
Map
-> selected Country when present
-> mapped countries / mapped streams
-> unmapped diagnostics
```

The full mapped list remains available for exact values, keyboard/accessibility paths and geometry fallback cases.

Closeout record:

`docs/audits/twitch-stream-map-country-closeout-2026-09-05.md`

Future Country work is scoped defect/accessibility/evidence maintenance and does not block City/Kick/Current work.

## Current City contract summary

City is already implemented as an explicit opt-in geography mode and remains evidence-safe/non-precise.

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Only accepted `home_base` / `declared_location` City evidence can place Base City. Country-only evidence is not promoted. Current/temporary evidence is not Base City. Conflicting Base City evidence fails closed.

Stable Twitch ID availability is represented honestly (`unavailable`, `partial`, `available`); login is not treated as a stable ID.

The City visualization specification now fixes:

```text
primary object              City aggregate
aggregate key               countryCode + region + city
creator point layer         prohibited
exact list                  first-class
map geometry                reviewed City reference geometry only
missing map geometry        list-only; no invented target
```

The City renderer must not publish or infer creator City coordinates. Country/region centroids are not creator locations.

Current City work:

```text
C1 aggregate model + selection       NOW
C2 reference-geometry source audit   NOW / parallel
C3 aggregate map renderer            only after C2 accepts a source
C4 responsive/detail UI              after/with C3
C5 production proof                  after C3/C4
```

## Current / IRL boundary

```text
Home/Base    durable accepted base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Current never overwrites Base/Home automatically. Expired Current evidence stops placing. Event venue alone does not prove current presence. No inferred travel path or precise residential/GPS data is published.

The presence of stable-ID plumbing does not itself authorize a public Current layer.

## Kick boundary

Kick remains provider-separated. Its stable identity comes from the accepted official Channels join and `broadcaster_user_id`, not slug/login.

Recent work includes a reviewed Kick Country evidence bridge (#1197) and subsequent reviewed Country batches (#1203). These do not authorize Twitch evidence reuse or automatic public Kick Map activation.

## Scheduling rule

The reviewed-evidence Top-20 cadence is maintenance-only.

It does not block otherwise-safe:

- City aggregate/model/UI work;
- City reference-geometry audit;
- Kick read-only/evidence/API work;
- Current/IRL read-only/evidence work;
- Map UI/accessibility work;
- docs, fixtures, CI and preview-only verification.

## Global Stream Map invariants

- provider-scoped identities remain provider-separated;
- no Twitch/Kick geography or viewer aggregation;
- no language/timezone/name/category/IP geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-residence/current placement;
- no City inference from Country;
- no Current inference from Country/Home/Base;
- no Country/region centroid as creator City coordinate;
- no arbitrary/fuzzy geocoder City placement;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no inferred travel path;
- collector cadence, retention, D1 schema/binding, backfill and permanent acquisition changes remain separately gated.

## Current mainline order

```text
DONE  documentation source-of-truth reconciliation #1219
DONE  Country closeout + stale marker contract repair #1220
NOW   City C1 aggregate model/selection
NOW   City C2 reference-geometry source audit
NEXT  City C3 aggregate renderer only after accepted geometry source
NEXT  City C4 responsive/detail UI
THEN  City C5 browser + production proof
```

Kick Country, Current/IRL, shared UI/accessibility and reviewed-evidence maintenance continue as parallel lanes under their own gates.

## Historical records

Older Stream Map files such as:

- `stream-map-spec-v0.6.md` and earlier;
- `stream-map-implementation-plan-v0.6.md` and earlier;
- `stream-map-current-execution-v0.1.md`;
- dated Stream Map audits/measurement/maintenance closeouts;

remain useful for history and auditability. They must not be read as current Stream Map scheduling authority when they conflict with the current authority chain above.

This historical status does not apply to the permanent non-Stream-Map records explicitly listed earlier in this index.

## Documentation synchronization rule

A normative Stream Map behavior change must not leave a known contradictory active `source of truth` document behind.

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

Material changes to a versioned specification/plan should create a new version and supersede the old one instead of rewriting historical meaning.

## Retained Twitch category rollout

The completed Twitch category/Heatmap rollout remains a historical accepted milestone and is preserved independently of the Stream Map documentation update.

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
