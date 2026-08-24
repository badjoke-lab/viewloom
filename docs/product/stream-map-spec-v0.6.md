# ViewLoom Stream Map Specification v0.6

Status: current authoritative specification  
Platform scope: Twitch and Kick remain provider-separated  
Supersedes: `docs/product/stream-map-spec-v0.5.md`  
Implementation baseline: main `6608ebfebf41454cdf6103de259e63d5c5665e0b` plus documentation-only no-op history at handoff  
Last updated: 2026-08-24

## 1. Product role

Stream Map is ViewLoom's evidence-backed geographic observation view.

- Heatmap = current audience field
- Day Flow = within-day movement
- Battle Lines = rivalry/comparison
- History = retained trends
- Stream Map = evidence-backed geographic context

Unknown, conflicting, candidate-only, stale and rejected geography remains unmapped.

## 2. Current implementation state

### Twitch Country Map

```text
public map                 DONE
source/type filters        DONE
country drilldown          DONE
unmapped reasons           DONE
population filters         DONE
reviewed evidence          LIVE
coverage expansion         ACTIVE
```

### City

```text
evidence semantics         NEXT / PARALLEL
existing-evidence audit    NEXT / PARALLEL
API                        NOT YET
UI                         NOT YET
```

### Kick

```text
source audit               NEXT / PARALLEL
evidence path              NOT YET
Country API                NOT YET
Country Map                NOT YET
```

### Current Location / IRL

```text
freshness/TTL contract     NEXT / PARALLEL
evidence audit             NOT YET
public mode                NOT YET
```

## 3. Program scheduling rule

Country coverage, City, Kick and Current Location / IRL are parallel product lanes.

The existing weekly Top-20 reviewed-evidence maintenance harness is a bounded safety/maintenance mechanism for its own workflow. It is **not** the global Stream Map development schedule. It must not block City design/audit, Kick source audit, Current Location/IRL contract work, or a separately accepted Country coverage-expansion gate.

No lane silently inherits another lane's production authority. Specification, read-only audit, fixtures and verification may proceed while production mutation/public exposure remains separately gated.

## 4. Provider separation

Twitch and Kick remain separate at every public geography layer.

- no Twitch/Kick geographic aggregation;
- no copying Twitch evidence into Kick records from name similarity;
- cross-provider identity reuse requires a separate identity-link contract;
- `/twitch/map/` and `/kick/map/` are independent surfaces;
- provider-specific coverage, limitations and provenance remain visible.

## 5. Evidence vocabulary

Evidence sources remain distinct:

```text
account_profile
stream_title
stream_tag
channel_profile
official_external
manual_review
```

Location claim kinds:

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

Only claims meeting the active layer's acceptance contract may place a stream.

## 6. Country placement

Country placement remains accepted-evidence-only.

Base-placement claims:

- `home_base`
- `declared_location`

A separately valid `current_location` may place only in the current-location layer once that contract is activated.

Never place from language, timezone, name cues, category, IP guesses, nationality alone, birthplace alone, organization/team headquarters, event venue alone, planned/future travel, or tag-only geography without accepted supporting evidence.

Conflicting accepted countries remain unmapped unless explicit temporal supersession is reviewed.

## 7. Country coverage expansion

Country coverage expansion must not be driven by a calendar wait alone.

Target pipeline:

```text
latest real Twitch Top 300
-> stable identity dedupe
-> remove already-classified non-person rows
-> remove accepted evidence still fresh under lifecycle rules
-> identify eligible unmapped persons
-> build unique review queue
-> bounded batch A
-> bounded batch B
-> bounded batch C ...
```

The expansion gate is bounded by actual work/cost, not a mandatory one-week idle interval.

A separate accepted gate must define:

- max identities per batch;
- max searches/lookups per identity;
- max searches/lookups per execution/session;
- wall-clock ceiling;
- accepted/rejected/conflict terminal outcomes;
- durable audit record;
- validator before canonical evidence changes;
- API request ceiling;
- explicit production-mutation authority.

The existing weekly Top-20 harness remains valid as maintenance under its own frozen contract, but is not the coverage-expansion scheduler unless explicitly redesigned.

## 8. City semantics

City is city-level grouping, not precise geolocation. Public City output must never expose residential addresses or exact coordinates.

Potential base City claims:

- `home_base`
- `declared_location`

Potentially usable only in Current Location:

- fresh `current_location`
- reviewed `temporary_location` when it explicitly establishes present location

Context-only for base City placement:

- `birthplace`
- `nationality`
- `historical_residence` unless explicitly current
- `event_venue` without proof the person is currently there
- planned/future travel

Examples:

```text
born in Osaka                  -> no City placement
Japanese streamer              -> no City placement
playing at an event in Paris   -> no home/base City placement
moving to Tokyo next month     -> no City placement
lives in Tokyo                 -> potential City base placement
currently streaming from Seoul -> potential Current Location candidate
```

Public unit is a city grouping such as Tokyo, Los Angeles, Moscow or Berlin.

## 9. City evidence audit gate

Before City API/UI, audit all currently accepted evidence retaining region/city text.

Required output:

- accepted evidence rows with city text;
- claim kind and source class;
- observation/review timestamp;
- country/city conflict state;
- base-placement eligible city count;
- current-only/temporary city count;
- context-only city count;
- mapped-stream/viewer coverage under City-capable semantics;
- privacy proof that no address/exact-coordinate publication occurs.

The audit does not itself activate public City fields.

## 10. City API/UI target

After City gate acceptance:

```text
country -> city drilldown
city grouping
city mapped/unmapped accounting
city-specific unmapped reasons
source/type provenance preserved
```

## 11. Kick source audit

Kick Stream Map starts now as a separate parallel source-audit lane.

Audit actually available/supportable fields/paths, including where applicable:

```text
live stream response
channel/profile response
title
tags
category
profile description
external links
other official provider-supported fields
```

Record availability, endpoint/path, request cost/limits, current retention/discard behavior, evidence usefulness, required persistence changes, and whether use is supportable without brittle scraping.

Twitch acceptance never automatically authorizes Kick evidence or Kick public placement.

## 12. Kick Country target

After source audit and evidence-contract acceptance:

```text
Kick live population
-> Kick entity eligibility
-> Kick reviewed evidence
-> Kick Country placement
-> /api/kick-stream-map
-> /kick/map/
```

Twitch and Kick coverage remain independent.

## 13. Current Location / IRL contract

Current Location is separate from home/base.

```text
Home/Base      Los Angeles
Current        Tokyo
Observed at    <timestamp>
Expires at     <timestamp>
```

Required semantics:

- claim kind;
- observed-at time;
- source/provenance;
- TTL/expiry;
- conflict handling;
- stale/expired state;
- no automatic conversion into home/base.

An expired current-location claim stops placing the streamer in the current layer.

## 14. IRL public mode target

IRL/current mode is a temporary layer, not a synonym for City Map. It may show only streams with currently valid current-location evidence and must distinguish home/base, current, stale/expired temporary/current, and unknown.

No inferred travel path, GPS path or residential address is part of this specification.

## 15. History / Replay

After live geography semantics stabilize, retained geographic state changes may support replay/history while preserving provenance and expiry semantics.

## 16. Existing public population/filter contract

Current Twitch public pipeline remains:

```text
latest real Twitch Top 300
-> overall Top N
-> minimum viewers
-> category
-> entity/evidence placement gate
-> evidence source/type filters
-> country drilldown
```

Current controls:

```text
Top N        20 / 50 / 100 / 300
Min viewers  any / 100 / 500 / 1,000 / 5,000 / 10,000
Category     all or one observed Twitch category
Language     deferred
```

Population filters are complete and are no longer the next product gate.

## 17. Current public Country boundary

Until a City public gate is accepted, Twitch public responses remain country-only:

```text
public location.regions = []
public location.cities  = []
public evidence.region  = null
public evidence.city    = null
```

Retained city/region evidence may be audited internally without public exposure.

## 18. Hard invariants

- no language/category-to-geography inference;
- no candidate-only placement;
- no nationality/birthplace-as-current/base inference;
- no non-person-as-person placement;
- no silent accepted-country/city conflict resolution;
- no Twitch/Kick geographic aggregation;
- no demo geography presented as real;
- no unsupported persistent crawler merely to inflate coverage;
- no precise residential address publication;
- no current-location claim from home/origin evidence;
- no current-location placement after TTL expiry;
- no public City activation without a City gate;
- collector cadence, retention, D1 schema/binding and permanent acquisition changes remain separately gated.

## 19. Next execution lanes

```text
Lane A  Twitch Country coverage expansion gate + unique unmapped-person queue
Lane B  City evidence semantics + existing-evidence city audit
Lane C  Kick source audit + provider-specific evidence contract
Lane D  Current Location / IRL freshness + TTL contract
```

Public API/UI changes occur only after the corresponding lane's evidence and verification gate is accepted.
