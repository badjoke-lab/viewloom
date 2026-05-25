-- Retention audit for ViewLoom Free Strong.
-- Safe read-only query. Apply to each provider DB before cleanup.

SELECT
  provider,
  COUNT(*) AS total_rows,
  MIN(bucket_minute) AS oldest_bucket,
  MAX(bucket_minute) AS latest_bucket,
  SUM(CASE WHEN provider = 'twitch' AND unixepoch(bucket_minute) < unixepoch('now', '-30 days') THEN 1 ELSE 0 END) AS twitch_rows_older_than_30d,
  SUM(CASE WHEN provider = 'kick' AND unixepoch(bucket_minute) < unixepoch('now', '-60 days') THEN 1 ELSE 0 END) AS kick_rows_older_than_60d,
  ROUND(SUM(LENGTH(payload_json)) / 1024.0 / 1024.0, 2) AS payload_mb
FROM minute_snapshots
GROUP BY provider;

SELECT
  provider,
  COUNT(*) AS rollup_rows,
  MIN(day) AS oldest_rollup_day,
  MAX(day) AS latest_rollup_day,
  SUM(CASE WHEN unixepoch(day || 'T00:00:00Z') < unixepoch('now', '-180 days') THEN 1 ELSE 0 END) AS rollup_rows_older_than_180d
FROM daily_rollups
GROUP BY provider;
