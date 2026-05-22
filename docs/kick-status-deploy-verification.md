# Kick status deploy verification

This document defines post-deploy checks for Kick status after registry target and feedback fields are added.

## Purpose

After deploy, verify that `/api/kick-status` reports the latest collector state honestly for both modes:

```text
seed-list fallback
registry-backed candidate selection
```

These checks do not claim Kick has Twitch parity or directory coverage.

## Check the API

```bash
curl -sS "https://viewloom.pages.dev/api/kick-status" -o /tmp/kick-status.json
python3 - <<'PY'
import json
from pathlib import Path

d = json.loads(Path('/tmp/kick-status.json').read_text())
collector = d.get('collector', {})
feedback = d.get('registryFeedback') or {}
latest = d.get('latestSnapshot', {})

print('version:', d.get('version'))
print('state:', d.get('state'))
print('sourceMode:', d.get('sourceMode'))
print('coverageMode:', d.get('coverageMode'))
print('targetSource:', d.get('targetSource'))
print('registryCandidateCount:', d.get('registryCandidateCount'))
print('registryError:', d.get('registryError'))
print('collector.coverageMode:', collector.get('coverageMode'))
print('collector.targetSource:', collector.get('targetSource'))
print('collector.attemptedChannels:', collector.get('attemptedChannels'))
print('collector.writtenStreamCount:', collector.get('writtenStreamCount'))
print('registryFeedback.applied:', feedback.get('applied'))
print('registryFeedback.observedUpdated:', feedback.get('observedUpdated'))
print('registryFeedback.missedUpdated:', feedback.get('missedUpdated'))
print('registryFeedback.error:', feedback.get('error'))
print('latest.coverageMode:', latest.get('coverageMode'))
print('latest.targetSource:', latest.get('targetSource'))
print('latest.observedCount:', latest.get('observedCount'))
PY
```

## Expected seed-list fallback result

Before `kick_channels` exists or before it has candidate rows, expected values are:

```text
coverageMode = seed-list
targetSource = seed-list
registryFeedback.applied = false
```

`registryError` may explain why registry selection was not used, for example:

```text
registry table missing
registry_empty
```

Exact error text may vary because it is sanitized from D1 errors.

## Expected registry-backed result

After `kick_channels` exists, candidate rows are imported, and collector writes a snapshot from registry-selected slugs, expected values are:

```text
coverageMode = registry
targetSource = registry
registryCandidateCount > 0
collector.attemptedChannels > 0
```

If feedback ran successfully:

```text
registryFeedback.applied = true
registryFeedback.observedUpdated >= 0
registryFeedback.missedUpdated >= 0
registryFeedback.error = null
```

## Check latest DB source modes

```bash
cd ~/viewloom/workers/collector-kick
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT source_mode, COUNT(*) AS rows FROM minute_snapshots WHERE provider='kick' GROUP BY source_mode ORDER BY rows DESC;"
```

## Check latest payload metadata

```bash
npx wrangler d1 execute vl_kick_hot --remote --command "SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode, payload_json FROM minute_snapshots WHERE provider='kick' ORDER BY bucket_minute DESC LIMIT 1;"
```

Inspect `payload_json.collectorMeta` for:

```text
targetSource
coverageMode
registryCandidateCount
registryError
registryFeedback
attemptedChannelSlugs
observedSlugs
missedSlugs
```

## Failure cases

### coverageMode remains seed-list after migration/import

This is expected until the deployed collector writes a new snapshot using registry-selected slugs.

Run a manual collection after deploy if appropriate:

```bash
WORKER_URL="https://viewloom-collector-kick.badjoke-lab.workers.dev"
curl -s -X POST "$WORKER_URL/collect" -H "x-ingest-token: $NEW_KICK_INGEST_TOKEN"
echo
```

### registryFeedback is not applied

Expected when target source is seed-list.

Unexpected when target source is registry. Check:

```text
registryFeedback.error
registryError
collectorMeta.targetSource
collectorMeta.coverageMode
```

### status says registry but observedCount is low

This does not mean the feature pages are healthy. Registry coverage is candidate coverage, not directory coverage. Candidate expansion and QA are still required.

## Non-goals

This verification does not:

- run migration;
- import seed rows;
- add discovery;
- claim Kick parity;
- claim directory coverage;
- guarantee page density.
