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
- Twitch Heatmap API shape mismatch.
- Kick Heatmap missing momentum/color.
