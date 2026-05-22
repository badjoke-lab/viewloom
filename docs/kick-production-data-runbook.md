# Kick production data runbook

Kick production data lives in the dedicated D1 database `vl_kick_hot`, bound to Pages Functions and `collector-kick` as `DB_KICK_HOT`.

## Current status

Kick is **not finished as a Twitch-parity data surface**.

The important distinction is:

- Twitch collection uses the Twitch live streams directory API and is not limited to a hand-written channel list.
- Kick collection currently uses `public-channel-fallback` against known channel slugs.
- Therefore Kick coverage is **seed-list coverage only** until discovery and registry are implemented.

Current Kick status:

- Kick real-data MVP connection: done.
- Dedicated D1 `vl_kick_hot`: done.
- `collector-kick` deploy and cron: confirmed.
- Fixture rows: removed from production D1.
- `public-channel-fallback` real rows: confirmed.
- Heatmap / Day Flow / Battle Lines / History: confirmed to read Kick D1 rows.
- Status v2 with observed channels and `collectorMeta`: confirmed.
- Large built-in seed list: merged and deployed.
- Public fallback first mode: merged and deployed.
- Rotating seed attempt window: merged and deployed.
- Twitch-parity discovery: **not implemented**.
- Registry-backed Kick channel discovery: **not implemented**.

Do not describe Kick as complete, Twitch-parity, globally discovered, or fully representative while collection is seed-list based.

## Coverage classification

Use these labels consistently:

- `seed-list coverage`: current Kick state. The collector can only see configured or built-in candidate slugs.
- `registry coverage`: future state. The collector reads from a stored channel registry that updates over time.
- `directory coverage`: Twitch-like state. The collector can query a live directory/listing endpoint directly.

Current Kick classification is **seed-list coverage**.

## Required next architecture

Kick needs a discovery and registry layer before it can be treated as a serious production data surface:

1. `kick_channels` registry table or equivalent storage.
2. Fields: `slug`, `display_name`, `last_seen_at`, `last_live_at`, `last_viewer_count`, `priority`, `failure_count`, `source`, `updated_at`.
3. Discovery job that finds candidate slugs from permitted sources.
4. Hot collector that chooses targets from the registry, not only from a static seed list.
5. Status/API copy that clearly says whether coverage is seed-list, registry, or directory-based.

The existing seed list should be treated as a bootstrap source for discovery, not the final coverage model.

## Resume checklist after PC access returns

Pull latest main and redeploy the Kick collector so the current collector code is active:

```bash
cd ~/viewloom
git pull

cd ~/viewloom/workers/collector-kick
npx wrangler deploy --config wrangler.generated.toml
```

Run a manual collection using the current ingest token in the same shell where it is defined:

```bash
WORKER_URL="https://viewloom-collector-kick.badjoke-lab.workers.dev"

curl -s -X POST "$WORKER_URL/collect" \
  -H "x-ingest-token: $NEW_KICK_INGEST_TOKEN"
echo
```

If the shell no longer has the token, rotate it first:

```bash
NEW_KICK_INGEST_TOKEN="$(openssl rand -hex 32)"
printf '%s' "$NEW_KICK_INGEST_TOKEN" | npx wrangler secret put KICK_INGEST_TOKEN --config wrangler.generated.toml
npx wrangler deploy --config wrangler.generated.toml
```

Check whether collection is active:

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
print('coverageMode:', d.get('coverageMode'))
print('configured:', collector.get('configuredChannels'))
print('attempted:', collector.get('attemptedChannels'))
print('observed:', len(d.get('latestObservedChannels', [])))
print('defaultSeedCount:', meta.get('defaultSeedCount'))
print('maxChannelSlugs:', meta.get('maxChannelSlugs'))
print('maxAttemptSlugs:', meta.get('maxAttemptSlugs'))
print('channels:', [(x.get('displayName'), x.get('viewers')) for x in d.get('latestObservedChannels', [])])
PY
```

Minimum acceptable seed-list result:

- `sourceMode` is `public-channel-fallback`.
- `coverageMode` is `seed-list`.
- `observed` is at least 1.
- `stream_count` is greater than 0 in the latest valid D1 row.

This does **not** mean Twitch parity. It only means the seed-list collector is currently producing data.

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
- `public-channel-fallback`: sampled from configured or built-in seed slugs through the public channel fallback.
- `empty-public-channel-fallback`: the fallback ran, but attempted seed slugs produced no live stream rows.
- `authenticated`: collected through the Kick OAuth app-token path.
- `empty-authenticated`: authenticated collection ran, but no configured channels produced live rows.

## Remove fixture and empty rows

After confirming the Pages binding and UI path, remove fixture rows from production:

```sql
DELETE FROM minute_snapshots WHERE provider = 'kick' AND source_mode = 'fixture';
```

When empty rows accidentally become the latest snapshot, remove them so they do not hide the latest valid production snapshot:

```sql
DELETE FROM minute_snapshots
WHERE provider = 'kick'
AND source_mode IN ('empty-authenticated', 'empty-public-channel-fallback');
```

Then re-run the source-mode inspection query above. Production should not be described as live, authenticated, complete, or Twitch-parity when only fixture or empty rows are present.

## Verify latest snapshot

```sql
SELECT provider, bucket_minute, collected_at, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 10;
```

## Verify cron accumulation

After enabling the `collector-kick` cron, confirm that `public-channel-fallback` rows continue to accumulate and that the latest timestamp advances:

```sql
SELECT
  COUNT(*) AS rows,
  MIN(bucket_minute) AS first_bucket,
  MAX(bucket_minute) AS latest_bucket,
  MAX(collected_at) AS latest_collected
FROM minute_snapshots
WHERE provider = 'kick'
AND source_mode = 'public-channel-fallback';
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

Healthy seed-list collection still does **not** mean directory coverage.

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
- `/api/kick-status` must identify current coverage as `seed-list`, not Twitch-parity or directory coverage.
- `/api/kick-heatmap`, `/api/kick-day-flow`, `/api/kick-battle-lines`, and `/api/kick-history` must read Kick rows from `DB_KICK_HOT` only.
- If the latest rows are `fixture`, UI copy must remain explicit that fixture data is not live production data.
- If the latest rows are `public-channel-fallback`, UI copy must not call it official authenticated collection or global discovery.
