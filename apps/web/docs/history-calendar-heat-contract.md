# ViewLoom History calendar heat contract

History calendar heat is a bounded, provider-specific view of the daily rows already returned by the existing History endpoint.

## Public scope

The calendar appears on both History pages:

```text
/twitch/history/
/kick/history/
```

It must:

- use the current History period and metric;
- render one UTC calendar cell for each day in the returned period;
- use `viewer_minutes` or `peak_viewers` from the existing daily payload;
- preserve `good`, `partial`, `poor`, `missing`, `demo`, and in-progress coverage labels;
- make missing dates visibly different from observed zero values;
- allow an observed day to select the existing History chart/day inspector;
- support mouse, touch, keyboard, desktop, and mobile layouts;
- keep Twitch and Kick endpoints and links separate;
- render at most 186 UTC days.

## Truth rules

- Heat intensity is relative only to the currently displayed period and metric.
- A darker cell does not claim provider-wide completeness.
- Partial or poor coverage remains visibly marked.
- Missing dates have no inferred metric value and are not selectable.
- The current in-progress day may appear, but it must retain its returned coverage state.
- The feature must not make another browser request. It reuses the existing History response.

## Non-goals

This feature does not add or change:

- database tables or migrations;
- collectors, cron schedules, retention, or bindings;
- History API routes or query volume;
- Cloudflare deployment configuration;
- Twitch/Kick combined totals or comparison.
