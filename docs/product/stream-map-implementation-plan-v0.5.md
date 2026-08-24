# ViewLoom Stream Map Implementation Plan v0.5

Status: active execution plan  
Specification: `docs/product/stream-map-spec-v0.6.md`  
Supersedes: `docs/product/stream-map-implementation-plan-v0.4.md`  
Baseline at handoff: main `6608ebfebf41454cdf6103de259e63d5c5665e0b`  
Last updated: 2026-08-24

## 1. Current position

Completed Twitch Country surface:

1. source inventory/audit — #964
2. read-only live evidence probe — #965
3. title/tag candidate extraction — #966
4. entity/claim eligibility + retained evidence — #971
5. real latest-snapshot live join — #972
6. public MapLibre route + evidence source/type filters — #974
7. country selection/drilldown — #977
8. reason-aware Unmapped analysis — #979
9. population-filter decision — #980
10. population filters — #981
11. ready-response semantics repair — #983
12. reviewed evidence remediation/replication/cost gates — #986/#990/#996/#1007/#1009
13. bounded manual maintenance harness — #1013/#1016/#1017

The old plan's `Current gate: Population filters` is obsolete.

## 2. Execution model

Map development is four parallel lanes, not one serial queue.

```text
Lane A  Twitch Country coverage expansion
Lane B  City
Lane C  Kick Country
Lane D  Current Location / IRL
```

The weekly Top-20 maintenance harness is a maintenance sublane only. Its cadence does not pause B/C/D and does not define Lane A's future coverage-expansion cadence.

## 3. Lane A — Twitch Country coverage expansion

### A1. Coverage-expansion gate

Create a new gate separate from the weekly maintenance harness.

Define:

- population source: latest Top 300;
- stable identity dedupe;
- fresh accepted-evidence exclusion;
- non-person exclusion;
- unique eligible-unmapped-person queue;
- max identities per batch;
- max lookups per identity;
- max lookups per execution/session;
- wall-clock budget;
- provider API request ceiling;
- terminal outcomes;
- durable result format;
- validator before evidence mutation;
- explicit mutation/no-mutation boundary.

### A2. Queue builder

Target pipeline:

```text
latest Top 300
-> normalize stable Twitch identity
-> dedupe
-> classify known non-person
-> remove fresh accepted evidence
-> retain eligible unmapped persons
-> queue by deterministic priority
```

Queue output must make repeated review waste visible and prevent the same fresh identity from being researched every batch.

### A3. Multi-batch review

Process multiple bounded batches in one accepted expansion execution when the gate's actual search/work budget allows it.

Do not use `one week elapsed` as the reason to stop. Stop on the accepted batch/session ceilings.

### A4. Canonical evidence application

Only terminal, attributable, validator-passing evidence may become canonical. Conflicts remain unmapped. Invalid sessions remain audit-only.

### A5. Production coverage verification

After accepted evidence application, verify:

- selected population reconciliation;
- mapped/unmapped counts;
- mapped viewer coverage;
- exact reason totals;
- source/type filter behavior;
- country drilldown;
- no City leakage;
- no Current Location activation.

## 4. Lane B — City

### B1. City semantics contract

Freeze the distinction among:

```text
birthplace
nationality
historical_residence
home_base
declared_location
temporary_location
current_location
event_venue
```

Base City placement uses only accepted current base/declared-location semantics. Current/temporary claims belong to Lane D.

### B2. Existing-evidence city audit

Audit all accepted retained evidence for city/region values.

Measure:

- number of city-bearing accepted rows;
- unique persons/cities/countries;
- base-eligible vs current-only vs context-only;
- city conflicts;
- viewer coverage using a current live population join;
- privacy boundary.

This is read-only and does not expose City publicly.

### B3. City go/no-go decision

If coverage is useful and semantics reconcile, accept a City API gate. If not, keep City internal and improve evidence first.

### B4. City API

Add city grouping without precise coordinates/addresses in response. Preserve country and evidence provenance.

### B5. City UI

Add:

```text
country -> city drilldown
city grouping
city selection
city-specific mapped/unmapped reasons
```

Mobile and desktop must both preserve explicit unknown/conflict states.

## 5. Lane C — Kick Country

### C1. Kick source audit

Inspect actual existing Kick collector/provider paths and provider-supported fields.

For each source candidate record:

- exact endpoint/path;
- whether already fetched;
- whether retained or discarded;
- request cost/limit;
- evidence semantics;
- supportability;
- required persistence change, if any.

Audit at least live response, channel/profile response, title, tags, category, profile description, external links and any other official field actually available.

### C2. Kick evidence contract

Define provider-specific evidence sources and claim acceptance. Do not copy Twitch evidence automatically.

### C3. Kick live join/API

Build a Kick-only population/evidence join with independent mapped/unmapped accounting.

Target endpoint:

```text
/api/kick-stream-map
```

### C4. Kick Country Map

Target public page:

```text
/kick/map/
```

Reuse shared Map UI only where semantics are provider-independent. Keep provider limitations and provenance separate.

## 6. Lane D — Current Location / IRL

### D1. Freshness/TTL contract

Define:

- allowed current/temporary claims;
- observed-at requirements;
- default/max TTL policy by source/claim class;
- explicit expiry;
- contradiction handling;
- stale state;
- revalidation rule;
- no conversion to home/base.

### D2. Existing candidate audit

Audit any retained evidence that might qualify as current/temporary under the new contract. Do not reinterpret home/origin as current.

### D3. Current-location API layer

Add a separate current layer only after the contract is accepted. Expired rows must disappear from current placement.

### D4. IRL mode

Add a mode/layer showing only currently valid current-location streams. It is not the base City map and must not imply travel paths.

## 7. History / Replay after live lanes

After Country/City/current semantics are stable, retain geography state transitions and add replay/history without inventing movement between observations.

## 8. Maintenance sublane

Existing #1013/#1016/#1017 weekly Top-20 reviewed-evidence maintenance remains valid under its own frozen envelope.

It is used for bounded maintenance/re-review and remains:

```text
manual dispatch
separate one-run authorization
Top 20
weekly maximum
no automatic schedule
```

This sublane is not the main product schedule and does not block Lane A/B/C/D work.

## 9. Immediate branch/issue order

Start these work items in parallel:

```text
A. Country coverage-expansion gate + queue builder
B. City semantics + existing-evidence audit
C. Kick source audit
D. Current Location / IRL TTL contract
```

Recommended implementation order inside each lane:

```text
spec/contract
-> read-only audit or deterministic fixture
-> verification
-> implementation gate
-> API/data changes if needed
-> public UI
-> production read verification
```

## 10. Shared hard stops

- no geography inference from language/timezone/name/category/IP;
- no nationality/birthplace-as-residence;
- no non-person-as-person placement;
- no silent conflict resolution;
- no Twitch/Kick aggregation;
- no demo geography;
- no precise residential address publication;
- no unsupported crawler solely for coverage inflation;
- no City public leakage before City gate;
- no current location surviving TTL expiry;
- no collector/D1/cadence/retention mutation without its own accepted gate.

## 11. Definition of Map completion path

The Map program does not wait for perfect Country coverage before other lanes progress.

Completion path:

```text
Twitch Country usable + expanding
AND City semantics/audit resolved -> City public if viable
AND Kick Country independently live
AND Current/IRL contract + layer live if evidence supports it
THEN History/Replay
```

Country coverage remains an ongoing quality program rather than a serial blocker for every later Map capability.
