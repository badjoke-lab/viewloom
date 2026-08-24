# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-08-24

## Current program

```text
Current program       Stream Map
Current execution     Parallel Map development
Reference spec        stream-map-spec-v0.6.md
Reference plan        stream-map-implementation-plan-v0.5.md
```

The global Map schedule is **not** the weekly Top-20 maintenance cadence.

The accepted weekly maintenance harness remains a bounded maintenance/re-review sublane only. It does not block other Stream Map work.

## Current execution lanes

```text
Lane A  Twitch Country coverage expansion    ACTIVE / NEXT
Lane B  City semantics + evidence audit       ACTIVE / NEXT IN PARALLEL
Lane C  Kick source audit                     ACTIVE / NEXT IN PARALLEL
Lane D  Current Location / IRL TTL contract   ACTIVE / NEXT IN PARALLEL
```

### Lane A — Twitch Country coverage expansion

Next sequence:

```text
A1 coverage-expansion gate
-> A2 unique eligible-unmapped-person queue
-> A3 bounded multi-batch review
-> A4 canonical evidence application through validator
-> A5 production read verification
```

The new coverage-expansion gate is separate from the existing weekly Top-20 maintenance harness. It must be bounded by actual request/search/work budgets and must not stop merely because a calendar week has not elapsed.

### Lane B — City

Next sequence:

```text
B1 city evidence semantics
-> B2 existing accepted-evidence city audit
-> B3 city go/no-go decision
-> B4 City API if accepted
-> B5 country -> city UI drilldown
```

City work may proceed as specification/read-only audit now. Public City fields remain off until the City public gate is accepted.

### Lane C — Kick Country

Next sequence:

```text
C1 actual Kick source/field audit
-> C2 provider-specific evidence contract
-> C3 Kick live population/evidence join
-> C4 /api/kick-stream-map
-> C5 /kick/map/
```

Twitch evidence is not copied automatically to Kick. Providers remain separate.

### Lane D — Current Location / IRL

Next sequence:

```text
D1 current/temporary claim semantics + TTL/expiry
-> D2 existing candidate audit
-> D3 separate current-location API layer
-> D4 IRL/current mode
```

Home/base and current location remain distinct. Expired current-location evidence must stop placing a stream in the current layer.

## Existing Twitch Country state

```text
public map                 DONE
source/type filters        DONE
country drilldown          DONE
unmapped reasons           DONE
population filters         DONE
reviewed evidence          LIVE
coverage expansion         ACTIVE
```

Population filters are complete and are no longer the current gate.

## Existing weekly maintenance sublane

The #1013/#1016/#1017 manual maintenance harness remains valid under its own frozen contract:

```text
provider                           Twitch only
population                         fixed overall Top 20
maintenance frequency              at most once per week
rolling 30-day maximum             4 reservations
execution                          manual workflow_dispatch only
app-token requests per run         <= 1
/helix/streams requests per run    <= 1
/helix/users requests              0
sample D1 writes                   0
sample production deploy           false
search rounds / identity           <= 5
review wall-clock ceiling          120 minutes
non-person refill                  none
geography preselection             none
```

This is **maintenance governance**, not the product development scheduler.

The first post-#1013 run under Issue #1015 remains retained as invalid for evidence mutation because one identity recorded six search attempts. No newly found country evidence from that invalid run became canonical. PR #1017 added the fail-closed five-attempt rule.

The existing maintenance cadence still blocks another maintenance reservation before its own accepted boundary, but that does **not** block Lane A gate design/queue implementation, Lane B City audit, Lane C Kick source audit, or Lane D TTL contract work.

## Immediate work items

Create and execute separate issues for:

```text
1. Twitch Stream Map coverage-expansion gate + queue builder
2. Stream Map City evidence semantics + existing-evidence audit
3. Kick Stream Map source audit
4. Stream Map Current Location / IRL TTL contract
```

Each issue must keep production mutation/public rollout authority explicit rather than inheriting it from another lane.

## Shared hard stops

- no geography from language/timezone/name/category/IP;
- no nationality/birthplace-as-home/current inference;
- no non-person-as-person placement;
- no silent accepted-country/city conflict resolution;
- no Twitch/Kick geographic aggregation;
- no demo fallback geography;
- no precise residential address publication;
- no current-location claim from home/origin evidence;
- no expired current-location placement;
- no public City fields before a City gate;
- no unsupported persistent crawler solely to inflate coverage;
- no collector cadence, retention, D1 schema/binding or permanent acquisition change without its own accepted gate.

## Authoritative Stream Map records

- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/product/stream-map-spec-v0.6.md`
- `docs/product/stream-map-implementation-plan-v0.5.md`
- `docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md`
- `docs/operations/twitch-stream-map-reviewed-evidence-maintenance-runbook-v0.1.md`
- historical `stream-map-spec-v0.5.md` and `stream-map-implementation-plan-v0.4.md` remain retained for audit history.

## Completed Stream Map anchors

```text
#964 source inventory/audit
#965 read-only live evidence probe
#966 title/tag candidate extraction
#971 entity/claim eligibility + retained evidence
#972 real latest-snapshot live join
#974 public MapLibre route + source/type filters
#977 country selection/drilldown
#979 reason-aware Unmapped
#980 population-filter decision
#981 population filters
#983 ready-response semantics repair
#986 reviewed evidence remediation
#990 first Top-20 reviewed evidence + country-only projection repair
#994 maintenance policy freeze
#996 second Top-20 reviewed evidence + replication audit
#1007 measured R3 review-cost result
#1009 R3 reviewed evidence implementation
#1013 manual maintenance harness
#1016 reservation/cadence guard correction
#1017 invalid-run closeout + search-budget fail-closed correction
```
