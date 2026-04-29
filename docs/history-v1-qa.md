# Twitch History v1 QA Checklist

Status: post-implementation QA checklist for Twitch-only History / Trends.

## Scope

History v1 is Twitch-only. Kick History is intentionally deferred.

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

## Data quality checks

- Empty range shows a useful empty state.
- Partial coverage is visible.
- Coverage / Data quality note appears.
- Method notes explain viewer-minutes, peak viewers, and coverage.
- Demo data must not look like real observed data.

## SEO / public checklist

- Twitch History has a unique title.
- Twitch History has a useful meta description.
- Sitemap / robots should be added after the final production domain is fixed.
- Canonical URL should be added after the final production domain is fixed.

## Deferred

- Kick History.
- History sitemap entry.
- Canonical URL.
- Weekly / monthly reports.
- Peak archive tab.
- Battle archive tab.
- Category trends.
- Share card generator.
