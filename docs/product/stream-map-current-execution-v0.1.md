# ViewLoom Stream Map Current Execution Overlay v0.1

Status: current Stream Map execution override  
Applies to: Stream Map sections of `current-roadmap.md` and `current-schedule.md`  
Specification: `stream-map-spec-v0.6.md`  
Implementation plan: `stream-map-implementation-plan-v0.5.md`  
Last updated: 2026-08-24

## Why this overlay exists

The existing `current-roadmap.md` and `current-schedule.md` retain detailed historical maintenance records and verifier anchors. Those records must not be deleted or rewritten merely to change the current Stream Map execution order.

For Stream Map only, when the old files describe the weekly fixed-Top-20 reviewed-evidence maintenance cadence as the current/next global Map stage, this overlay supersedes that scheduling interpretation.

The weekly maintenance contract itself remains valid for that maintenance workflow.

## Current Map program

```text
Twitch Country Map
  public map                 DONE
  source/type filters        DONE
  country drilldown          DONE
  unmapped reasons           DONE
  population filters         DONE
  reviewed evidence          LIVE
  coverage expansion         ACTIVE

City
  evidence semantics         NEXT / PARALLEL
  existing-evidence audit    NEXT / PARALLEL
  API                        NOT YET
  UI                         NOT YET

Kick
  source audit               NEXT / PARALLEL
  evidence path              NOT YET
  Country API                NOT YET
  Country Map                NOT YET

Current Location / IRL
  freshness/TTL contract     NEXT / PARALLEL
  evidence audit             NOT YET
  public mode                NOT YET
```

## Execution rule

Map development proceeds in four parallel lanes:

```text
Lane A  Twitch Country coverage expansion
Lane B  City semantics + existing-evidence audit
Lane C  Kick source audit + provider-specific evidence path
Lane D  Current Location / IRL freshness + TTL contract
```

The existing weekly Top-20 maintenance harness is a maintenance/re-review sublane. Its one-week cadence does not pause specification, read-only audit, deterministic tooling, fixtures, verification, or separately accepted implementation work in the four Map lanes.

## Lane A

```text
latest real Twitch Top 300
-> stable identity dedupe
-> remove known non-person rows
-> remove fresh accepted evidence
-> unique eligible-unmapped-person queue
-> bounded multi-batch review
-> validator
-> canonical evidence PR if authorized
-> production read verification
```

A new coverage-expansion gate must stop on accepted request/search/work budgets rather than an automatic one-week idle interval.

Execution anchor: Issue #1028.

## Lane B

Freeze City claim semantics, then audit all accepted retained city/region evidence read-only before deciding on public City API/UI.

Base City placement candidates are accepted `home_base` and `declared_location`. `birthplace`, `nationality`, `event_venue`, planned travel, and non-current historical residence do not establish a current base City. `current_location` and qualifying temporary presence belong to Lane D.

No public address or precise residential coordinates.

Execution anchor: Issue #1029.

## Lane C

Audit the actual Kick collector/provider path first. Determine which official fields are already fetched, retained, discarded, or would require new acquisition/persistence. Twitch evidence is not copied automatically to Kick.

Execution anchor: Issue #1030.

## Lane D

Define `current_location` / temporary-location freshness, `observedAt`, TTL/expiry, conflict handling, stale behavior, and revalidation. Expired current-location evidence must stop placing a streamer in the current layer and must never become home/base automatically.

Execution anchor: Issue #1031.

## Historical maintenance records remain intact

The following existing maintenance rules remain true for the existing harness and are not deleted by this overlay:

- fixed Twitch Top 20 per maintenance run;
- manual `workflow_dispatch`;
- separate one-run authorization;
- at most once per week / rolling-30-day ceiling;
- search-attempt and wall-clock ceilings;
- no automatic schedule;
- no automatic evidence acceptance;
- no City/Kick/current-location public activation from a maintenance run.

They do not define the scheduling cadence of the entire Stream Map product program.

## Precedence

For Stream Map execution order:

1. `stream-map-spec-v0.6.md`
2. `stream-map-implementation-plan-v0.5.md`
3. this execution overlay
4. older Stream Map scheduling statements in `current-roadmap.md`, `current-schedule.md`, `stream-map-spec-v0.5.md`, and `stream-map-implementation-plan-v0.4.md`

Historical measurements, audit findings, run IDs, maintenance ceilings and prior acceptance records in those older files remain historical facts and are not rewritten by this precedence rule.
