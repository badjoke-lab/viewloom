# Kick production data runbook

Kick production data lives in the dedicated D1 database `vl_kick_hot`, bound to Pages Functions and `collector-kick` as `DB_KICK_HOT`.

## Current status

As of the current handoff, Kick is **not finished as a Twitch-parity data surface**. The correct status is:

- Kick real-data MVP connection: done.
- Dedicated D1 `vl_kick_hot`: done.
- `collector-kick` deploy and cron: previously confirmed.
- Fixture rows: removed from production D1.
- `public-channel-fallback` real rows: confirmed.
- Heatmap / Day Flow / Battle Lines / History: confirmed to read Kick D1 rows before the latest seed expansion.
- Status v2 with observed channels and `collectorMeta`: confirmed.
- Large built-in seed list PR: merged.
- Large seed list worker redeploy: **pending PC / Cloudflare access**.
- Large seed list observed-channel impact: **pending**.

Do not describe Kick as complete until the post-#155 redeploy and observed-channel checks pass.

## Resume checklist after PC access returns

Pull latest main and redeploy the Kick collector so the large built-in seed list is active:

```bash
cd ~/viewloom
git pull

cd ~/viewloom/workers/collector-kick
npx wrangler deploy --config wrangler.generated.toml
```

Run a manual collection using a fresh ingest token:

```bash
NEW_KICK_INGEST_TOKEN="$(openssl rand -hex 32)"
printf '%s' "$NEW_KICK_INGEST_TOKEN" | npx wrangler secret put KICK_INGEST_TOKEN --config wrangler.generated.toml

npx wrangler deploy --config wrangler.generated.toml

WORKER_URL="https://viewloom-collector-kick.badjoke-lab.workers.dev"

curl -s -X POST "$WORKER_URL/collect" \
  -H "x-ingest-token: $NEW_KICK_INGEST_TOKEN"
echo
```

Check whether the large seed list is actually active:

```bash
curl -sS "https://viewloom.pages.dev/api/kick-status" -o /tmp/kick-status.json

python3 - <<'PY'
import json
from pathlib import Path

d = json.loads(Path('/tmp/kick-status.json').read_text())
collector = d.get('collector', {})
meta = d.get('collectorMeta', {})
print('version:', d.get('version'))
print('state:', d.get('state'))
print('sourceMode:', d.get('sourceMode'))
print('configured:', collector.get('configuredChannels'))
print('observed:', len(d.get('latestObservedChannels', [])))
print('missed:', len(collector.get('missedSlugs', [])))
print('defaultSeedCount:', meta.get('defaultSeedCount'))
print('maxChannelSlugs:', meta.get('maxChannelSlugs'))
print('channels:', [(x.get('displayName'), x.get('viewers')) for x in d.get('latestObservedChannels', [])])
PY
```

Minimum acceptable post-redeploy result:

- `configured` should be far above 30, capped by the collector limit.
- `defaultSeedCount` and `maxChannelSlugs` should appear in `collectorMeta`.
- `observed` should be materially higher than the old 6-channel result, or the seed list must be refined again.

If the observed count stays low, update `workers/collector-kick/src/kick-seed-slugs.ts` with better live-rate candidates instead of calling the Kick surface complete.

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
- `public-channel-fallback`: sampled from configured seed slugs through the public channel fallback.
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

## Verify cron accumulation

After enabling the `collector-kick` cron, confirm that `public-channel-fallback` or `authenticated` rows continue to accumulate and that the latest timestamp advances:

```sql
SELECT
  COUNT(*) AS rows,
  MIN(bucket_minute) AS first_bucket,
  MAX(bucket_minute) AS latest_bucket,
  MAX(collected_at) AS latest_collected
FROM minute_snapshots
WHERE provider = 'kick'
AND source_mode IN ('public-channel-fallback', 'authenticated');
```

Then inspect the most recent buckets:

```sql
SELECT bucket_minute, stream_count, total_viewers, source_mode, collected_at
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 12;
```

Healthy seed-list collection usually means:

- `latest_bucket` keeps advancing on the configured cron cadence.
- `stream_count` is greater than zero in recent rows.
- `total_viewers` is greater than zero in recent rows.
- `source_mode` is explicit and not `fixture`.

## Inspect latest observed channels

The latest `payload_json` stores `items` and, for newer collector versions, `collectorMeta`. Use this to see which seed slugs were actually live in the latest snapshot:

```sql
SELECT bucket_minute, collected_at, stream_count, total_viewers, payload_json
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 1;
```

The `/api/kick-status` endpoint also surfaces `latestObservedChannels` and collector metadata when present.

## UI/API checks

- `/api/kick-status` and `/kick/status/` must show `DB_KICK_HOT / vl_kick_hot`, latest `source_mode`, `bucket_minute`, `collected_at`, `stream_count`, and `total_viewers`.
- `/api/kick-status` and `/kick/status/` should show the latest observed Kick channels when the snapshot payload contains channel items.
- `/api/kick-heatmap`, `/api/kick-day-flow`, `/api/kick-battle-lines`, and `/api/kick-history` must read Kick rows from `DB_KICK_HOT` only.
- If the latest rows are `fixture`, UI copy must remain explicit that fixture data is not live production data.
- If the latest rows are `public-channel-fallback`, UI copy must not call it official authenticated collection.
