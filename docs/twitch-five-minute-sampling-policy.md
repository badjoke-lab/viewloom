# Twitch five-minute sampling policy

## Decision

Twitch snapshots are bucketed to 5-minute intervals to match Kick's current production collection interval.

This is the current default for the Pages ingest endpoint:

```text
TWITCH_BUCKET_MINUTES default = 5
```

## Why

- Align Twitch and Kick chart granularity.
- Reduce D1 snapshot row growth.
- Reduce downstream query volume for Day Flow, Battle Lines, and History.
- Keep MVP operation cheaper and simpler while Kick remains 5-minute based.

## Important distinction

This change buckets persisted Twitch snapshots to 5-minute buckets at the ingest endpoint.

If an external collector still POSTs every minute, this change reduces unique `minute_snapshots` rows but does not fully reduce:

- external Twitch API calls
- Pages Function invocations
- `collector_runs` entries

To fully reduce Cloudflare and upstream usage, the external collector schedule should also be changed to every 5 minutes.

## Current verification status

After PR #203, `/api/twitch-heatmap` returns the richer Heatmap payload shape:

```text
items: 286
targetSource: twitch-helix-streams
coverageMode: partial-top-pages
activityAvailable: false
activityUnavailableReason: chat_sampling_not_connected
latest exists: true
collectorStatus exists: true
```

However the same check returned:

```text
state: stale
bucket_minute: 2026-05-23T12:41:00.000Z
```

This means the API shape is correct, but the latest Twitch snapshot was stale at verification time. The next operational check is not a payload-shape change; it is a collector freshness / schedule check.

## Freshness checks

Use the API first:

```bash
curl -sS "https://viewloom.pages.dev/api/twitch-heatmap?nocache=$(date +%s)" -o /tmp/twitch-heatmap.json
python3 - <<'PY'
import json
from pathlib import Path

d = json.loads(Path('/tmp/twitch-heatmap.json').read_text())
print('state:', d.get('state'))
print('items:', len(d.get('items') or []))
print('coverageMode:', d.get('coverageMode'))
print('notes:', d.get('notes'))
print('latest_bucket_minute:', (d.get('latest') or {}).get('bucket_minute'))
print('latest_collected_at:', (d.get('latest') or {}).get('collected_at'))
print('collector_last_success_at:', (d.get('collectorStatus') or {}).get('last_success_at'))
PY
```

Then check D1 directly if needed:

```sql
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'twitch'
ORDER BY bucket_minute DESC
LIMIT 20;
```

Expected 5-minute bucket minutes should end in `:00`, `:05`, `:10`, `:15`, etc. If rows stop advancing, the external Twitch collector is delayed or stopped.

## External collector action

If the external collector is still running every minute, change its schedule to every 5 minutes to fully reduce usage.

If the external collector is not running, restart or re-enable it before treating Twitch pages as fresh.

This repository currently controls the ingest endpoint bucket behavior. It may not control the external collector schedule itself.

## Rollback

To restore 1-minute bucket storage, set the Pages/Workers environment variable:

```text
TWITCH_BUCKET_MINUTES=1
```

If the external collector schedule was also changed to 5 minutes, restore that external schedule to 1 minute separately.

## Follow-up checks

After deploy, confirm new rows use 5-minute bucket timestamps:

```sql
SELECT bucket_minute, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'twitch'
ORDER BY bucket_minute DESC
LIMIT 20;
```

Expected bucket minutes should end in `:00`, `:05`, `:10`, `:15`, etc.

## Related issues

This does not solve:

- Twitch `has_more=1` top coverage limit.
- Heatmap activity/comment unavailability.
- Kick Heatmap top-100 coverage limit.
- Real chat/activity sampling.