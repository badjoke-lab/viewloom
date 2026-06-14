# Battle Lines QA Contract

This document records the production contract for the completed Battle Lines view.

## Page contract

- Twitch and Kick must use the same rivalry workspace and the same layout behavior.
- Wide is the default layout.
- Split is an optional desktop layout, not the obsolete narrow chart plus empty right-side shell.
- `layout=wide` and `layout=split` are valid URL states. Legacy `layout=theater` is interpreted as Wide.
- Split is disabled below 1180px and the effective layout becomes Wide on tablet and mobile.
- Changing Wide / Split must not refetch Battle Lines data or reset date, metric, Top N, bucket, selected battle, selected stream, selected time, Recommended/manual state, or follow-latest state.
- The page must expose Today, Yesterday, Date, Viewers, Indexed, Top 3 / 5 / 10, 5m / 10m, Wide / Split, Back to recommended, Jump to latest, and Refresh controls.
- The public pages must keep live slots for Primary battle, chart, Time Inspector, Reversal strip, Secondary battles, Battle feed, and coverage.

## Layout contract

- Wide keeps the chart at full available width and places the complete Time Inspector below it.
- Split keeps a usable chart on the left and a sticky inspector rail on the right.
- The Split rail must show the selected battle, selected time, pair values, leader/gap/trend context, selected stream, Top-at-time ranking, Data API state, and at most three recent battle events.
- Reversal strip, Secondary battles, full Battle feed, and Coverage remain below the chart/rail workspace in both layouts.
- The Split rail is derived from the same rendered state as Wide and must not maintain a second independent battle selection.

## Data and chart contract

- Twitch uses `/api/battle-lines`; Kick uses `/api/kick-battle-lines`.
- Every line must use the same shared UTC bucket timeline.
- Missing, offline, and not-observed points must not be connected into visible battle lines.
- Indexed mode must use each line's selected-day peak as 100.
- The chart must show numerical Y-axis labels, UTC X-axis labels, a selected-time cursor, Primary-pair emphasis, context-line dimming, and a gap band.
- Click, pointer drag, touch/pointer scrubbing, Arrow Left / Arrow Right, Home, and End must change the inspected bucket.

## Analysis contract

- The Primary battle summary must expose the selected pair, leader, gap, gap trend, latest reversal, reversal count, and score.
- The Time Inspector must expose both pair values, observation states, bucket deltas, selected-time leader/gap/trend, and ranking context.
- The Reversal strip must identify who passed whom, show the gap before and after, and jump to the observed lead change.
- Secondary battles must be selectable without changing the inspected time, and the selected card must be visibly active.
- The feed must show at most five distinct observed events and must never fabricate an `observed` event when no reversal exists.
- Manual battle selection and historical inspection must not be stolen by Today auto-refresh.

## Responsive and state contract

- Mobile must reduce context lines and markers rather than merely shrink the desktop workspace.
- Mobile and tablet use Wide only; the Split rail must not be rendered as a stacked duplicate.
- Live, partial, stale, empty, demo, and error states must remain distinguishable.
- Data API state and Collector health are separate signals and must be labeled separately.
- Coverage must state observed and expected bucket counts, disclose unavailable selected-bucket streams, and disclose that activity / heat is unavailable when it is not scored.
- A future change that restores a static SVG-only chart, deletes selected-time inspection, reconnects gaps, removes the Reversal strip or Secondary battles, or restores the obsolete empty Split shell is a regression.
