# ViewLoom Kick SQL Check Runbook

Status: active runbook  
Scope: confirm whether Kick rows exist before real-data API connection  
Created: 2026-05-17

## 1. Purpose

Before replacing the Kick `not_ready` API stubs with real-data readers, confirm whether D1 already contains Kick rows.

This runbook is intentionally terminal-first. Browser QA can stay deferred.

## 2. Expected D1 table

Current Twitch APIs read:

```sql
minute_snapshots
```

Expected shared fields:

```text
provider
bucket_minute
collected_at
total_viewers
payload_json
source_mode
```

Kick real-data connection is only safe if rows exist with:

```text
provider = 'kick'
```

## 3. Base command setup

From the repository root:

```bash
cd ~/viewloom || exit 1
set -euo pipefail
DB_NAME="${DB_NAME:-livefield}"
```

If the production D1 name is different, set it explicitly:

```bash
export DB_NAME="<your-d1-db-name>"
```

## 4. Confirm table exists

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT name
FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
"
```

Expected:

```text
minute_snapshots
```

## 5. Provider distribution

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT provider, COUNT(*) AS rows
FROM minute_snapshots
GROUP BY provider
ORDER BY rows DESC;
"
```

Decision:

```text
If kick rows > 0:
  proceed to freshness and payload checks.

If kick rows = 0 or provider absent:
  keep /api/kick-* stubs as not_ready and inspect collector path.
```

## 6. Kick freshness check

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

Decision:

```text
Recent last_bucket / last_collected:
  Kick rows may be usable.

Old last_bucket / last_collected:
  Kick rows exist but should be treated as stale until collector freshness is fixed.
```

## 7. Recent Kick rows sample

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

Check:

```text
- Does payload_json contain items?
- Do items include viewers?
- Do items have channelLogin/displayName or equivalent fields?
- Is source_mode real/demo/test?
```

## 8. Kick payload item count check

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

Decision:

```text
item_count > 0:
  payload likely usable for Heatmap and aggregation.

item_count is null or 0:
  payload shape does not match current Twitch aggregation path.
```

## 9. Kick item shape check

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

Expected usable fields:

```text
channelLogin or equivalent slug
viewer count field
name/displayName
url or buildable channel URL
title if available
```

## 10. Source mode check

```bash
wrangler d1 execute "$DB_NAME" --remote --command "
SELECT source_mode, COUNT(*) AS rows
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY source_mode
ORDER BY rows DESC;
"
```

Decision:

```text
source_mode real/api/live:
  can be considered for real-data connection.

source_mode demo/test/null:
  keep honest state and avoid presenting it as real Kick data.
```

## 11. Bucket density check for Day Flow

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

Decision:

```text
Enough buckets across a day:
  Day Flow can be connected.

Sparse buckets:
  Day Flow should stay partial/stale/empty even if Heatmap can work.
```

## 12. Battle Lines overlap viability check

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

Decision:

```text
If many recent buckets have multiple items:
  Battle Lines may be viable.

If only a few buckets/items exist:
  Battle Lines should remain not_ready/empty or partial.
```

## 13. Outcome mapping

### Outcome A: No Kick rows

Keep:

```text
/api/kick-heatmap       state = not_ready
/api/kick-day-flow      state = not_ready
/api/kick-battle-lines  state = not_ready
```

Next:

```text
Add or fix Kick collector.
```

### Outcome B: Kick rows exist but stale

Next:

```text
Connect APIs only if they honestly return stale.
Do not show real/live labels.
```

### Outcome C: Kick rows exist and payload shape matches

Next:

```text
Connect /api/kick-heatmap first.
Then connect /api/kick-day-flow.
Then connect /api/kick-battle-lines.
```

### Outcome D: Kick rows exist but payload shape differs

Next:

```text
Add Kick payload normalizer/adapter before connecting feature APIs.
```

## 14. Recommended next coding order after this runbook

1. Add `docs/kick-sql-check-results.md` after running these commands.
2. If rows exist, implement `/api/kick-heatmap` real/stale/empty reader first.
3. If rows do not exist, keep stubs and create a Kick collector task/runbook.
