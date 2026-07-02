# Battle Lines QA Contract

This document records the production contract for the completed Battle Lines view.

## Page and controller contract

- Twitch and Kick use the same rivalry workspace behavior while retaining separate routes and API endpoints.
- Each provider page loads exactly one Battle Lines feature entry: `battle-lines-current-shell-entry.ts`.
- The primary controller owns request state, timeout, controls, date visibility, selected battle, selected stream, selected time, URL synchronization, layout invocation, degraded states, and auto-refresh.
- `battle-lines-layout.ts` is an explicitly invoked layout/render helper. It does not fetch, replace history methods, observe mutations, or own an independent battle selection.
- `battle-lines-deep-link-bridge.ts` is a pure compatibility helper. It reads legacy `point`, resolves selected time, and never replaces `URLSearchParams.prototype.get` or `history.replaceState`.
- The retired loading guard must not exist. Request timeout and error rendering are owned by the primary controller.
- No feature coordination code may replace `window.fetch`, `history.replaceState`, or `URLSearchParams.prototype.get`.
- No feature-wide MutationObserver may be used as primary state management.

## Layout contract

- Wide is the default layout.
- Split is an optional desktop layout, not the obsolete narrow chart plus empty right-side shell.
- `layout=wide` and `layout=split` are valid URL states. Any other or legacy value resolves to Wide.
- Split is disabled below 1180px and the effective layout becomes Wide on tablet and mobile.
- Responsive fallback must preserve the requested layout state; it changes only the effective presentation.
- Changing Wide / Split must not refetch Battle Lines data or reset date, metric, Top N, bucket, selected battle, selected stream, selected time, Recommended/manual state, or follow-latest state.
- Wide keeps the chart at full available width and places the complete Time Inspector below it.
- Split keeps a usable chart on the left and a sticky inspector rail on the right.
- The Split rail shows the selected battle, selected time, pair values, selected stream, Top-at-time ranking, Data API state, and at most three recent battle events.
- Reversal strip, Secondary battles, full Battle feed, and Coverage remain below the chart/rail workspace in both layouts.
- The page exposes Today, Yesterday, Date, Viewers, Indexed, Top 3 / 5 / 10, 5m / 10m, Wide / Split, Back to recommended, Jump to latest, and Refresh controls.

## Deep-link contract

- New canonical links use the selected UTC bucket `time` value.
- Legacy non-negative integer `point` values remain readable.
- Once payload timeline data is available, legacy `point` resolves to one selected bucket and the canonical URL retains `time` while removing `point`.
- Direct `time` and equivalent legacy `point` links resolve to the same selected bucket.
- Layout-only changes preserve canonical selected time and do not request feature data.

## Data and chart contract

- Twitch uses `/api/battle-lines`; Kick uses `/api/kick-battle-lines`.
- Every line uses the same shared UTC bucket timeline.
- Missing, offline, and not-observed points are not connected into visible battle lines.
- Indexed mode uses each line's selected-day peak as 100.
- The chart shows numerical Y-axis labels, UTC X-axis labels, a selected-time cursor, Primary-pair emphasis, context-line dimming, and a gap band.
- Click, pointer drag, touch/pointer scrubbing, Arrow Left / Arrow Right, Home, and End change the inspected bucket.
- A feature request is aborted after 12 seconds and the primary controller renders an explicit unavailable state with a Refresh recovery path.

## Analysis contract

- The Primary battle summary exposes the selected pair, leader, gap, gap trend, latest reversal, reversal count, and score.
- The Time Inspector exposes both pair values, observation states, bucket deltas, selected-time leader/gap/trend, and ranking context.
- The Reversal strip identifies who passed whom, shows the gap before and after, and jumps to the observed lead change.
- Secondary battles are selectable without changing the inspected time, and the selected card is visibly active.
- The feed shows at most five distinct observed events and never fabricates an `observed` event when no reversal exists.
- Manual battle selection and historical inspection are not stolen by Today auto-refresh.

## Responsive and state contract

- Mobile reduces context lines and markers rather than merely shrinking the desktop workspace.
- Mobile and tablet use effective Wide only; the Split rail is not rendered as a stacked duplicate.
- Live, partial, stale, empty, demo, and error states remain distinguishable.
- Data API state and Collector health are separate signals and are labeled separately.
- Coverage states observed and expected bucket counts, discloses unavailable selected-bucket streams, and discloses that activity / heat is unavailable when it is not scored.

## Verification gates

- Twitch and Kick pass the same source checks.
- Browser acceptance verifies one initial feature request, zero provider crossing, no layout-only refetch, direct `time`, legacy `point` normalization, canonical `point` removal, responsive Wide fallback, requested-layout retention, and native global function identities.
- Web build, Web checks, Web verification, retained U10D acceptance, and U10G architecture acceptance must pass before merge.
- Restoring independent feature entries, global interception, MutationObserver coordination, a static SVG-only chart, reconnected gaps, missing selected-time inspection, or an obsolete empty Split shell is a regression.
