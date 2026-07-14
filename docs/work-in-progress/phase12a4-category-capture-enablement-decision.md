# Phase 12A-4-7 category capture enablement decision

Status: accepted; Kick-first canary package design is the current gate and production runtime capture remains unauthorized  
Tracking issue: #519  
Accepted cost evidence PR: #558  
Cost execution retirement PR: #559  
Accepted decision PR: #561  
Decision contract: `docs/audits/12a4-category-capture-enablement-decision-contract.json`

## Accepted decision

The accepted one-time production probe demonstrated that the bounded category path can execute within the accepted query and latency thresholds for both providers, remove all reserved rows, preserve provider separation, and delete all temporary Workers.

The accepted decision is not a blanket production enablement. It authorizes design work for a sequenced provider-specific canary only.

```text
Kick canary design: eligible first
Twitch canary design: eligible second
production runtime capture: not authorized
production flag change: not authorized
combined Twitch/Kick rollout: not authorized
automatic second-provider start: not authorized
permanent enablement after canary: not authorized
```

## Why Kick is first

Kick has the larger conservative provider storage margin.

```text
accepted 90-day projected size: 314.57 MB
accepted projected headroom: 135.43 MB
bounded probe collector latency delta: 9 ms
bounded probe database size delta: 0 bytes
cleanup remaining rows: 0
provider leakage rows: 0
```

The next Kick canary package must remain disabled by default and must not execute from its package PR.

## Why Twitch is second

Twitch passed the accepted storage gate, but the conservative projection leaves little provider-specific margin.

```text
accepted 90-day projected size: 438.7 MB
accepted projected headroom: 11.3 MB
accepted minimum headroom: 10 MB
bounded probe collector latency delta: 942 ms
bounded probe database size delta: 0 bytes
cleanup remaining rows: 0
provider leakage rows: 0
```

Twitch may not begin before Kick canary evidence is accepted and the 90-day projection is recalculated from the current remote D1 size.

## Required canary boundary

```text
one provider at a time
Kick before Twitch
minimum 24-hour observation per provider
no collector cadence change
no new cron
no backfill
no raw-retention change
no category analytics UI
no cross-provider category identity
no combined-provider category totals or rankings
no automatic permanent enablement
category failure cannot replace collector success
rollback disables capture without schema rollback
```

## Hard stops

```text
category generator queries > 12
collector latency delta > 2000 ms
provider leakage rows > 0
category failure changes collector success
cross-provider category rows appear
failed canary leaves capture enabled
storage projection falls outside the accepted provider or account threshold
```

Any hard stop means the canary must be disabled and accepted failure evidence must be frozen before further work.

## Accepted PR boundary

```text
no collector code change
no Wrangler configuration change
no production flag change
no production runtime capture
no production rows written
no remote D1 operation
no Worker deployment
no cron
no backfill
```

## Current gate

The current gate is 12A-4-8: a Kick-first disabled-by-default category capture canary package design. That package may define code, rollback, evidence, and trigger boundaries, but production execution still requires a separate exact trigger and acceptance PR.
