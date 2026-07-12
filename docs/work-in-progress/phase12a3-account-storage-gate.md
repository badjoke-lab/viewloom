# Phase 12A-3 account storage gate

Status: active production evidence candidate
Branch: `work-analytics-12a3-d1-read-diagnostic`

## Purpose

Measure complete account-wide D1 storage and provider-specific projected storage headroom before any compact intraday rollup generation is authorized.

## Evidence source

```text
wrangler d1 info vl_twitch_hot --json
wrangler d1 info vl_kick_hot --json
wrangler d1 list --json
```

Raw control-plane responses are deleted before artifact upload. The permanent evidence must not contain database names, database IDs, unrelated database names, Account ID, or secret values.

## Limits and operational ceilings

Cloudflare Workers Free D1 limits:

```text
maximum per database: 500 MB
maximum account storage: 5 GB / 5120 MB
```

ViewLoom operational ceilings:

```text
per database: 450 MB
account aggregate: 4608 MB
```

## Gate

```text
Twitch current size + 70.99 MB safe projection <= 450 MB
Kick current size + 23.57 MB safe projection <= 450 MB
account current size + 94.56 MB safe projection <= 4608 MB
complete size coverage for every listed D1 database
```

All conditions must pass for `generationStorageGatePass=true`.

## Boundaries

```text
D1 execute no
writes no
migration no
backfill no
generation no
retention change no
cross-provider analytics no
```

Passing this storage gate does not authorize generation. The next gate is production execution-cost measurement.
