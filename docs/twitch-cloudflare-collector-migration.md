# Twitch Cloudflare collector migration

## Decision

ViewLoom will unify Twitch and Kick collection on Cloudflare Workers.

Current mixed state:

- Kick uses `workers/collector-kick` with Cloudflare Worker cron.
- Twitch uses GitHub Actions calling a Pages Function.
- This caused provider drift: Kick is 5-minute Cloudflare collection, while Twitch remained GitHub Actions based and stale/sparse.

## Target state

| Provider | Collector | Runtime | Schedule | Database |
|---|---|---|---:|---|
| Kick | `workers/collector-kick` | Cloudflare Worker | 5 minutes | `vl_kick_hot` |
| Twitch | `workers/collector-twitch` | Cloudflare Worker | 5 minutes | `vl_twitch_hot` |

## Migration order

1. Fix shared Twitch bucket storage to persist 5-minute bucket timestamps.
2. Add `workers/collector-twitch`.
3. Deploy Twitch Worker with DB binding and secrets.
4. Run manual `/collect` and verify `vl_twitch_hot` receives `:00/:05/:10/:15` bucket rows.
5. Enable Worker cron.
6. Disable GitHub Actions Twitch collector after Worker cron is confirmed.
7. Re-check Twitch Heatmap, Day Flow, Battle Lines, and History.

## Current root causes

- GitHub Actions Twitch collector is scheduled at `*/15`.
- Existing Twitch `floorToBucketMinute` only rounded seconds to zero, not to 5-minute boundaries.
- Latest production rows showed non-5-minute buckets such as `14:14`.
- `/api/twitch-heatmap` correctly reports warnings until fresh 5-minute rows are written.

## Acceptance criteria

Twitch Cloudflare migration is complete only when:

- Latest `vl_twitch_hot.minute_snapshots` rows are on 5-minute boundaries.
- `payload_json.bucketMinutes` is `5`.
- `/api/twitch-heatmap` returns `bucketAligned: true`.
- `ingestFreshnessWarning` no longer includes stale or bucket mismatch warnings.
- GitHub Actions Twitch collector is disabled or removed.
- Kick collector remains unchanged and healthy.
