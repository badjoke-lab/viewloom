# Phase 12A-4-9 Kick category capture canary execution and evidence package

Status: accepted and merge identity recorded; canonical gate advancement remains separate and production runtime capture remains unauthorized  
Tracking issue: #519  
Accepted canary package PR: #562  
Accepted execution package PR: #563  
execution package merge SHA: `9391fd1479d3c149303637ae65deae7abf0e9b7d`  
Execution contract: `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`

## Purpose

This accepted package defines how the disabled Kick canary package may later be started, monitored, stopped, rolled back, and frozen as evidence.

The actual squash merge identity is now recorded. No trigger exists, the canonical current-gate record is unchanged by this sync, and the production path remains dormant.

## Dormant boundary

```text
exact trigger file: absent
execution merge SHA in contract: recorded
canonical gate advancement: separate change
production start from pull request: impossible
workflow_dispatch production start: impossible
hourly monitor without trigger: no-op
normal Kick configuration: unchanged
Twitch configuration: unchanged
production category capture: disabled
```

## Accepted verification

```text
validated candidate head: e6b2e05811dfc70b262239603407254cc8d94246
execution package workflow: 29387873802
execution package job: 87264801162
Development policy: 29387873767
Web build: 29387873873
Web checks: 29387873755
start job: skipped
monitor/finalize job: skipped
trigger inspector job: skipped
normal Kick bundle: passed
disabled canary bundle: passed
post-deploy verification failure rollback: verified
already-rolled-back hourly no-op: verified
mismatched binding rollback: verified
```

## Lifecycle

```text
1. a later one-file trigger fixes exact package identities, attempt, startAt, and until
2. trigger push to main runs storage and identity preflight
3. start job generates a temporary active config and deploys the bounded Kick wrapper
4. hourly schedule checks storage, collector state, category evidence, and leakage
5. hard stop deploys the normal Kick config immediately
6. expiry deploys the normal Kick config and freezes final evidence
7. a separate read-only acceptance PR decides whether the Kick canary passed
```

No GitHub job sleeps for 24 hours. The wrapper enforces its own expiry, while the hourly monitor performs checkpoints and rollback.

If deployment succeeds but the active canary bindings cannot be verified, the runner immediately deploys the normal Kick configuration. If an hourly run finds that all canary bindings are already absent, it records a successful no-op instead of redeploying.

## Start gate

Before deployment:

```text
provider = Kick
package PR = #562
package merge SHA = 8dc53c6041f425f78e82cddb62328cff1128120f
execution package PR = #563
execution package merge SHA = 9391fd1479d3c149303637ae65deae7abf0e9b7d
trigger status = armed
oneTime = true
confirmation = RUN_KICK_CATEGORY_CAPTURE_CANARY
window = 23 to 25 hours
current remote D1 size captured
projected 90-day Kick size <= 330 MB
projected Kick headroom >= 100 MB
normal and canary D1 identities match
normal cadence remains 5 minutes
```

## Hourly monitor

During the active window the scheduled job records:

```text
remote D1 size and projection
Kick dictionary row count
provider leakage rows
Kick category payload row count
observed and missing category samples
collector status timestamps and state
active canary bindings
```

Before start the scheduled job is a no-op. After rollback, missing canary bindings also produce a no-op rather than a second deployment. Partial or mismatched canary bindings cause a hard stop and normal-config rollback.

## Hard stops

```text
projected 90-day Kick size > 330 MB
projected Kick headroom < 100 MB
provider leakage rows > 0
collector success replaced by category failure
category generator queries > 12
collector latency delta > 2000 ms
capture active after expiry
rollback leaves canary bindings
Twitch category capture begins
```

A hard stop deploys `workers/collector-kick/wrangler.toml`, preserves normal collection, and freezes failure evidence. Schema rollback and category data deletion are not required.

## Evidence boundary

Artifacts contain sanitized JSON only. They may record package identities, service and D1 identities, storage values, counts, states, timestamps, outcome, and rollback result. They must not contain API tokens, authorization headers, secret values, raw Worker URLs, or raw deployment logs.

## Accepted PR boundary

```text
no canonical gate advancement
no trigger
no production deploy
no remote D1 query
no flag change
no category rows
no cron cadence change
no backfill
no retention change
no category UI
no Twitch change
```

## Next boundary

This sync records only the accepted PR #563 merge identity. Advancing the canonical gate and authorizing creation of the exact one-file Kick category capture canary trigger requires a separate reviewed change. The later source run and finalizer artifacts must be accepted by a separate read-only PR, and Twitch remains blocked until accepted Kick canary evidence exists.
