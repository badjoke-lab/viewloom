# Twitch History v1 QA Checklist

Status: implementation-complete and UI-polished QA checklist for Twitch-only History / Trends v1.

## Scope

History v1 is Twitch-only. Kick History is intentionally deferred.

History v1 is considered complete when the checks below pass for the Twitch route and the existing Twitch feature pages remain intact.

## Main routes

- `/twitch/history/`
- `/api/history?period=7d&metric=viewer_minutes`
- `/api/history?period=30d&metric=peak_viewers`
- `/api/history?from=YYYY-MM-DD&to=YYYY-MM-DD&metric=viewer_minutes`

## Navigation checks

- `/twitch/` shows History in hero actions and the feature card grid.
- `/twitch/heatmap/` shows History through the Twitch history nav helper.
- `/twitch/day-flow/` shows History through the Twitch history nav helper.
- `/twitch/battle-lines/` shows History through the Twitch history nav helper.
- Kick pages remain unchanged.

## History page checks

- Last 7 days loads.
- Last 30 days loads.
- Custom range loads when valid.
- Custom range rejects future dates.
- Custom range rejects ranges over 90 days.
- Viewer-minutes metric changes the chart and ranking order.
- Peak viewers metric changes the chart and ranking order.
- Chart bar click updates selected day.
- Daily card click updates selected day.
- Selected day panel links to Day Flow with `date=`.
- Selected day panel links to Battle Lines with `date=`.
- Daily cards link to Day Flow and Battle Lines with `date=`.

## Daily trend UI checks

- The main chart is labeled as Daily trend, not Observed days.
- The chart title changes by metric: Viewer-minutes by day or Peak viewers by day.
- The chart note shows observed days out of selected days, for example `2 / 30 days observed`.
- Missing selected days appear as muted slots.
- Sparse data does not create oversized bars.
- The chart remains horizontally readable on mobile.

## Peak Archive Lite checks

- Peak Archive appears below the selected day panel.
- Peak Archive uses the selected period.
- Peak Archive refreshes after period changes.
- Peak Archive refreshes after metric changes.
- Peak Archive lists the highest daily peak viewers in the selected range.
- Peak Archive links each day to Day Flow with `date=`.
- Peak Archive links each day to Battle Lines with `date=`.
- Clicking a peak day syncs selected day when the matching chart or daily-card button exists.
- Empty ranges show a useful Peak Archive empty state.

## Mobile UI checks

- 360px, 390px, and 430px widths are usable.
- Hero action buttons do not become a long vertical stack on normal mobile widths.
- Period and metric controls remain tappable.
- Custom date controls remain tappable.
- Summary cards are compressed enough to reach the chart quickly.
- Selected day actions remain easy to tap.
- Top Streamers remains readable without becoming a wide table.
- Daily Cards and Peak Archive links are tappable.
- Coverage and Method notes are not visually heavier than the main analysis sections.

## Data quality checks

- Empty range shows a useful empty state.
- Partial coverage is visible.
- Coverage / Data quality note appears.
- Method notes explain viewer-minutes, peak viewers, and coverage.
- Demo data must not look like real observed data.

## Existing-page checks

- `/twitch/heatmap/` still renders.
- `/twitch/day-flow/` still renders.
- `/twitch/battle-lines/` still renders.
- `/kick/` still renders.
- `/kick/heatmap/` still renders.
- `/kick/day-flow/` still renders.
- `/kick/battle-lines/` still renders.

## SEO / public checklist

- Twitch History has a unique title.
- Twitch History has a useful meta description.
- Twitch Home exposes History as a visible feature card.
- Sitemap / robots should be added after the final production domain is fixed.
- Canonical URL should be added after the final production domain is fixed.

## v1 complete definition

Twitch History / Trends v1 is complete when:

- `/twitch/history/` is reachable from Twitch Home, Heatmap, Day Flow, and Battle Lines.
- The page supports Last 7 days, Last 30 days, and valid Custom ranges.
- Viewer-minutes and Peak viewers both work as metrics.
- Summary cards, Daily trend, Selected day, Top streamers, Daily cards, Coverage, Method notes, and Peak Archive Lite are present.
- Daily trend explains observed day coverage and missing days.
- Day Flow and Battle Lines links carry the selected `date=`.
- Empty, partial, and coverage states are visible.
- 360px to 430px mobile widths are usable.
- Kick is not changed by the Twitch History work.

## Current status after UI polish

The Twitch History v1 implementation and first UI polish pass are complete. Remaining work should be treated as post-v1 iteration unless a QA failure is found.

## Next possible phases

- Post-v1 visual refinement after browser screenshots.
- Rising Streamers Lite.
- Kick History.
- Sitemap / canonical after final production domain is fixed.

## Deferred

- Kick History.
- History sitemap entry.
- Canonical URL.
- Weekly / monthly reports.
- Rising Streamers Lite.
- Battle Archive tab.
- Category trends.
- Share card generator.
