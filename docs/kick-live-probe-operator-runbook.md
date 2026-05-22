# Kick live probe operator runbook

This runbook describes the short operator flow for boosting currently live Kick candidates after PR-182.

## Purpose

Kick registry selection is working, but page density depends on currently live candidates being near the top of `kick_channels` selection.

Use this flow when latest Kick snapshots are too thin.

## Generate live boost SQL

From repo root:

```bash
cd ~/viewloom
pnpm kick:live-probe:fast
```

Default output:

```text
workers/collector-kick/generated/kick-live-priority-boost.sql
```

## Review generated SQL

```bash
cd ~/viewloom/workers/collector-kick
wc -l generated/kick-live-priority-boost.sql
cat generated/kick-live-priority-boost.sql
```

## Apply reviewed SQL

```bash
npx wrangler d1 execute vl_kick_hot --remote --file generated/kick-live-priority-boost.sql
```

## Run collector

```bash
WORKER_URL="https://viewloom-collector-kick.badjoke-lab.workers.dev"

curl -s -X POST "$WORKER_URL/collect" \
  -H "x-ingest-token: ${NEW_KICK_INGEST_TOKEN}" \
  -o /tmp/kick-collect-liveprobe.json
```

## Inspect result

```bash
python3 - <<'PY'
import json
from pathlib import Path

d = json.loads(Path('/tmp/kick-collect-liveprobe.json').read_text())
r = d.get('result', {})
fb = r.get('registry_feedback') or r.get('registryFeedback') or {}

print('ok:', d.get('ok'))
print('coverage:', r.get('coverage_mode'))
print('target:', r.get('target_source'))
print('stream_count:', r.get('stream_count'))
print('total_viewers:', r.get('total_viewers'))
print('observed:', r.get('observed_slugs'))
print('missed_count:', len(r.get('missed_slugs') or []))
print('feedback:', fb)
PY
```

## Check feature API density

```bash
cd ~/viewloom

for path in kick-heatmap kick-day-flow kick-battle-lines kick-history; do
  echo "===== /api/$path ====="
  curl -sS "https://viewloom.pages.dev/api/$path" -o "/tmp/$path.json"
  python3 - "$path" <<'PY'
import json, sys
from pathlib import Path

name = sys.argv[1]
d = json.loads(Path(f'/tmp/{name}.json').read_text())
for k in ['items', 'buckets', 'bands', 'lines', 'events', 'daily', 'topStreamers', 'data']:
    if k in d:
        v = d[k]
        print(k, 'count:', len(v) if isinstance(v, (list, dict)) else None)
for k in ['state', 'status', 'coverageMode', 'targetSource', 'streamCount', 'totalViewers']:
    if k in d:
        print(k + ':', d.get(k))
PY
done
```

## Expected signs of improvement

Recent successful manual verification reached:

```text
stream_count = 4
observed = gaules, amouranth, greekgodx, knut
kick-heatmap items = 4
kick-battle-lines lines = 5
```

## Non-goals

This runbook does not claim Kick has directory coverage or Twitch parity.

It is an operator tool for improving current registry candidate quality.
