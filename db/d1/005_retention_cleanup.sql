-- Retention cleanup for ViewLoom Free Strong.
-- Apply only after daily_rollups has been created and backfilled.
-- Safe to rerun.

DELETE FROM minute_snapshots
WHERE provider = 'twitch'
  AND unixepoch(bucket_minute) < unixepoch('now', '-30 days');

DELETE FROM minute_snapshots
WHERE provider = 'kick'
  AND unixepoch(bucket_minute) < unixepoch('now', '-60 days');

DELETE FROM collector_runs
WHERE unixepoch(started_at) < unixepoch('now', '-14 days');

DELETE FROM daily_rollups
WHERE unixepoch(day || 'T00:00:00Z') < unixepoch('now', '-180 days');
