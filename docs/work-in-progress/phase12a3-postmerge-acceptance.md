# Phase 12A-3 post-merge accumulation acceptance

Status: awaiting the first natural production maintenance refresh after PR #510 merge  
Branch: `work-analytics-12a3-postmerge-acceptance`

## Purpose

Prove that the enabled Twitch and Kick production collectors were deployed from main and that their existing scheduled handlers, not a temporary generator or manual collection route, refreshed provider-separated intraday rows during the 12:20–12:24 UTC maintenance window.

## Fixed boundary

```text
merge PR: #510
merge SHA: ad90585d74149b0fb1805b9a76fd8d796a5e7c2d
minimum accepted refresh: 2026-07-12T12:20:00.000Z
new cron: no
manual /collect: no
temporary generator: no
backfill: no
```

## Required deployment evidence

The `Deploy Collector Workers` push run for the exact merge SHA must complete successfully with:

```text
verify
deploy-twitch
deploy-kick
verify-remote-schema
```

## Required D1 evidence

For Twitch and Kick separately, today and yesterday must show:

```text
status refreshed_at >= minimum accepted refresh
all rollup updated_at values >= minimum accepted refresh
rollup rows = retained_streamers
row count <= provider cap
ranks are contiguous from 1 through row count
viewer-minute, sample, and hourly aggregates are positive
contract_version = analytics-source-v1
no provider leakage inside the provider-specific D1 database
```

## Verification method

Temporary token-protected read-only Workers query the two production D1 bindings separately. They do not call the generator, do not mutate source or rollup rows, have no cron, return no streamer identities, and are deleted after verification.

A passing workflow freezes aggregate-only permanent evidence and an operations acceptance record on this branch. 12A-3 closeout remains a separate canonical-state change.
