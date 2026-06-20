# ViewLoom History report text contract

History report text is a provider-specific, plain-text summary of the History response already loaded by the page.

## Public scope

The report control appears on both History pages:

```text
/twitch/history/
/kick/history/
```

It must:

- reuse the current History response and current URL state;
- summarize the selected period and metric;
- identify observed, missing, and attention-needed UTC days;
- include total observed viewer-minutes, peak, top streamer, and biggest rise only when available;
- label real, demo, partial, and unavailable states honestly;
- state that the figures are observed ViewLoom data and are not provider-wide totals;
- keep Twitch and Kick text, endpoints, names, and links separate;
- support keyboard, touch, and clipboard fallback behavior;
- render a readable preview before copying;
- provide both a full report and a compact short-post mode.

## Short-post mode

Short-post mode must:

- use the same provider-specific History payload as the full report;
- include the period, observed-day coverage, and provider limitation;
- include top streamer, peak, and biggest rise only when available;
- retain only `period`, `from`, `to`, and `metric` query parameters in its share URL;
- omit selected-day, ranking-sort, and ranking-limit state;
- remain at or below 280 Unicode code points;
- switch and copy without another History API request.

## Truth rules

- A daily row with `coverageState: missing` is not an observed day.
- A date absent from the returned daily rows is missing when it lies inside the returned UTC period.
- Missing or unavailable values are omitted or described as unavailable; they are never inferred as zero.
- Partial, poor, demo, and in-progress coverage remains visible in copied text.
- The full report link reflects the current provider-specific History view.
- The short-post link reflects the current period and metric without unrelated UI state.
- Copying or switching text mode must not make another API request.

## Non-goals

This feature does not add or change:

- database tables or migrations;
- collectors, cron schedules, retention, or bindings;
- History API routes or query volume;
- image or social-card generation;
- automated publishing;
- Twitch/Kick combined totals or comparisons;
- Cloudflare deployment configuration.
