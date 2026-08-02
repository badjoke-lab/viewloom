# Kick production fixture removal runbook

Status: production-safe, provider-scoped cleanup procedure

## Purpose

Use this runbook after fixture-based storage validation and before describing Kick production data as real. The cleanup is deliberately limited to Kick rows whose `source_mode` is exactly `fixture`.

This procedure does not change Twitch data, collector cadence, schema, retention, category capture, or the active Twitch stability clock.

## Preconditions

Before deleting anything:

1. Confirm the target database is `vl_kick_hot`.
2. Confirm the binding is `DB_KICK_HOT`.
3. Confirm at least one non-fixture Kick collection has completed, or accept that the APIs may become empty after fixture removal.
4. Do not run a provider-wide or table-wide delete.

## Inspect current source modes

Run against the remote Kick D1 database:

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "
SELECT
  provider,
  source_mode,
  COUNT(*) AS row_count,
  MIN(bucket_minute) AS first_bucket,
  MAX(bucket_minute) AS latest_bucket
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY provider, source_mode
ORDER BY latest_bucket DESC;
"
```

The result must be reviewed before cleanup. `fixture` rows are test data. Current real/fallback rows use collector-defined non-fixture modes such as `authenticated`, `public-channel-fallback`, or an explicitly empty fallback mode. Official-livestreams coverage is recorded in collector metadata even when the persisted row mode is `authenticated`.

## Remove only fixture rows

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "
DELETE FROM minute_snapshots
WHERE provider = 'kick'
  AND source_mode = 'fixture';
"
```

Equivalent SQL:

```sql
DELETE FROM minute_snapshots
WHERE provider = 'kick'
  AND source_mode = 'fixture';
```

Do not broaden this predicate.

## Verify cleanup

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "
SELECT COUNT(*) AS remaining_fixture_rows
FROM minute_snapshots
WHERE provider = 'kick'
  AND source_mode = 'fixture';

SELECT
  source_mode,
  COUNT(*) AS row_count,
  MAX(bucket_minute) AS latest_bucket
FROM minute_snapshots
WHERE provider = 'kick'
GROUP BY source_mode
ORDER BY latest_bucket DESC;
"
```

Acceptance:

- `remaining_fixture_rows = 0`;
- no Twitch database or row was touched;
- the latest surviving Kick row has a truthful non-fixture `source_mode`, or the Kick APIs honestly report an empty/unconfigured state;
- no synthetic replacement or backfill is inserted.

## Verify public surfaces

After cleanup and the next successful collection, check:

```text
/api/kick-status
/api/kick-heatmap
/api/kick-day-flow
/api/kick-battle-lines
/api/kick-history
/kick/status/
/kick/heatmap/
/kick/day-flow/
/kick/battle-lines/
/kick/history/
```

The status/API surfaces must not describe fixture-only data as real. The provider must remain `kick`, and no Twitch fallback is permitted.

## Recovery

Fixture rows are disposable validation data and should not be restored to production after cleanup. If the real collector is unhealthy, expose the truthful empty, partial, stale, or fallback state and repair collection separately. Do not hide the failure by reinserting fixtures.
