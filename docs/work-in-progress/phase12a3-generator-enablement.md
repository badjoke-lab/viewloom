# Phase 12A-3 bounded generator enablement

Status: production acceptance passed; merge and post-merge deployment verification pending  
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

## Accepted production evidence

```text
PR: #510
accepted workflow run: 29190852420
permanent evidence: docs/audits/12a3-generator-enablement-evidence.json
contract status: accepted
Twitch rollup rows: 600/day for both observed days
Kick rollup rows: 200/day for both observed days
second pass unchanged: true for both providers
maximum generator queries/pass: 12
temporary Workers retained: false
```

The accepted evidence used the same shared generator as production, forced the current UTC day to the existing 00:20 maintenance window, and refreshed only today and yesterday UTC.

## Lifecycle and privacy

```text
deploy temporary provider Worker
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

## Remaining boundary

PR #510 may merge after latest-head CI passes. The merge must be followed by:

```text
main collector deployment success for Twitch and Kick
post-merge production accumulation verification
provider-separated status and row checks
confirmation that query/storage budgets remain bounded
```

12A-3 is not closed until those post-merge checks are recorded and canonical project state is advanced.
