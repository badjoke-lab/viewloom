# Phase 12A-2 remote D1 size gate

Status: active evidence collection
Branch: `work-analytics-12a2-remote-size-gate`

## Purpose

Collect point-in-time remote D1 database-size evidence before any compact intraday rollup migration is applied.

The accepted local SQLite budget is not sufficient for migration because the 12A-0 payload baseline is not the complete remote D1 database size.

## Evidence method

The dedicated workflow uses authenticated Wrangler control-plane commands:

```text
wrangler d1 info vl_twitch_hot --json
wrangler d1 info vl_kick_hot --json
wrangler d1 list --json
```

Raw responses are temporary. They are removed before artifact upload.

The permanent candidate artifact contains only:

```text
Twitch current size
Twitch projected size with safe rollup projection
Kick current size
Kick projected size with safe rollup projection
account database count
account aggregate current size
account projected size with safe rollup projection
gate results
```

Unrelated database names, Cloudflare API token, and account id must not be persisted.

## Operational ceilings

```text
per-database documented maximum: 500 MB
per-database operational ceiling: 450 MB
account documented maximum: 5120 MB
account operational ceiling: 4608 MB
```

The operational ceilings preserve 10% headroom beyond the projected compact-rollup addition.

## Migration rule

```text
Twitch projected size <= 450 MB
AND Kick projected size <= 450 MB
AND account projected size <= 4608 MB
```

Passing this storage gate alone still does not deploy migration or runtime generation.

## Missing credentials boundary

The workflow requires repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

If they are absent, the workflow must fail with `cloudflare_credentials_missing` without printing secret values. In that state the storage gate remains blocked.
