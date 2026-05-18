# Kick production data runbook

Kick production data lives in the dedicated D1 database `vl_kick_hot`, bound to Pages Functions and `collector-kick` as `DB_KICK_HOT`.

## Inspect current source modes

Run against `vl_kick_hot` before reading a production page as live data:

```sql
SELECT source_mode, COUNT(*) AS rows
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY source_mode;
```

Interpretation:

- `fixture`: storage-path validation only. Do not treat as production data.
- `public-channel-fallback`: sampled from configured `KICK_CHANNEL_SLUGS` through the public channel fallback.
- `empty-public-channel-fallback`: the fallback ran, but configured channels produced no live stream rows.
- `authenticated`: collected through the Kick OAuth app-token path.
- `empty-authenticated`: authenticated collection ran, but no configured channels produced live rows.

## Remove fixture rows

After confirming the Pages binding and UI path, remove fixture rows from production:

```sql
DELETE FROM minute_snapshots WHERE provider = 'kick' AND source_mode = 'fixture';
```

Then re-run the source-mode inspection query above. Production should not be described as live or authenticated if only `fixture` rows are present.

## Verify latest snapshot

```sql
SELECT provider, bucket_minute, collected_at, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 10;
```

## UI/API checks

- `/api/kick-status` and `/kick/status/` must show `DB_KICK_HOT / vl_kick_hot`, latest `source_mode`, `bucket_minute`, `collected_at`, `stream_count`, and `total_viewers`.
- `/api/kick-heatmap`, `/api/kick-day-flow`, `/api/kick-battle-lines`, and `/api/kick-history` must read Kick rows from `DB_KICK_HOT` only.
- If the latest rows are `fixture`, UI copy must remain explicit that fixture data is not live production data.
- If the latest rows are `public-channel-fallback`, UI copy must not call it official authenticated collection.
