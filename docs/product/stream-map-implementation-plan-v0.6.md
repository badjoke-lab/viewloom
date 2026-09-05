# ViewLoom Stream Map Implementation Plan v0.6

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.7.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.5.md`  
Baseline: main `6ee0402d38aa47856e7d841b2c4a4544959b70c6`  
Last updated: 2026-09-05

## 1. Current position

The Stream Map program has moved materially beyond v0.5. The current main already contains the Twitch Country choropleth and compact Country UI, a real opt-in City contract/renderer with stable-ID coverage states, continued Kick Country evidence work, and a Current snapshot stable-ID adapter.

The immediate task is therefore not to replay old Country/City gates. It is to keep the specification/status layer aligned with the implemented product and continue each remaining lane from its actual boundary.

## 2. Execution model

Map development is parallel:

```text
Lane A  Twitch Country closeout / maintenance quality
Lane B  Twitch City specification and renderer refinement
Lane C  Kick Country evidence/API/public activation
Lane D  Current Location / IRL accepted-evidence/API/UI gate
Lane E  shared Map UI/accessibility/verification
Lane M  reviewed-evidence maintenance only
```

Lane M does not schedule or block A-E. CI waiting or maintenance cadence in one lane is not a reason to stop safe work in another.

Shared sequence inside a lane:

```text
normative spec/contract
-> read-only audit or deterministic fixture
-> implementation
-> verification
-> public activation when separately authorized
-> production read/browser proof when appropriate
```

## 3. Lane A — Twitch Country

### A1. Evidence/data pipeline — ESTABLISHED

The Country path already has:

- source audit and accepted evidence vocabulary;
- stable-identity-backed review paths;
- population filters;
- evidence source/type filters;
- country drilldown;
- reason-aware unmapped/excluded accounting;
- bounded reviewed-evidence maintenance and expansion tooling.

Coverage work is an ongoing quality program and is not a blocker for City/Kick/Current/UI development.

### A2. Country renderer — DONE (#1213)

The public Country renderer is fixed to choropleth semantics:

- filled Country regions are primary;
- ordinary aggregate Country markers are not an alternate public mode;
- small-country fallback markers are allowed only where local polygon geometry is not a practical target;
- Streams/Viewers intensity uses five log buckets;
- Country basemap is geographic context, not street navigation;
- mobile/world camera is bounded;
- no Country geometry is treated as creator coordinates.

The old Markers/Regions A/B experiment is retired and must not be revived as the product default.

### A3. Country UI — DONE (#1218)

Current public Country interaction:

- segmented Streams/Viewers controls;
- five-step Low→High legend;
- Country selection persists independently of camera movement;
- selecting a Country does not auto-fit the camera;
- `World view` explicitly resets the camera;
- `Clear country` clears selection only;
- desktop hover is informational;
- selected Country has compact totals and `Show streams` action;
- effective runtime content order is Map → selected Country → mapped countries/streams → unmapped diagnostics;
- mapped result pane is bounded/scrollable where appropriate;
- per-stream evidence and detailed unmapped diagnostics are collapsed by default;
- mobile filters are compacted behind a dedicated toggle.

### A4. Production verification — DONE for current Country/City structural contract

Production smoke was converted from transient copy/marker assumptions to stable structure through #1215-#1217. The current structural checks cover the Country region source/layers and City isolation instead of depending on old visible aggregate-marker or exact-copy behavior.

### A5. Next Country action — CLOSEOUT AUDIT

After this documentation baseline merges:

1. compare `stream-map-spec-v0.7.md` against current Country implementation;
2. verify Country browser tests still represent #1218 behavior;
3. verify no active docs still instruct developers to restore marker-first Country behavior;
4. record any remaining UI/accessibility defect as a new scoped issue rather than reopening the retired A/B experiment.

Country evidence maintenance remains independent after closeout.

## 4. Lane B — Twitch City

### B1. Base City semantics — DONE

Only accepted Base evidence may place City:

```text
home_base
declared_location
```

Country-only evidence is not promoted. Current/temporary/event/travel evidence cannot mutate Base City. Conflicting qualifying City evidence fails closed. Public precise residential/address/GPS data is forbidden.

### B2. Explicit City API/UI — DONE

City is opt-in:

```text
/api/twitch-stream-map?geography=city
/twitch/map/?geography=city
```

Default remains Country.

### B3. Stable identity contract — DONE (#1199-#1202)

Implemented line:

- optional real Twitch user ID can be retained internally when present;
- login is not treated as stable identity;
- City exposes stable-ID coverage state (`unavailable`, `partial`, `available`) rather than inventing IDs;
- stable-ID state matrix and City UI states have dedicated verification;
- Country public response does not expose internal stable Twitch IDs merely because City uses them.

### B4. City renderer/isolation — DONE (#1204-#1217)

Current City rendering:

- suppresses Country aggregate markers;
- hides selected-Country and Country aggregate result UI;
- groups only streams carrying accepted City-level Base evidence;
- retains country-only evidence in accounting without promotion;
- publishes no creator City coordinates;
- does not use Country centroids as City/creator points;
- forces Current-location placement count to zero in Base City mode;
- has structural production smoke that accepts City rows or an explicit empty state.

### B5. Next City action — NORMATIVE CITY VISUALIZATION SPEC

Before adding a richer City map, specify and test the visualization model rather than copying Country choropleth behavior.

The City spec must decide:

1. accepted City evidence and provenance display;
2. City conflict/country-only/empty states;
3. stable-ID availability presentation;
4. whether City is primarily a grouped list, city-boundary aggregate, point target, cluster or a zoom-dependent combination;
5. what coordinates/boundaries are allowed and where they originate;
6. desktop hover/select behavior;
7. mobile tap/detail behavior;
8. URL/geography state;
9. population/evidence filter orthogonality;
10. accessibility and browser/production smoke contracts.

Until that spec exists, do not synthesize creator coordinates or infer City from Country to make the map look fuller.

## 5. Lane C — Kick Country

### C1. Source and identity foundation — DONE

Accepted provider path remains:

```text
Kick live population
-> unique Channels join
-> broadcaster_user_id
-> Kick-only reviewed evidence
-> deterministic Country terminal state
```

Slug/login is not stable identity. Twitch evidence is not reused.

### C2. Country response/evidence bridge — ADVANCED

The lane contains the earlier Kick-only live-state/snapshot/response work plus:

- #1197 reviewed Kick Country evidence bridge;
- #1203 reviewed Country batches 03-04 rebased onto current main.

These are evidence/data-path advances, not an authorization to expose a public Kick map automatically.

### C3. Next Kick action

Re-audit current Kick stable-ID persistence and response readiness from main, then continue only the missing steps toward a real Kick public Country API/Map.

Required before public activation:

- stable provider identity available for the live rows being joined;
- selected-population accounting reconciles;
- reviewed Kick Country evidence only;
- conflict/excluded/unmapped states remain explicit;
- no raw unsupported title/tag/profile body retention;
- no Twitch evidence reuse;
- provider-specific browser/API verification.

Do not copy the Twitch Country renderer until the real Kick Country response is sufficient to drive it.

## 6. Lane D — Current Location / IRL

### D1. Contract/evaluator — DONE

Current is temporary, explicitly time-bounded geography and is not Base City.

Accepted placement requires qualifying provenance plus:

```text
country
observedAt
expiresAt
```

Expiry returns to Unknown. Future claims do not place early. Conflicts fail closed. Current never mutates Home/Base automatically.

### D2. Candidate/reviewability line — ADVANCED

The earlier candidate coverage and reviewability work demonstrated that candidate presence is not acceptance. Raw title/tag/profile signals remain review candidates only unless a separate accepted evidence path validates the claim.

### D3. Stable-ID snapshot adapter — DONE (#1198)

The current snapshot path can retain/use a stable Twitch identity when the real snapshot supplies it. This removes a future identity blocker but does not itself create accepted Current geography or authorize a public layer.

### D4. Next Current action

Re-audit current retained/live accepted Current evidence. If no fresh accepted current/temporary evidence exists, keep public activation disabled and work on the evidence gate rather than rendering fake/derived points.

Only after useful fresh accepted evidence exists:

```text
accepted fresh Current evidence
-> Current API contract
-> public Current/IRL UI mode
-> expiry/conflict browser verification
-> production proof
```

Home/Base and Current must remain visibly separate.

## 7. Lane E — Shared Map UI and verification

Current Twitch Country already establishes the main shared UI lessons:

- geographic overview first;
- exact result lists remain available;
- selection and camera are separate states;
- dense controls must work on mobile;
- provenance/unmapped detail remains accessible without permanently consuming page height;
- map interaction cannot change evidence acceptance silently.

Shared work may extract provider-independent primitives only where semantics truly match. Do not create an abstraction that forces Country, City and Current into the same geometry model.

Next shared checks:

- keyboard access to selection/results;
- focus behavior after `Show streams` and clear/reset actions;
- mobile tap targets/control density;
- no hidden overflow regression;
- screen-reader labels for metric/legend/map state;
- explicit empty/conflict/unmapped states;
- provider/geography URL-state stability.

## 8. Documentation sync gate

The stale-document incident that led to v0.7 must not recur.

For every PR that changes normative Stream Map behavior, explicitly evaluate:

```text
spec impact
implementation-plan impact
roadmap impact
schedule impact
current execution/status impact
Country/City/Kick/Current boundary impact
collector/D1/cadence/retention impact
production impact
```

If behavior changes, update the current normative docs in the same PR or merge a prerequisite docs PR first. A stale file labelled `source of truth` is a defect, not harmless history.

Versioned superseded specs/plans remain in the repository for history but are not execution authority.

## 9. Maintenance sublane

The reviewed-evidence Top-20 maintenance harness remains a bounded maintenance process under its own contract.

It does not:

- serialize Stream Map development;
- impose a one-week wait on City/Kick/Current/UI work;
- authorize automatic recurring geography acceptance;
- authorize collector/schema/cadence/retention mutation.

## 10. Shared hard stops

- no language/timezone/name/category/IP geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-residence/current placement;
- no City inference from Country;
- no Current inference from Country/Home/Base;
- no Country centroid as creator City coordinate;
- no non-person-as-person placement;
- no silent geography conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography presented as real;
- no precise residential address/GPS publication;
- no inferred travel path;
- no collector/D1/schema/cadence/retention mutation without its own gate.

## 11. Immediate execution order

This is the current mainline sequence after the docs baseline:

```text
1. merge documentation source-of-truth reconciliation
2. Country closeout audit against v0.7
3. write/freeze the next City visualization/interaction specification
4. implement City only from that accepted specification
```

In parallel, without blocking steps 2-4:

```text
Kick: re-audit real current readiness and continue Kick-only Country path
Current/IRL: re-audit fresh accepted evidence and continue its separate gate
Maintenance: continue only under its own bounded policy
```

## 12. Definition of Map completion path

```text
Twitch Country remains usable, tested and evidence-safe
AND Twitch City has a formally specified useful renderer without inferred precision
AND Kick Country independently reaches a real provider-specific public surface
AND Current/IRL reaches a public layer only if fresh accepted evidence supports it
AND provider/geography/evidence controls remain explicit and non-aggregating
AND current spec/roadmap/schedule match main
```

Country coverage quality remains ongoing maintenance rather than a serial prerequisite for every later Map capability.
