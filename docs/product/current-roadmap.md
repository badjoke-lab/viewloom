# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-08-24

## Current milestone state

**Stream Map is the active product program. Twitch Country is already public; Country coverage expansion, City, Kick Country, and Current Location / IRL now proceed as parallel lanes.**

The previous source-of-truth wording incorrectly made the weekly Top-20 reviewed-evidence maintenance cadence look like the global Map schedule. That is no longer the roadmap model.

Current authoritative records:

```text
docs/product/stream-map-spec-v0.6.md
docs/product/stream-map-implementation-plan-v0.5.md
docs/product/current-schedule.md
```

## Current Stream Map state

### Twitch Country

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

## Roadmap rule: parallel lanes

The Map program is no longer represented as:

```text
weekly Top 20 review
-> wait one week
-> weekly Top 20 review
-> wait one week
-> later maybe City/Kick/IRL
```

The correct model is:

```text
Lane A  Country coverage expansion
Lane B  City
Lane C  Kick Country
Lane D  Current Location / IRL
```

Each lane has its own gate and authority boundary. Read-only audits/specification/fixtures can proceed in parallel even while production mutation/public exposure is still gated.

## Lane A — Twitch Country coverage expansion

The existing public Country Map remains live while coverage expands.

Next architecture:

```text
latest real Twitch Top 300
-> stable identity dedupe
-> remove known non-person rows
-> remove accepted evidence still fresh
-> eligible unmapped-person queue
-> bounded multi-batch review
-> validator
-> canonical evidence PR
-> production read verification
```

The stop condition is the accepted request/search/work budget, not a mandatory calendar wait.

The existing weekly Top-20 maintenance harness is retained, but only as a maintenance/re-review sublane. It is not the Country expansion scheduler unless separately redesigned.

## Lane B — City

City starts now in parallel at the semantics/audit layer.

Required claim distinction:

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

Base City placement is expected to rely on accepted `home_base` / `declared_location` evidence. Birthplace, nationality, historical residence, event venue and planned travel do not place a current base City.

First City work is a read-only audit of all accepted evidence that already retains city/region text. The audit measures usable city coverage and conflicts without exposing City publicly.

If the audit supports rollout, proceed to City API and country -> city drilldown. Exact residential address and precise coordinate publication are outside scope.

## Lane C — Kick Country

Kick Map no longer waits for all Twitch Country maintenance to finish.

Start with a provider-specific source audit of actual available paths/fields, including where applicable:

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

The audit records whether each field is already fetched/retained, its request cost/limits, evidence usefulness, persistence requirements and whether the path is supportable without brittle scraping.

Then:

```text
Kick evidence contract
-> Kick live join
-> /api/kick-stream-map
-> /kick/map/
```

Twitch evidence is not copied automatically to Kick and the providers are never geographically aggregated.

## Lane D — Current Location / IRL

Current Location remains separate from home/base.

Target record semantics:

```text
Home/Base      Los Angeles
Current        Tokyo
Observed at    <timestamp>
Expires at     <timestamp>
```

The first gate freezes source eligibility, observation timestamp requirements, TTL/expiry, stale handling, contradiction rules and the prohibition on converting temporary/current evidence into home/base.

Expired current-location evidence must stop placing the streamer in the current layer.

Only after this contract and an evidence audit may an IRL/current layer be exposed publicly.

## Existing maintenance sublane

The merged #1013/#1016/#1017 manual reviewed-evidence maintenance harness remains valid under its own frozen contract:

```text
Twitch only
fixed Top 20
manual workflow_dispatch
separate one-run authorization
at most once per week
<= 5 search/lookups per identity
120 minute review ceiling
zero /helix/users
zero D1 writes in acquisition
no automatic schedule
```

The first post-#1013 run under Issue #1015 is retained as invalid for evidence mutation because one identity recorded six search attempts. The run did not add its newly found evidence to canonical records. PR #1017 made the five-attempt rule fail closed.

That maintenance cadence applies only to that sublane. It does not pause Lane A gate/queue development, City work, Kick source audit, or Current Location/IRL contract work.

## Immediate roadmap work items

The next four issues are separate parallel execution anchors:

```text
A. Twitch Stream Map coverage-expansion gate + unique queue
B. Stream Map City evidence semantics + existing-evidence audit
C. Kick Stream Map source audit
D. Stream Map Current Location / IRL TTL contract
```

## Later Map stages

After the live lanes stabilize:

```text
City public rollout if evidence coverage supports it
Kick Country public rollout
Current/IRL public mode if evidence supports it
Geographic History / Replay
```

Country coverage remains an ongoing quality program and is not a serial blocker for all later Map capabilities.

## Completed Stream Map anchors

```text
PR #964 source/yield audit
PR #965 bounded live probe
PR #966 title/tag candidate extraction
PR #971 entity/claim rules
PR #972 real live join
PR #974 public route + source/type filters
PR #977 country drilldown
PR #979 reason-aware Unmapped
PR #980 population-filter decision
PR #981 population filters
PR #983 ready-response semantics repair
PR #986 reviewed evidence remediation
PR #990 first Top-20 reviewed evidence + country-only projection repair
PR #994 maintenance policy freeze
PR #996 second Top-20 reviewed evidence + replication audit
PR #1007 measured R3 review-cost result
PR #1009 R3 reviewed evidence implementation
PR #1013 manual maintenance harness
PR #1016 reservation/cadence guard correction
PR #1017 invalid-run closeout + search-budget fail-closed correction
```

Historical v0.5/v0.4 Stream Map documents and maintenance audit/closeout records remain retained for audit history. They no longer define the current product execution order.

## Shared hard invariants

- no geography from language/timezone/name/category/IP;
- no nationality/birthplace-as-home/current inference;
- no non-person channel placement as a person;
- no silent conflict resolution;
- no Twitch/Kick geographic aggregation;
- no demo geography presented as real;
- no unsupported persistent crawler solely to inflate coverage;
- no precise residential address publication;
- no home/origin evidence converted into current location;
- no expired current-location placement;
- no public City exposure before an accepted City gate;
- no collector cadence, D1 schema/binding, retention or permanent acquisition change without a separate accepted gate.
