# ViewLoom Kick SQL Check Results

Status: pending  
Scope: D1 checks for Kick real-data readiness  
Created: 2026-05-17

## 1. Purpose

Record the actual terminal results from `docs/kick-sql-check-runbook.md`.

This file decides the next branch:

- If Kick rows exist and payload shape matches, connect Kick APIs to real D1 rows.
- If Kick rows do not exist, keep `not_ready` stubs and work on the collector path.
- If Kick rows exist but are stale or malformed, add a normalizer or collector fix first.

## 2. Environment used

Fill after running checks:

```text
repo path:
DB_NAME:
wrangler account/env:
run date:
```

## 3. Table list result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT name
FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 4. Provider distribution result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT provider, COUNT(*) AS rows
FROM minute_snapshots
GROUP BY provider
ORDER BY rows DESC;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 5. Kick freshness result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  COUNT(*) AS rows,
  MIN(bucket_minute) AS first_bucket,
  MAX(bucket_minute) AS last_bucket,
  MAX(collected_at) AS last_collected
FROM minute_snapshots
WHERE provider = 'kick';
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 6. Recent Kick rows sample

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  bucket_minute,
  collected_at,
  total_viewers,
  source_mode,
  substr(payload_json, 1, 500) AS payload_head
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 5;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 7. Kick payload item count result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  bucket_minute,
  json_array_length(json_extract(payload_json, '$.items')) AS item_count,
  total_viewers,
  source_mode
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 20;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 8. Kick item shape result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  bucket_minute,
  json_extract(payload_json, '$.items[0]') AS first_item
FROM minute_snapshots
WHERE provider = 'kick'
  AND json_array_length(json_extract(payload_json, '$.items')) > 0
ORDER BY bucket_minute DESC
LIMIT 5;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 9. Source mode result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT source_mode, COUNT(*) AS rows
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY source_mode
ORDER BY rows DESC;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 10. Day Flow bucket density result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  substr(bucket_minute, 1, 10) AS day,
  COUNT(*) AS rows,
  COUNT(DISTINCT substr(bucket_minute, 12, 5)) AS buckets,
  SUM(total_viewers) AS summed_viewers
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY day
ORDER BY day DESC
LIMIT 7;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 11. Battle Lines viability result

Command:

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT
  bucket_minute,
  json_array_length(json_extract(payload_json, '$.items')) AS item_count,
  total_viewers
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 60;
"
```

Result:

```text
PENDING
```

Decision:

```text
PENDING
```

## 12. Final outcome

Choose one after results are pasted:

```text
A: No Kick rows. Keep not_ready stubs and work on collector path.
B: Kick rows exist but stale. Connect only with stale state, or fix collector first.
C: Kick rows exist and payload shape matches. Connect Kick APIs to provider rows.
D: Kick rows exist but payload shape differs. Add Kick normalizer first.
```

Selected outcome:

```text
PENDING
```

## 13. Next PR after results

```text
PENDING
```
