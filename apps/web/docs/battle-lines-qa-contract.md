# Battle Lines QA Contract

This document records the production contract for the completed Battle Lines view.

## Page contract

- Twitch and Kick must use the same Wide-first rivalry workspace.
- The obsolete narrow chart plus fixed right-side Split layout must not return.
- The page must expose Today, Yesterday, Date, Viewers, Indexed, Top 3 / 5 / 10, 5m / 10m, Back to recommended, Jump to latest, and Refresh controls.
- The public pages must keep live slots for Primary battle, chart, Time Inspector, Reversal strip, Secondary battles, Battle feed, and coverage.

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
- The Reversal strip must jump to observed lead changes.
- Secondary battles must be selectable without changing the inspected time.
- The feed must show at most five distinct observed events and must never fabricate an `observed` event when no reversal exists.
- Manual battle selection and historical inspection must not be stolen by Today auto-refresh.

## Responsive and state contract

- Mobile must reduce context lines and markers rather than merely shrink the desktop workspace.
- Live, partial, stale, empty, demo, and error states must remain distinguishable.
- Coverage must state observed and expected bucket counts and disclose that activity / heat is unavailable when it is not scored.
- A future change that restores a static SVG-only chart, deletes selected-time inspection, reconnects gaps, or removes the Reversal strip or Secondary battles is a regression.
