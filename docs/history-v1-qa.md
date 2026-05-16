# Twitch History v1 QA Checklist

Status: complete for Twitch-only History / Trends v1.

## Scope

History v1 is Twitch-only. Kick History is intentionally deferred.

Twitch History / Trends v1 is now considered complete after implementation, collector scheduling, UI polish, and ranking cleanup.

## Main routes

- `/twitch/history/`
- `/api/history?period=7d&metric=viewer_minutes`
- `/api/history?period=30d&metric=peak_viewers`
- `/api/history?from=YYYY-MM-DD&to=YYYY-MM-DD&metric=viewer_minutes`

## Completed work

- Added Twitch History / Trends as the fourth major Twitch feature page.
- Added navigation from Twitch Home, Heatmap, Day Flow, and Battle Lines.
- Added `/api/history` with period and metric support.
- Added Last 7 days, Last 30 days, and Custom range controls.
- Added Viewer-minutes and Peak viewers metric switching.
- Added Summary cards.
- Added Daily trend with observed-day coverage and muted missing-day slots.
- Added Selected day panel with Day Flow / Battle Lines links.
- Added Top streamers ranking.
- Added Daily cards.
- Added Coverage / Data quality and Method notes.
- Added Peak Archive Lite.
- Consolidated History helper scripts into the main History entry.
- Added mobile polish for 360px to 430px widths.
- Added scheduled Twitch collector workflow so observed days can grow over time.
- Cleaned up the Top streamers ranking by hiding the inactive previous-period change column.

## PR completion log

- #46 to #55: History / Trends v1 foundation, data, navigation, QA, and Peak Archive Lite.
- #56: Daily trend redesign and first UI polish.
- #57: History script consolidation.
- #58: Final mobile polish pass.
- #59: UI polish QA documentation.
- #62: Scheduled Twitch collector workflow.
- #63: Summary layout and History UI polish pass 2.
- #64: Top streamers ranking cleanup.

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
- Peak archive click updates selected day.
- Selected day panel links to Day Flow with `date=`.
- Selected day panel links to Battle Lines with `date=`.
- Daily cards link to Day Flow and Battle Lines with `date=`.

## Daily trend UI checks

- The main chart is labeled as Daily trend, not Observed days.
- The chart title changes by metric: Viewer-minutes by day or Peak viewers by day.
- The chart note shows observed days out of selected days, for example `4 / 30 days observed`.
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
- Clicking a peak day syncs selected day.
- Empty ranges show a useful Peak Archive empty state.

## Ranking checks

- Top streamers shows a compact ranking list.
- Desktop ranking uses three readable columns: Streamer, Viewer-minutes, and Peak viewers.
- Mobile ranking remains card-style.
- The inactive previous-period change column is hidden until previous-period comparison is reliable.

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

## Collector / data checks

- Manual collector trigger returns `ok: true`.
- GitHub Actions scheduled Twitch collector workflow exists.
- Required GitHub repository secrets are documented.
- New `real` rows appear in `vl_twitch_hot.minute_snapshots` after collector runs.
- History only shows observed days that exist in `minute_snapshots`.
- Partial coverage is expected while the collector history is still sparse.

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

Twitch History / Trends v1 is complete because:

- `/twitch/history/` is reachable from Twitch Home, Heatmap, Day Flow, and Battle Lines.
- The page supports Last 7 days, Last 30 days, and valid Custom ranges.
- Viewer-minutes and Peak viewers both work as metrics.
- Summary cards, Daily trend, Selected day, Top streamers, Daily cards, Coverage, Method notes, and Peak Archive Lite are present.
- Daily trend explains observed day coverage and missing days.
- Day Flow and Battle Lines links carry the selected `date=`.
- Empty, partial, and coverage states are visible.
- 360px to 430px mobile widths are usable.
- Scheduled collection is in place for future observed days.
- Kick is not changed by the Twitch History work.

## Completion note

Twitch History / Trends v1 should now be treated as complete. Future work should be handled as post-v1 iteration unless a QA failure is found.

## Post-v1 candidates

- Rising Streamers Lite.
- Previous-period comparison for ranking change percentages.
- Kick History.
- Calendar heat.
- Weekly / monthly reports.
- Battle Archive tab.
- Category trends.
- Share card generator.
- Additional mobile compactness refinements.
- Sitemap / canonical after final production domain is fixed.

## Deferred

- Kick History.
- History sitemap entry.
- Canonical URL.
- Weekly / monthly reports.
- Rising Streamers Lite.
- Previous-period comparison.
- Battle Archive tab.
- Category trends.
- Share card generator.
