# History & Trends QA Contract

This page records the production contract for the Twitch and Kick History & Trends views.

## Required public behavior

- Twitch and Kick History pages use the current-shell live entry and their provider-specific History API.
- The page exposes working Last 7 days, Last 30 days, and Custom range controls.
- Viewer-minutes and Peak viewers change the requested metric and the chart values.
- History state is reflected in the URL so reload and sharing preserve the selected period, metric, ranking sort, ranking limit, and selected day.
- The chart includes numeric Y-axis labels, date labels, day selection, keyboard selection, and pointer tooltips.
- Selecting a day updates the Selected day panel and highlights the matching Daily archive card.
- Selected day and Daily archive links open Day Flow and Battle Lines with the selected date.
- Top streamers support Viewer-minutes / Peak viewers sorting and Top 10 / 20 / 50 limits.
- Coverage exposes observed, partial, and missing day counts, observed minutes, affected dates, and an impact note.
- Empty retained rollups render as an honest empty state, never demo data.
- Mobile replaces the wide ranking table with streamer cards and keeps the controls and daily archive usable.
- Public state labels are Fresh / Partial / Empty / Demo / Error.
- Public source labels are Real / Demo.

## Required API behavior

- `/api/history` and `/api/kick-history` accept `period=7d`, `period=30d`, or a valid `from` / `to` range up to 90 days.
- Both APIs accept `metric=viewer_minutes|peak_viewers`.
- Both APIs compare the selected range with the immediately preceding equal-length range.
- Invalid custom ranges return HTTP 400.
- A zero or insufficient previous baseline is returned as `new` or `insufficient`, not an unbounded percentage.
- Summary includes Total observed, Peak day by viewer-minutes, Top streamer, Biggest rise when comparable, and Coverage quality.
- Daily payloads include top streamers and the information required by Selected day and Daily archive.
- Raw snapshot fallback applies observed-interval weighting capped at five minutes.
- Twitch and Kick history remain separate.

A future change that restores a fixed `period=30d` fetch, static SVG-only History charts, unexplained percentage explosions, or `Stream A` demo rows is a regression.
