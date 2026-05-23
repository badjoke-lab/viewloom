# Kick official livestreams primary status

## Current status

Kick collection now uses the official livestream listing as the primary collection path.

The candidate registry remains only as fallback.

## Verified result

Manual production verification after deploy reached:

```text
ok: true
target_source: official-livestreams
coverage_mode: official-livestreams
stream_count: 100
total_viewers: 173813
reason: official_livestreams_success
```

Feature API verification reached:

```text
kick-heatmap items: 100
kick-day-flow buckets: 116
kick-day-flow bands: 21
kick-battle-lines lines: 5
kick-history topStreamers: 30
```

## Source mode note

`source_mode` may still show `authenticated` for database compatibility.

Use these fields for product and coverage interpretation:

```text
target_source = official-livestreams
coverage_mode = official-livestreams
```

## Candidate registry status

The candidate registry and live probe are no longer the primary collection path.

They remain fallback / QA support only.

## Scheduled polling

The collector is configured to run every 5 minutes via Wrangler cron:

```toml
[triggers]
crons = ["*/5 * * * *"]
```
