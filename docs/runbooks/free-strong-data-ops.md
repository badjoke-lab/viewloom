# ViewLoom Free Strong data ops runbook

Status: PR-Data-08 runbook / QA.

## Current Free Strong target

```text
Cost: free
Collection cadence: 5 minutes
Twitch observed set: up to 300 streams
Kick observed set: up to 100 official livestream rows when available
Twitch raw snapshots: 30 days
Kick raw snapshots: 60 days by default
Kick 90 days: measurement-gated
History rollups: 180 days
```

## What this runbook covers

```text
- Confirm collectors are still writing every 5 minutes.
- Confirm daily_rollups exists and is populated.
- Confirm History can use daily_rollups.
- Audit raw snapshot growth.
- Run retention audit safely.
- Run retention cleanup only after audit.
- Check build/typecheck before merge.
```

## Local sync

```bash
cd ~/viewloom || exit 1
git fetch origin
git reset --hard origin/main
```

## Install dependencies

Use this if `tsc` or `vite` is missing.

```bash
npm --prefix apps/web install
```

## Build checks

```bash
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

## D1 daily cadence check

Expected ideal value is 288 rows per provider for a full 24 hours at 5-minute cadence.

```bash
wrangler d1 execute vl_twitch_hot --remote --command "SELECT COUNT(*) AS rows_24h FROM minute_snapshots WHERE provider='twitch' AND unixepoch(bucket_minute) >= unixepoch('now', '-24 hours');"

wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows_24h FROM minute_snapshots WHERE provider='kick' AND unixepoch(bucket_minute) >= unixepoch('now', '-24 hours');"
```

Interpretation:

```text
288: ideal full 5-minute cadence
270-287: small gap, watch
<270: investigate collector or API failures
0: collector likely not writing
```

## Raw payload audit

```bash
wrangler d1 execute vl_twitch_hot --remote --command "SELECT COUNT(*) AS rows, MIN(bucket_minute) AS oldest, MAX(bucket_minute) AS latest, ROUND(SUM(LENGTH(payload_json)) / 1024.0 / 1024.0, 2) AS payload_mb, ROUND(AVG(LENGTH(payload_json)), 0) AS avg_payload_bytes FROM minute_snapshots WHERE provider='twitch';"

wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows, MIN(bucket_minute) AS oldest, MAX(bucket_minute) AS latest, ROUND(SUM(LENGTH(payload_json)) / 1024.0 / 1024.0, 2) AS payload_mb, ROUND(AVG(LENGTH(payload_json)), 0) AS avg_payload_bytes FROM minute_snapshots WHERE provider='kick';"
```

## Daily rollup table check

```bash
wrangler d1 execute vl_twitch_hot --remote --command "SELECT provider, COUNT(*) AS rows, MIN(day) AS oldest, MAX(day) AS latest FROM daily_rollups GROUP BY provider;"

wrangler d1 execute vl_kick_hot --remote --command "SELECT provider, COUNT(*) AS rows, MIN(day) AS oldest, MAX(day) AS latest FROM daily_rollups GROUP BY provider;"
```

Expected:

```text
Twitch: daily_rollups rows should cover observed Twitch days.
Kick: daily_rollups rows should cover observed Kick days.
latest should normally be today or yesterday depending on collection/backfill timing.
```

## Backfill daily rollups

Use this after schema changes, after data repair, or when rollups are missing.

```bash
wrangler d1 execute vl_twitch_hot --remote --yes --file db/d1/001_daily_rollups.sql
wrangler d1 execute vl_kick_hot --remote --yes --file db/d1/001_daily_rollups.sql
wrangler d1 execute vl_twitch_hot --remote --yes --file db/d1/002_backfill_daily_rollups.sql
wrangler d1 execute vl_kick_hot --remote --yes --file db/d1/002_backfill_daily_rollups.sql
wrangler d1 execute vl_twitch_hot --remote --yes --file db/d1/003_refresh_today_daily_rollups.sql
wrangler d1 execute vl_kick_hot --remote --yes --file db/d1/003_refresh_today_daily_rollups.sql
```

## Retention audit

Run audit before cleanup.

```bash
wrangler d1 execute vl_twitch_hot --remote --file db/d1/004_retention_audit.sql
wrangler d1 execute vl_kick_hot --remote --file db/d1/004_retention_audit.sql
```

Only proceed to cleanup if:

```text
- daily_rollups exists.
- daily_rollups latest day is current enough.
- retention audit shows the expected deletion target.
- no active incident is being investigated.
```

## Retention cleanup

Use only after audit.

```bash
wrangler d1 execute vl_twitch_hot --remote --yes --file db/d1/005_retention_cleanup.sql
wrangler d1 execute vl_kick_hot --remote --yes --file db/d1/005_retention_cleanup.sql
```

Then rerun:

```bash
wrangler d1 execute vl_twitch_hot --remote --file db/d1/004_retention_audit.sql
wrangler d1 execute vl_kick_hot --remote --file db/d1/004_retention_audit.sql
```

## Public API checks

Use these after deployment.

```bash
curl -s "https://viewloom.pages.dev/api/data-audit" | head
curl -s "https://viewloom.pages.dev/api/retention-policy?provider=twitch" | head
curl -s "https://viewloom.pages.dev/api/retention-policy?provider=kick" | head
curl -s "https://viewloom.pages.dev/api/history?period=30d" | head
curl -s "https://viewloom.pages.dev/api/kick-history?period=30d" | head
```

If the production domain differs, replace the host.

## History read path

History APIs should prefer `daily_rollups` and fallback to `minute_snapshots` only when rollups are unavailable.

Check response JSON for:

```text
readPath: daily_rollups
```

Fallback is acceptable temporarily, but not as the normal Free Strong path.

## Kick 90-day decision

Kick stays at 60 days unless measurements support 90 days.

Safe candidate:

```text
estimatedPayloadMbAt90Days <= 250 MB
```

Watch candidate:

```text
250 MB - 350 MB
```

Do not enable:

```text
> 350 MB
```

Use `/api/data-audit` and the D1 raw payload audit before changing retention from 60 to 90 days.

## Incident checklist

If Heatmap is empty:

```text
1. Check latest minute_snapshots.
2. Check rows_24h.
3. Check collector_status if available.
4. Check provider API/fallback status.
```

If Day Flow or Battle Lines is empty:

```text
1. Check whether the selected date is inside raw retention.
2. Check minute_snapshots for that date.
3. Use History for older summary trends.
```

If History is empty:

```text
1. Check daily_rollups.
2. Run backfill if missing.
3. Confirm History API readPath.
```

## Terminal commands to attach to future bug reports

```bash
wrangler d1 execute vl_twitch_hot --remote --command "SELECT COUNT(*) AS rows_24h FROM minute_snapshots WHERE provider='twitch' AND unixepoch(bucket_minute) >= unixepoch('now', '-24 hours');"
wrangler d1 execute vl_kick_hot --remote --command "SELECT COUNT(*) AS rows_24h FROM minute_snapshots WHERE provider='kick' AND unixepoch(bucket_minute) >= unixepoch('now', '-24 hours');"
wrangler d1 execute vl_twitch_hot --remote --command "SELECT provider, COUNT(*) AS rows, MIN(day) AS oldest, MAX(day) AS latest FROM daily_rollups GROUP BY provider;"
wrangler d1 execute vl_kick_hot --remote --command "SELECT provider, COUNT(*) AS rows, MIN(day) AS oldest, MAX(day) AS latest FROM daily_rollups GROUP BY provider;"
```

