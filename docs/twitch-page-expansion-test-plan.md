# Twitch page expansion test plan

## Purpose

Twitch Heatmap currently reports:

```text
covered_pages=3
has_more=1
```

This means the current Twitch collection does not fully exhaust available top streams. Before increasing production collection, ViewLoom needs a controlled test plan for 5-page and 10-page collection.

## Current baseline

The current verified production shape is:

```text
/api/twitch-heatmap
items: 286
targetSource: twitch-helix-streams
coverageMode: partial-top-pages
activityAvailable: false
activityUnavailableReason: chat_sampling_not_connected
covered_pages: 3
has_more: 1
state: stale at the last verification
```

The API shape is now usable for Heatmap, but collection freshness and page coverage still require operational checks.

## Test principle

Do not immediately switch production to a larger page count.

Run controlled probes first:

1. 3 pages baseline
2. 5 pages probe
3. 10 pages probe

Each probe must record:

- stream count
- total viewers
- has_more
- ingest payload size
- ingest response status
- D1 latest row count
- Heatmap API response time if measured externally
- whether the page visually remains usable

## Acceptance criteria

A page-count increase is acceptable only if all of the following hold:

- Ingest succeeds without API errors.
- No obvious Twitch API rate-limit / auth errors occur.
- `minute_snapshots` payload remains within safe D1/Workers response size.
- `/api/twitch-heatmap` responds with items and notes.
- Browser Heatmap remains usable without obvious freeze or layout failure.
- Cloudflare usage remains acceptable for 5-minute production collection.

## Stop / rollback criteria

Stop or do not adopt the larger page count if any of the following occur:

- Twitch API returns repeated errors or rate-limit behavior.
- D1 write or read errors occur.
- API response becomes too large or slow.
- Heatmap browser rendering becomes unstable.
- The extra streams are mostly low-value noise for the current Heatmap layout.

## Suggested terminal checks

Current production verification:

```bash
curl -sS "https://viewloom.pages.dev/api/twitch-heatmap?nocache=$(date +%s)" -o /tmp/twitch-heatmap.json
python3 - <<'PY'
import json
from pathlib import Path

d = json.loads(Path('/tmp/twitch-heatmap.json').read_text())
items = d.get('items') or []
print('state:', d.get('state'))
print('items:', len(items))
print('targetSource:', d.get('targetSource'))
print('coverageMode:', d.get('coverageMode'))
print('coverageNote:', d.get('coverageNote'))
print('notes:', d.get('notes'))
latest = d.get('latest') or {}
print('bucket_minute:', latest.get('bucket_minute'))
print('covered_pages:', latest.get('covered_pages'))
print('has_more:', latest.get('has_more'))
print('stream_count:', latest.get('stream_count'))
print('total_viewers:', latest.get('total_viewers'))
PY
```

D1 verification:

```sql
SELECT bucket_minute, collected_at, covered_pages, has_more, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'twitch'
ORDER BY bucket_minute DESC
LIMIT 20;
```

## Probe levels

### Level 0: baseline 3 pages

Use this as the current reference.

Expected current behavior:

```text
covered_pages around 3
stream_count around 280-300
has_more likely 1
```

### Level 1: 5 pages

Purpose:

- Check whether roughly 450-500 streams can be collected safely.
- Compare Heatmap rendering and API response against baseline.

Adopt 5 pages only if:

- API and D1 remain stable.
- Browser remains responsive.
- The extra coverage materially improves Heatmap usefulness.

### Level 2: 10 pages

Purpose:

- Check whether roughly 900-1000 streams are technically possible.
- This is a stress/probe level, not an automatic production target.

Adopt 10 pages only if:

- 5 pages was stable.
- The browser can still render without obvious UX degradation.
- Cloudflare/D1 impact is acceptable.

## Production recommendation

Do not move directly from 3 pages to 10 pages.

Recommended order:

1. Restore/verify Twitch collector freshness.
2. Keep 5-minute bucket collection.
3. Run a one-off 5-page probe.
4. If stable, trial 5 pages for a short period.
5. Only then test 10 pages.

## Relationship to other work

This plan does not solve:

- activity/comment heat sampling
- Twitch collector freshness/staleness
- Kick top-100 limit
- browser QA

It only prepares a safe decision path for increasing Twitch top stream coverage.
