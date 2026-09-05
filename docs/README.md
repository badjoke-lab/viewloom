# ViewLoom documentation index

Status: source-of-truth map  
Stream Map audited runtime baseline: main `d024276a9a478e488f15f507ffb736c091b5702c`  
Last updated: 2026-09-06

## Read first for Stream Map work

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/stream-map-spec-v0.7.md`
3. `docs/product/stream-map-implementation-plan-v0.10.md`
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
Program mainline                         Stream Map
Audited runtime baseline                 d024276a9a478e488f15f507ffb736c091b5702c
Twitch Country                           closed at current product boundary
Country primary renderer                 choropleth / filled regions
Country UI issue #1214                   completed / closed
Twitch City                              C1-C6 complete / public accepted
City primary semantic object             City aggregate
City reviewed reference points           8 aggregate references
City no_geometry                         1 / list-only
City creator coordinates                 not published / not inferred
City Current-location evidence filter    disabled
Current / IRL public activation          false / disabled
Current 2026-09-05 live review            300 measured / 8 reviewed
Current fresh qualifying evidence        0
Current accepted placement               0
Current true unresolved conflicts        2
Kick Country review                      100/100 complete: 7 accepted / 3 excluded / 90 no evidence
Kick internal runtime staging            connected / validated on real review artifacts
Kick KUI1 preview shell                  complete #1241 / non-public
Kick KUI2 Country aggregate UI           complete #1242 / non-public
Kick KUI3a browser proof                 complete #1244 / 10 scenarios / 0 violations
Kick KUI3b real-data proof               waits K3
Kick canonical /kick/map/                absent
Kick public reviewed-evidence runtime    not activated
Kick production stable ID                blocked pending collector authorization
Kick public activation                   blocked pending separate authorization/proof
Twitch production stable ID              blocked pending collector authorization
Twitch/Kick aggregation                  forbidden
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

Issue #1214 is completed and closed. Country maintenance does not block City/Kick/Current work.

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
reference_point             City aggregate reference only
missing/ambiguous geometry  no_geometry / list-only
```

City C1-C6 are complete through #1233. The current registry has 8 reviewed `reference_point` entries and 1 `no_geometry` entry. `Sant Cugat del Valles` remains list-only.

Public City acceptance includes reviewed marker/list reconciliation, mapped results before unmapped diagnostics, full-width mapped-stream results and a disabled Current-location evidence filter. Current / IRL itself remains disabled.

Acceptance audit:

`docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json`

## Current / IRL boundary

```text
Home/Base    durable accepted base geography
Current/IRL  fresh explicitly time-bounded accepted geography
```

Ready in code: optional stable-ID consumption, stable-ID coverage reporting, fail-closed Current response core and explicit public-readiness validation.

Fresh September 5 evidence state:

```text
Top300 live population      300
reviewable candidates         8
machine conflict rows         3
reviewed identities           8
fresh qualifying evidence     0
accepted Current placement    0
no qualifying evidence        6
true unresolved conflicts     2
```

The live queue's third machine conflict was `Japan` + `Tokyo` granularity for the same country and was not promoted to a competing-country conflict during manual review.

Fresh audit records:

- `docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-05.json`
- `docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-05.json`

Current blockers:

```text
production Twitch snapshot does not retain user_id / twitchUserId
public Twitch geography route has no Current mode
fresh reviewed Current evidence = 0 accepted placements
```

Current remains fail-closed. The same probe is not immediately rerun simply to seek a non-zero result. A later review requires a justified new signal/window.

Current never overwrites Base/Home automatically. Expired Current stops placing. Event venue alone does not prove presence. No inferred travel path or residential/GPS precision is published.

Stale Draft #1107 is not a merge candidate as-is and does not authorize a production collector change.

## Kick boundary

Kick remains provider-separated. Its stable identity is `broadcaster_user_id`, not slug/login.

The four reviewed Country batches are complete: 100 identities reviewed, 7 accepted, 3 excluded non-person, 90 with no qualifying evidence.

Runtime/data ready in code: stable-ID-capable snapshot parser, public adapter, reviewed-evidence bridge, stable-ID live join, Country response core and internal reviewed-evidence runtime staging.

K1 completed in PR #1239. The existing reviewed-evidence workflow validates the real four result files through the internal runtime staging path with reconciliation passing. Public activation remains false.

The pre-public UI lane is explicit:

```text
KUI1  fail-closed preview shell                 COMPLETE #1241
KUI2  Country aggregate choropleth/results      COMPLETE #1242
KUI3a non-mutating browser proof                COMPLETE #1244
KUI3b real production-connected proof           AFTER K3
K4    canonical /kick/map/ public activation    SEPARATE GATE
```

KUI1/KUI2/KUI3a remain under `apps/web/preview/kick-stream-map/`; they do not create `apps/web/kick/map/`, do not enter production Vite inputs and do not add a public navigation target.

KUI2 aggregates only reviewed terminal `geography.countryCode` rows and paints Country regions. It does not use creator coordinates or Twitch evidence.

KUI3a accepted browser run `33978336854` covers 5 fixture states × 2 viewports = 10 scenarios with zero violations. Every 390px scenario has zero horizontal overflow; the ready path proves 44px action targets, MapLibre canvas rendering, keyboard Country selection, metric switching and World view reset. Creator marker count and Twitch API request count are both zero. This fixture proof does not substitute for KUI3b real production-connected proof.

The current reviewed runtime bridge intentionally drops evidence/source prose beyond terminal reviewed Country. The UI therefore does not invent a source-provenance filter that the runtime contract cannot support.

Kick blockers remain:

```text
production Kick snapshot does not retain broadcaster_user_id
public Kick Country activation is not authorized
```

K2 production stable-ID persistence requires explicit collector authorization. Stale Draft #1083 is not a merge candidate as-is. Twitch evidence reuse and automatic Kick geography remain prohibited.

## Scheduling rule

The reviewed-evidence Top-20 cadence is maintenance-only and does not block:

- shared Map UI/accessibility/regression work;
- later justified Current/IRL read-only/evidence work;
- docs, fixtures, CI and preview-only verification;
- other safe non-mutating lane maintenance.

Explicit production collector authorization is required before either blocked stable-ID persistence change is implemented/merged.

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
DONE   documentation source-of-truth reconciliation #1219
DONE   Country closeout + #1214 completion
DONE   City C1-C6 through #1233
DONE   Twitch Current current-main readiness gate #1234
DONE   Kick Country current-main readiness gate #1235
DONE   Current fresh Top300 review: 300 -> 8 reviewed -> 0 accepted
DONE   Kick K1 internal reviewed-evidence runtime staging #1239
DONE   Kick KUI1 fail-closed pre-public shell #1241
DONE   Kick KUI2 Country aggregate renderer/results #1242
DONE   Kick KUI3a non-mutating browser proof #1244 / run 33978336854
PAR    shared Map regression/accessibility work and non-mutating lane maintenance
BLOCK  Kick K2 production stable-ID persistence pending explicit collector authorization
WAIT   Kick K3 production runtime connection until K2
WAIT   Kick KUI3b real production-connected proof until K3
BLOCK  Kick K4 canonical /kick/map/ activation pending separate authorization/proof
BLOCK  Current production stable-ID persistence pending explicit collector authorization
BLOCK  Current public path additionally pending fresh accepted temporal evidence
```

There is no active schedule that sends development back to City C1-C5.

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

The completed Twitch category/Heatmap rollout remains a historical accepted milestone and is preserved independently of Stream Map work.

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
