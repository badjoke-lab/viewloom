# ViewLoom History report text contract

History report text and period highlights are provider-specific summaries of the History response already loaded by the page.

## Public scope

The controls appear on both History pages:

```text
/twitch/history/
/kick/history/
```

They must:

- reuse the current History response and current URL state;
- summarize the selected period and metric;
- identify observed, missing, and attention-needed UTC days;
- include total observed viewer-minutes, peak, top streamer, and biggest rise only when available;
- label real, demo, partial, and unavailable states honestly;
- state that the figures are observed ViewLoom data and are not provider-wide totals;
- keep Twitch and Kick text, endpoints, names, and links separate;
- support keyboard, touch, and clipboard fallback behavior;
- open the native device share sheet when supported without another History API request;
- hide the native share action when the browser does not expose the Web Share API;
- render a readable preview before copying or sharing;
- provide both a full report and a compact short-post mode.

## Period highlights

The `Period highlights` surface must:

- derive all cards from the same provider-specific History payload used by the report;
- show the highest day for the active metric only when a valid observed day and positive value exist;
- show the top streamer for the active metric only when the returned payload contains a name;
- show the biggest rise only for viewer-minutes mode and only when the returned summary supports it;
- show observed, missing, and partial-or-stale UTC day counts without inferring absent values;
- omit unsupported facts rather than creating placeholder claims;
- link an exact highlighted day only to the same provider's Day Flow and Battle Lines pages;
- expose a clean link to the same provider, period, and metric while dropping selected-day and ranking UI state;
- refresh after a period or metric change without another request beyond the provider-specific History refresh already required by that user action;
- never present Twitch/Kick combined events, totals, leaders, or links.

The surface is a retained-period highlight feed. It does not claim minute-level event times when the History response only supports a UTC day.

## Short-post mode

Short-post mode must:

- use the same provider-specific History payload as the full report;
- include the period, observed-day coverage, and provider limitation;
- include top streamer, peak, and biggest rise only when available;
- retain only `period`, `from`, `to`, and `metric` query parameters in its share URL;
- omit selected-day, ranking-sort, and ranking-limit state;
- remain at or below 280 Unicode code points;
- switch, copy, and share without another History API request.

## Truth rules

- A daily row with `coverageState: missing` is not an observed day.
- A date absent from the returned daily rows is missing when it lies inside the returned UTC period.
- Missing or unavailable values are omitted or described as unavailable; they are never inferred as zero.
- Partial, poor, demo, and in-progress coverage remains visible in copied, shared, and highlighted output.
- The full report link reflects the current provider-specific History view.
- The short-post and Period highlights links reflect the current period and metric without unrelated UI state.
- Copying, native sharing, switching text mode, or rendering Period highlights must not make another API request.
- Cancelling the device share sheet is not treated as a data or application error.

## Non-goals

This feature does not add or change:

- database tables or migrations;
- collectors, cron schedules, retention, or bindings;
- History API routes or query volume;
- image or social-card generation;
- automated publishing;
- Twitch/Kick combined totals or comparisons;
- category capture, category semantics, or hidden category UI;
- Cloudflare deployment configuration.
