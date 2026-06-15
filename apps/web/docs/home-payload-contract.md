# Provider Home Payload Contract

Version: `viewloom-home-v1`

This contract defines the lightweight payload used by `/twitch/` and `/kick/` provider briefing pages.

## Endpoints

- `/api/twitch-home`
- `/api/kick-home`

Both endpoints read their own provider database and never combine Twitch and Kick values.

## Top-level fields

```text
version
platform
source
sourceMode
state
generatedAt
updatedAt
freshness
coverage
now
today
recent
signals
availability
notes
error?
```

## States

Allowed states:

- `fresh`
- `partial`
- `stale`
- `empty`
- `demo`
- `error`

Rules:

- `demo` is used only for an explicit demo or fixture source mode.
- `empty` means no qualifying real snapshot is available; it is not demo.
- `stale` preserves the last real snapshot and exposes its age.
- Twitch becomes `partial` when the current observation reports more records beyond the observed window.
- Kick becomes `partial` when the source is not authenticated, because seed-list or registry-candidate coverage is not Twitch-parity directory coverage.
- Errors return an explicit `error` object and never substitute demo values.

## `coverage`

```text
observedCount
topLimit
coveredPages
hasMore
mode
label
note
```

Every total is an observed-window value. `label` and `note` must prevent provider-wide-total interpretation.

## `now`

```text
observedStreams
observedViewers
largestStream
topStreams[]
fastestRiser
closestGap
topCategory
```

`topStreams` is limited to five records for the provider-home summary. It is not a full directory export.

A stream summary contains:

```text
id
displayName
title
category
viewers
previousViewers
change
changePct
direction
url
```

Movement is derived from the current and previous observed snapshots when possible. Missing previous data produces `unknown`, not a fabricated zero.

## `today`

```text
day
observedPeak
peakTime
currentObservedViewers
topByViewerMinutes
closestCurrentBattle
latestReversal
```

`topByViewerMinutes` comes from the current daily rollup when available. `latestReversal` remains `null` with explicit availability metadata until a battle-event summary is connected.

## `recent`

```text
latestCompletedDay
topStreamer
biggestRise
coverageState
trend[]
```

Recent summaries use completed days where possible. The trend is limited to seven completed daily rollups.

## `signals`

Initial signal types:

- `largest_observed`
- `fastest_riser`
- `closest_gap`
- `top_category`

Signals are derived only from available observed data and include the snapshot observation time.

## Availability

```text
activity
latestReversal
```

Unsupported values are `unavailable`; they are not represented as zero.

## Data access rules

- The Home API reads the latest two snapshots, the current-day observed peak, and up to nine daily rollups.
- It does not send raw minute snapshots to the browser.
- It does not call provider feature APIs from the browser to reconstruct the Home page.
- Responses use `cache-control: no-store`.
- Error messages are sanitized before they are returned.
