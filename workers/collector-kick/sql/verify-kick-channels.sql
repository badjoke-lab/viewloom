-- Verify kick_channels after operator-controlled migration/import.
--
-- Target database: vl_kick_hot
-- Binding context: DB_KICK_HOT
--
-- This file is read-only verification SQL.
-- It does not mutate production data.

SELECT 'table_exists' AS check_name, COUNT(*) AS value
FROM sqlite_master
WHERE type = 'table'
AND name = 'kick_channels';

SELECT 'total_rows' AS check_name, COUNT(*) AS value
FROM kick_channels;

SELECT source, status, COUNT(*) AS rows
FROM kick_channels
GROUP BY source, status
ORDER BY source, status;

SELECT slug, priority, status, source, last_live_at, last_checked_at, failure_count, success_count, updated_at
FROM kick_channels
ORDER BY priority DESC, slug ASC
LIMIT 25;

SELECT status, COUNT(*) AS rows
FROM kick_channels
GROUP BY status
ORDER BY status;

SELECT source, COUNT(*) AS rows
FROM kick_channels
GROUP BY source
ORDER BY source;

SELECT 'candidate_pool' AS check_name, COUNT(*) AS value
FROM kick_channels
WHERE status IN ('candidate', 'active', 'cooldown');

SELECT 'blocked_or_dead' AS check_name, COUNT(*) AS value
FROM kick_channels
WHERE status IN ('blocked', 'dead');
