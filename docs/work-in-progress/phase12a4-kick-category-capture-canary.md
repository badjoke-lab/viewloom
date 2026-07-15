# Phase 12A-4-8 Kick category capture canary package

Status: accepted dormant package; exact one-file trigger is the current gate and production runtime capture remains unauthorized  
Tracking issue: #519  
Accepted sequencing decision PR: #561  
Accepted package PR: #562  
Accepted execution package PR: #563  
Execution merge identity record PR: #564  
Package contract: `docs/audits/12a4-kick-category-capture-canary-package-contract.json`

## Purpose

This accepted package prepares a provider-separated Kick-only category capture canary without changing the normal production collector configuration.

The accepted rollout order is:

```text
Kick first
Twitch second only after accepted Kick canary evidence
```

## Committed state

```text
normal Kick collector: unchanged
normal Kick cron: unchanged
CATEGORY_CAPTURE_ENABLED in normal config: absent
canary config: disabled
canary start: absent
canary end: absent
exact trigger file: absent
production deployment from package or execution PR: forbidden
production category capture from package or execution PR: forbidden
Twitch changes: forbidden
```

## Canary control

The canary entry wraps the existing Kick collector and injects the internal category flag only while every condition below is true:

```text
CATEGORY_CAPTURE_CANARY_ENABLED = true
CATEGORY_CAPTURE_CANARY_PROVIDER = kick
CATEGORY_CAPTURE_CANARY_ATTEMPT is a positive integer
start and end are valid ISO-8601 timestamps
window is between 23 and 25 hours
current time is at or after start
current time is before end
```

Missing, invalid, pending, or expired configuration forces category capture off. Expiry therefore stops capture even before the normal collector config is redeployed.

## Dictionary SQL repair

The runtime dictionary writer previously used the CTE form that failed during bounded production probe attempt 2. The accepted package replaces it with a direct `INSERT ... SELECT ... FROM json_each(...)` statement while preserving first-write and unchanged-name no-op behavior.

## Accepted package verification

```text
package workflow: 29386501622
migration compatibility: 29386501577
collector checks: 29386501628
Development policy: 29386501646
Web build: 29386501678
Web checks: 29386501671
production Twitch deploy: skipped
production Kick deploy: skipped
remote schema verification: skipped
```

## Execution preflight

The exact trigger may execute only after it verifies:

```text
exact Kick worker and D1 identities
accepted package PR #562 and merge SHA
accepted execution package PR #563 and merge SHA
current remote D1 size
90-day projected Kick size <= 330 MB
projected Kick headroom >= 100 MB
Kick category schema complete
official livestream source available
normal collector cadence unchanged
```

## Observation boundary

```text
provider: Kick only
minimum duration: 24 hours
collection cadence: unchanged at 5 minutes
new cron: no
backfill: no
raw retention change: no
category UI: no
Twitch automatic start: no
permanent enablement after canary: no
```

Required evidence includes collector outcomes, category coverage, dictionary costs, rollup query count, D1 and Worker costs, storage before and after, leakage, expiry, and rollback.

## Hard stops

The canary must stop and freeze failure evidence if any of the following occurs:

```text
category generator queries > 12
collector latency delta > 2000 ms
provider leakage rows > 0
collector success is replaced by category failure
projected 90-day Kick size > 330 MB
projected Kick headroom < 100 MB
capture remains active after expiry
capture remains active after rollback
Twitch category capture begins
```

## Rollback

Rollback deploys the normal `workers/collector-kick/wrangler.toml` configuration. Schema rollback and deletion of already observed category data are not required. Normal non-category collection must continue.

## Accepted handoff

PR #562 handed off to the dormant execution package accepted in PR #563. PR #564 recorded the exact execution merge identity. The canonical gate is now 12A-4-10: a separate one-file Kick canary trigger. This historical package cannot start the canary by itself, runtime category capture remains unauthorized, and Twitch remains blocked until accepted Kick evidence exists.
