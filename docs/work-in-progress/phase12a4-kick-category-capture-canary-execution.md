# Phase 12A-4-9 Kick category capture canary execution and evidence package

Status: accepted dormant execution package; merge identity sync is required before any trigger and production runtime capture remains unauthorized  
Tracking issue: #519  
Accepted canary package PR: #562  
Accepted execution package PR: #563  
Execution contract: `docs/audits/12a4-kick-category-capture-canary-execution-contract.json`

## Purpose

This accepted package defines how the disabled Kick canary package may later be started, monitored, stopped, rolled back, and frozen as evidence.

It does not create the exact trigger and cannot start production category capture from this PR. The execution contract intentionally keeps its merge SHA unset until a follow-up canonical sync records the actual squash merge identity.

## Dormant boundary

```text
exact trigger file: absent
execution merge SHA in contract: pending
production start from pull request: impossible
workflow_dispatch production start: impossible
hourly monitor without trigger: no-op
normal Kick configuration: unchanged
Twitch configuration: unchanged
production category capture: disabled
```

## Accepted verification

```text
execution package workflow: 29387553274
execution package job: 87263862863
Development policy: 29387553217
Web build: 29387553228
Web checks: 29387553242
start job: skipped
monitor/finalize job: skipped
trigger inspector job: skipped
normal Kick bundle: passed
disabled canary bundle: passed
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

## Start gate

Before deployment:

```text
provider = Kick
package PR = #562
package merge SHA = 8dc53c6041f425f78e82cddb62328cff1128120f
execution package identity = exact accepted PR and merge SHA
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

Before start the scheduled job is a no-op. After rollback, missing canary bindings also produce a no-op rather than a second deployment.

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

## Current gate

Record the actual PR #563 squash merge SHA in the execution contract and advance the canonical gate. Only after that sync passes may the exact one-file Kick canary trigger be created. The later source run and finalizer artifacts must be accepted by a separate read-only PR.
