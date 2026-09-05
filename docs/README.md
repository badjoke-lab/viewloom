# ViewLoom documentation index

Status: source-of-truth map  
Stream Map baseline: main `6ee0402d38aa47856e7d841b2c4a4544959b70c6`  
Last updated: 2026-09-05

## Read first for Stream Map work

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.6.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. the relevant lane-specific contract
7. the current implementation/tests on `main`

This is the current authority chain. Older versioned specs/plans remain in the repository as history but do not override the documents above.

`docs/product/stream-map-current-execution-v0.1.md` is now a superseded historical execution snapshot, not an additional current override.

## Current Stream Map snapshot

```text
Program mainline                    Stream Map
Baseline                            6ee0402d38aa47856e7d841b2c4a4544959b70c6
Twitch Country public API/map       active
Country primary renderer            choropleth / filled regions
Country marker/region A-B switch    retired
Country intensity                   Streams / Viewers, 5 log buckets
Country compact UI                  merged #1218
City explicit API/UI                implemented
City stable-ID coverage states      implemented
City creator coordinates            not published / not inferred
Country -> City inference           forbidden
Current / IRL public placement      separate; fail closed without fresh accepted evidence
Kick reviewed Country path          advancing separately
Twitch/Kick aggregation             forbidden
Top20 weekly review                  maintenance sublane only
```

## Stream Map source-of-truth roles

### Normative product/data/UI semantics

`docs/product/stream-map-spec-v0.7.md`

Use this to answer what the product is allowed to mean and how Country/City/Kick/Current boundaries work.

### Active implementation sequence

`docs/product/stream-map-implementation-plan-v0.6.md`

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
- `docs/product/stream-map-current-location-irl-contract-v0.1.md`
- `docs/product/stream-map-current-location-reviewability-contract-v0.1.md`
- `docs/product/kick-stream-map-country-live-join-contract-v0.1.md`
- `docs/product/kick-stream-map-evidence-persistence-contract-v0.1.md`
- `docs/product/stream-map-population-filter-decision-v0.1.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`

A lane contract narrows its lane. It does not authorize another lane or override newer normative product semantics outside its scope.

## Current Country contract summary

Country placement remains accepted-evidence-only.

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

## Current City contract summary

City is already implemented as an explicit opt-in geography mode, but it remains evidence-safe and intentionally non-precise.

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Only accepted `home_base` / `declared_location` City evidence can place Base City. Country-only evidence is not promoted. Current/temporary evidence is not Base City.

The City renderer suppresses Country aggregate markers and does not publish or infer creator City coordinates. Country centroids are not creator locations.

Stable Twitch ID availability is represented honestly (`unavailable`, `partial`, `available`); login is not treated as a stable ID.

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

- Country closeout;
- City specification/implementation;
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
- no Country centroid as creator City coordinate;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no inferred travel path;
- collector cadence, retention, D1 schema/binding, backfill and permanent acquisition changes remain separately gated.

## Current mainline order

```text
1. reconcile documentation source of truth
2. close out Country against spec v0.7
3. freeze richer City visualization/interaction specification
4. implement City from that specification
5. verify City while preserving Country behavior
```

Kick Country, Current/IRL, shared UI/accessibility and reviewed-evidence maintenance continue as parallel lanes under their own gates.

## Historical records

Older files such as:

- `stream-map-spec-v0.6.md` and earlier;
- `stream-map-implementation-plan-v0.5.md` and earlier;
- `stream-map-current-execution-v0.1.md`;
- dated audits/measurement/maintenance closeouts;

remain useful for history and auditability. They must not be read as current scheduling authority when they conflict with the current authority chain above.

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
