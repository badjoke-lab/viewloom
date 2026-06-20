# ViewLoom History share card contract

The History share card is a provider-specific PNG generated in the browser from the History response already loaded by the page.

## Public scope

The share-card control appears on both History pages:

```text
/twitch/history/
/kick/history/
```

It must:

- reuse the current History response and selected metric;
- generate a 1200 × 630 PNG in the browser;
- identify the provider, UTC period, metric, top streamer, peak, and coverage when available;
- preserve missing and attention-needed day counts;
- state that the card uses observed ViewLoom data and is not provider-wide;
- keep Twitch and Kick text, filenames, endpoints, and links separate;
- show a responsive preview before download;
- support mouse, keyboard, and touch download controls;
- update when the History period or metric changes.

## Truth rules

- A daily row with `coverageState: missing` is not an observed day.
- Missing or unavailable values are described as unavailable; they are never inferred as zero.
- Partial, poor, demo, and in-progress coverage remains visible on the card.
- The card must not imply official Twitch or Kick affiliation.
- The card must not use Twitch or Kick logos.
- Rendering or downloading the card must not make another API request.
- The generated filename must contain only the current provider and UTC period.

## Non-goals

This feature does not add or change:

- database tables or migrations;
- collectors, cron schedules, retention, or bindings;
- History API routes or query volume;
- server-side image generation;
- automated publishing or social-network APIs;
- Twitch/Kick combined totals or comparisons;
- Cloudflare deployment configuration.
