# Heatmap Data-State Truth

This document records PR 3 of the 12-PR Heatmap repair schedule.

## Purpose

The Heatmap must not derive a healthy-looking UI from ambiguous strings such as `ok`, `api`, `authenticated`, or a numeric activity fallback. This PR introduces one normalized data-truth model shared by Twitch and Kick and applies it to the existing page while the visual redesign remains deferred to later PRs.

## Public states

The Heatmap page uses only Loading, Fresh, Stale, Partial, Empty, Error, and Demo.

`Strong stale` remains an internal severity flag; the feature page still renders the public state as Stale.

## State precedence

1. Error when the request failed and no usable snapshot exists.
2. Demo when fallback data is shown.
3. Empty when a real snapshot exists without qualifying records.
4. Stale when the latest real snapshot is delayed.
5. Partial when coverage is limited, source mode is unknown, the collector is degraded, or activity is unavailable or not sampled.
6. Fresh when recent real data exists without those limitations.

With no explicit API thresholds, stale begins after ten minutes and strong stale after thirty minutes.

## Source and collection method

Source mode and collection method are separate concepts.

- Source mode: Real, Stale real, Demo, or Unknown.
- Collection method: Authenticated API, Public listing, or a payload-provided method.

The Source cell shows source mode. Collection method appears in coverage details and the Source cell title.

## Coverage truth

The model keeps observed records, configured collector limit, covered pages, `hasMore`, and snapshot age separate. Every valid record present in the snapshot remains a rendering target. `hasMore` describes collector coverage only.

## Activity truth

Each record is classified as available, sampled zero, unavailable, or not sampled. A missing activity property is unavailable rather than numeric zero.

## Temporary integration

The current Heatmap implementation still owns its request and rendering. A temporary response observer reads a cloned copy of the existing Heatmap response, leaves the original response available to the current renderer, and applies normalized truth to the page. This avoids a second API request and also covers the existing auto-refresh path.

The final cutover PR removes this compatibility layer after request, state, rendering, and status ownership have moved to the repaired architecture.

## UI surfaces corrected

- global header status and dot color
- Hero Observed and State facts
- Updated, Observed, Coverage, and Source strip
- live-status cards and coverage detail
- activity summary, selected activity, support block, and legend wording

## Runtime repair

PR 2 was merged with a TypeScript narrowing error in the lifecycle loop. PR 3 replaces the invalid state comparison with an explicit `destroyRequested` flag and prevents an in-flight run from overwriting the destroyed lifecycle state.
