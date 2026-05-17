# Kick Parity QA Checklist

Status: implementation checklist after Kick provider-row connection and Kick History parity work.  
Scope: Kick Heatmap, Day Flow, Battle Lines, History, Status, and navigation surfaces.  
Created: 2026-05-17

## Current implementation baseline

Kick now has provider-specific routes for the four ViewLoom feature roles:

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry
- History & Trends = Trends

Implemented routes:

- `/kick/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`
- `/kick/history/`
- `/kick/status/`

Implemented APIs:

- `/api/kick-heatmap`
- `/api/kick-day-flow`
- `/api/kick-battle-lines`
- `/api/kick-history`

Data rule:

- Kick APIs must read `minute_snapshots` with `provider = 'kick'`.
- Twitch data must never be reused as Kick data.
- Empty, partial, stale, and error states must stay visible instead of silently falling back.

## API checks

### Kick Heatmap

URL:

- `/api/kick-heatmap`

Expected:

- `platform: 'kick'`
- `state` / `status` is one of `empty`, `partial`, `stale`, `live`, `error`
- `items[]` uses Kick-normalized stream fields:
  - `id`
  - `name`
  - `title`
  - `viewers`
  - `url`
  - `startedAt` when available
- Kick URLs use `https://kick.com/{id}` when no raw URL exists.
- No Twitch channel URL or Twitch-specific source text appears in Kick payload.

### Kick Day Flow

URL examples:

- `/api/kick-day-flow?range=rolling24h&bucket=5&top=20&metric=volume`
- `/api/kick-day-flow?range=rolling24h&bucket=10&top=10&metric=share`
- `/api/kick-day-flow?day=yesterday&bucket=5&top=50&metric=volume`

Expected:

- `platform: 'kick'`
- `buckets[]`
- `totalViewersByBucket[]`
- `bands[]`
- `detailPanelSource`
- `activity.available: false` until Kick activity data exists
- `coverageNote`
- `partialNote` when sparse
- `valueMode` is `volume` or `share`
- `topN` is 10, 20, or 50
- `bucketSize` is 5 or 10

Band fields:

- `streamerId`
- `name`
- `title`
- `url`
- `totalViewerMinutes`
- `peakViewers`
- `avgViewers`
- `peakShare`
- `biggestRiseBucket`
- `biggestRiseValue`
- `firstSeen`
- `lastSeen`
- `buckets[]`

Bucket fields:

- `viewers`
- `share`
- `activity`
- `activityAvailable`
- `peak`
- `rise`

### Kick Battle Lines

URL examples:

- `/api/kick-battle-lines?range=rolling24h&bucket=5&top=5&metric=viewers`
- `/api/kick-battle-lines?range=rolling24h&bucket=10&top=10&metric=indexed`

Expected:

- `platform: 'kick'`
- `lines[]`
- `primaryBattle`
- `recommendedBattle`
- `recommendedQuality`
- `secondaryBattles[]`
- `battles[]`
- `events[]`
- `feed[]`
- `contract.linePointStates` includes:
  - `observed`
  - `missing`
  - `not_observed`
  - `offline`

Line fields:

- `streamerId`
- `name`
- `title`
- `url`
- `viewerMinutes`
- `peakViewers`
- `points[]`

Point rule:

- Observed points may be drawn as values.
- `missing`, `not_observed`, and `offline` points must not be connected as observed line values.

Battle scoring checks:

- Recommended battle must not be chosen by viewer-minutes alone.
- Overlap count matters.
- Longest run matters.
- Recent overlap matters.
- Missing penalty matters.
- Reversal count matters.

### Kick History

URL examples:

- `/api/kick-history?period=7d&metric=viewer_minutes`
- `/api/kick-history?period=30d&metric=peak_viewers`
- `/api/kick-history?from=YYYY-MM-DD&to=YYYY-MM-DD&metric=viewer_minutes`

Expected:

- `platform: 'kick'`
- `period`
- `metric`
- `summary`
- `daily[]`
- `topStreamers[]`
- `coverage`
- `notes[]`

Summary fields:

- `totalViewerMinutes`
- `peakViewers`
- `peakDay`
- `topStreamer`
- `coverageState`

Daily fields:

- `day`
- `totalViewerMinutes`
- `peakViewers`
- `peakStreamerName`
- `observedStreamCount`
- `observedMinutes`
- `coverageState`

Top streamer fields:

- `streamerId`
- `displayName`
- `viewerMinutes`
- `peakViewers`
- `avgViewers`
- `observedMinutes`
- `rankByViewerMinutes`
- `rankByPeak`
- `changePct`

Custom range rule:

- More than 90 days must return a clear error.
- Future dates must be rejected by the frontend.

## Page checks

### `/kick/`

- Shows Heatmap, Day Flow, Battle Lines, and History as available feature entries.
- Does not describe Kick as only a three-page provider.
- Status link is present.
- History link points to `/kick/history/`.

### `/kick/heatmap/`

- Feature nav includes History.
- Status strip says `KICK DATA · NOW`.
- API state strip reads `/api/kick-heatmap`.
- No Twitch API fallback is visible.

### `/kick/day-flow/`

- Feature nav includes History.
- Status strip says `KICK DATA · TODAY`.
- Debug panel reads `/api/kick-day-flow`.
- API state strip reads `/api/kick-day-flow`.
- Activity unavailable state remains honest.

### `/kick/battle-lines/`

- Feature nav includes History.
- Status strip says `KICK DATA · RIVALRY`.
- Debug panel reads `/api/kick-battle-lines`.
- API state strip reads `/api/kick-battle-lines`.
- Missing/not-observed/offline points are not implied as observed lines.

### `/kick/history/`

- H1 is `History & Trends`.
- Eyebrow is `KICK DATA · TRENDS`.
- Feature nav includes Heatmap, Day Flow, Battle Lines, and History.
- Status strip says `KICK DATA · TRENDS`.
- API state strip reads `/api/kick-history`.
- Period controls match Twitch History:
  - Last 7 days
  - Last 30 days
  - Custom
- Metrics match Twitch History:
  - Viewer-minutes
  - Peak viewers
- Sections match Twitch History:
  - Summary cards
  - Daily trend
  - Selected day
  - Peak archive
  - Top streamers
  - Daily cards
  - Coverage / Data quality
  - Method notes
- Day Flow links point to `/kick/day-flow/?date=YYYY-MM-DD`.
- Battle Lines links point to `/kick/battle-lines/` unless date-specific Battle Lines support is implemented later.

### `/kick/status/`

- Hero actions include History.
- Summary cards include all four functions:
  - Heatmap
  - Day Flow
  - Battle Lines
  - History
- Status page says provider rows are connected, not shell-only.
- Browser parity QA is still clearly pending.

## Navigation parity checks

Kick should expose the same four feature roles as Twitch:

- Now / Heatmap
- Today / Day Flow
- Rivalry / Battle Lines
- Trends / History & Trends

Check these locations:

- Kick overview feature cards
- Kick feature page hero actions
- Kick feature subnav
- Kick status hero actions
- Kick History page links back to Day Flow and Battle Lines

## Mobile checks

Run the same mobile widths used for Twitch History:

- 360px
- 390px
- 430px

Check:

- Hero actions remain usable.
- History controls remain tappable.
- Custom date fields do not overflow.
- Summary cards do not create excessive scroll before the chart.
- Daily trend slots remain readable.
- Selected day actions remain tappable.
- Top Streamers does not become a broken table.
- Daily cards and Peak archive links are tappable.
- Status strip wraps cleanly.

## Known risks before browser QA

- Kick History frontend was copied as a parity entry rather than fully extracting the shared Twitch/Kick History renderer.
- Kick APIs have not been browser-verified after deployment.
- `main.ts` still has an older three-feature internal model, so helper scripts currently add History links to Kick shared shell pages.
- Future refactor should make History a first-class `FeatureKey` in the shared shell, but that should be a separate PR to avoid breaking the already-working Twitch History route.
- Battle Lines date-specific links are intentionally not enabled unless the Battle Lines frontend supports date -> API range conversion.

## Completion definition

Kick parity QA can be considered passed when:

- All four Kick feature pages load.
- All four Kick APIs return provider-specific Kick payloads or honest empty/partial/error states.
- Kick navigation exposes History everywhere Twitch exposes History.
- Kick Status lists all four functions.
- No Kick page falls back to Twitch data.
- Mobile checks pass at 360px, 390px, and 430px.
