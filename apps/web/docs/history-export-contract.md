# ViewLoom History export contract

History export is a provider-specific client-side export of the History response already loaded by the page.

## Scope

The control appears on `/twitch/history/` and `/kick/history/`.

It must:

- reuse the current History response without another API request;
- provide CSV daily rows and structured JSON;
- include provider, UTC period, selected metric, source state, coverage, daily rows, and retained top-streamer rows;
- add explicit missing rows for absent dates inside the returned period;
- treat `coverageState: missing` as unobserved;
- keep unavailable values blank in CSV and `null` in JSON;
- keep Twitch and Kick data and filenames separate;
- export at most 186 UTC days;
- use filenames containing provider and UTC period;
- quote and neutralize text cells that spreadsheet software could interpret as commands.

## CSV columns

`provider`, `day`, `coverage_state`, `viewer_minutes`, `peak_viewers`, `peak_streamer`, `observed_stream_count`, `observed_minutes`.

## Truth rules

- Missing days are never converted to zero activity.
- Values describe observed ViewLoom data and are not provider-wide totals.
- Demo and partial states remain present.
- Exporting does not imply official Twitch or Kick affiliation.
- Exporting does not make another History API request.

## Non-goals

No database, collector, cron, binding, API-route, server-storage, publishing, cross-provider-total, or Cloudflare configuration change.
