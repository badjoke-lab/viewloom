# Day Flow QA Contract

This contract defines production acceptance for ViewLoom Day Flow on Twitch and Kick.

## Data and controls

- Today / Yesterday / Date / Rolling 24h update the API range.
- 5m / 10m update the API bucket and redraw the chart.
- Top 10 / 20 / 50 update the requested and rendered count. A hidden 12-band limit is not allowed.
- Volume / Share update chart geometry. API share values are 0–1, while UI percentages use share multiplied by 100.
- Full / Top Focus are separate scopes. Full includes Others and keeps global totals. Top Focus excludes Others from the scale and recalculates share inside Top N.
- Today and Rolling 24h may auto-update. Yesterday and Date do not auto-update.

## Controller ownership

- Each provider page loads exactly one Day Flow feature entry: `day-flow-current-shell-entry.ts`.
- The primary controller owns the feature request, state, controls, URL synchronization, auto-update, rendering, and degraded states.
- `day-flow-layout-summary.ts` is a pure layout and summary helper. It does not fetch, observe DOM mutations, install event listeners, or schedule updates.
- Enhanced summary rendering consumes the payload already held by the primary controller; it does not issue a second feature request.
- Layout-only changes do not request feature data again.
- Twitch and Kick retain separate routes and API endpoints.

## Layout

- Desktop defaults to Wide.
- Split keeps the chart on the left and stacks Time Focus plus Selected streamer on the right.
- Wide keeps the chart full width and places Time Focus plus Selected streamer below it.
- Split / Wide are user-selectable, persisted per provider, and represented by the `layout` URL parameter after explicit user selection.
- Old `layout=theater` and stored `theater` values are interpreted as Wide.
- At tablet and mobile widths the effective presentation collapses to Wide while retaining the requested layout state.

## Chart behavior

- Bucket positions use actual ISO timestamps and the API window.
- Pointer click, pointer drag and touch scrubbing select the nearest bucket.
- Every polygon has a streamer identifier and supports band selection.
- Selected bands are outlined. Highlight only and Show all bands control dimming.
- User-facing time labels are formatted UTC values, not raw ISO strings.
- Start, End, Peak, Rise, and available Heat markers come from the selected band. Heat is not shown when activity is unavailable.

## Time Focus and detail

- Time Focus is computed from selected bucket values in `payload.bands[].buckets[index]`.
- Time Focus shows the selected bucket Top 5 with viewers, global share, gap, previous-bucket change, previous rank movement, and a mini bar.
- `detailPanelSource.streamers` supplies metadata only and is joined by streamer ID.
- Selected streamer detail includes title, selected viewers, global share, peak, average, viewer-minutes, peak share, biggest rise, first seen, last seen, and activity availability.
- Open stream, Open in Battle Lines, Highlight only, and Show all bands remain functional.

## Day summary

- Day summary is not limited to four streamer names.
- It includes field peak and time, average field size, total viewer-minutes, longest consecutive lead, lead changes, biggest rise, biggest drop, and peak global share.
- It includes a Top 5 viewer-minutes ranking for the current Top N.
- It includes a short day reading derived from observed field scale, leadership changes, and bucket movement.
- Summary calculations use observed bucket data and do not invent activity values.

## State and responsive behavior

- Loading, Empty, Partial, Stale, Error, and observed states update chart, Time Focus, detail, summary, and coverage consistently.
- Complete coverage uses a short observed/total bucket summary. Provider-internal DB and collector metadata are not shown in normal UI.
- Long names and Japanese names truncate without breaking layout and remain available through title text.
- Mobile uses the same data and supports tap and horizontal scrubbing.
- URL state includes layout when explicitly selected, metric, scope, top, bucket, rangeMode, date when applicable, time, streamer, and auto.

## Verification gates

- Twitch and Kick pages pass the same source checks.
- QA includes executable fixtures for share scaling, Full totals, Top Focus normalization, timestamp selection, selected bucket values, Top 50 count, Wide default, legacy Theater compatibility, and summary calculations.
- Browser acceptance verifies one initial Day Flow request, no cross-provider request, no layout-only refetch, enhanced summary rendering from the primary payload, mobile Wide fallback, and native global function identities.
- Web build, Web checks, Web verification, retained U10D acceptance, and U10G architecture acceptance must all pass before merge.
- Static SVG-only rendering, text-presence-only QA, raw ISO labels, missing Others, fixed zero Time Focus values, missing layout controls, a four-cell-only Day summary, duplicate feature entries, or a second summary request are regressions.
