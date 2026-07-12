# Phase 12A-3 bounded generator enablement

Status: active production acceptance candidate
Branch: `work-analytics-12a3-enable-generator`

## Purpose

Enable the accepted provider-separated intraday generator only after the same shared runtime is executed twice against production D1 and the resulting provider-day rows and status records are verified.

## Collector configuration

```text
Twitch: INTRADAY_GENERATION_ENABLED = true
Kick: INTRADAY_GENERATION_ENABLED = true
existing cron: */5 * * * *
new cron: no
```

Pull-request workflows do not deploy the production collectors. Main push after merge performs the enabled collector deployment through the accepted deploy workflow.

## Temporary production acceptance

```text
Twitch temporary Worker: viewloom-generator-acceptance-twitch
Kick temporary Worker: viewloom-generator-acceptance-kick
shared runtime: workers/shared/intraday-rollup.ts
forced acceptance time: current UTC day 00:20
generator passes: 2
target days/pass: today and yesterday UTC
actual production rollup rows: yes
backfill: no
```

Each provider must prove:

```text
two observed days
source snapshots > 0
rollup rows = status retained_streamers
rollup rows <= provider cap
distinct ranks = rows
minimum rank = 1
maximum rank = rows
viewer-minute/sample/hourly payload aggregates > 0
second-pass observations exactly match first pass
maximum generator query budget <= 12
retention cleanup observed
provider separation preserved
```

## Lifecycle and privacy

```text
deploy temporary Worker
run two-pass acceptance
normalize aggregate-only evidence
delete temporary Worker service through Cloudflare API
retain no temporary Worker
```

Permanent evidence excludes streamer identities, database IDs, Account ID, secret values, raw responses, and deployment logs.

## Exclusions

```text
collector index/entry changes
shared generator changes
migration changes
web/API changes
new cron
backfill
raw-retention change
category capture
exact-session fields
cross-provider analytics
direct D1 execute
```

A passing acceptance permits merge of the two explicit Wrangler flags. Main deployment and subsequent accumulation remain subject to post-merge verification.
