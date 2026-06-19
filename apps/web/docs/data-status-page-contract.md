# ViewLoom Data Status page contract

The public Data Status pages are provider-specific:

```text
/twitch/status/
/kick/status/
```

Each page reads exactly one provider status endpoint:

```text
/twitch/status/ -> /api/twitch-status
/kick/status/   -> /api/kick-status
```

The page must show:

- overall state and source mode;
- last successful collection and latest snapshot time;
- collector state and cadence;
- observed count and bounded coverage notes;
- the current state of Heatmap, Day Flow, Battle Lines, and History;
- provider-specific limitations;
- state definitions that distinguish real empty, partial, stale, demo, failing, error, and unconfigured states;
- sanitized debug details without credentials or raw stack traces.

Truth rules:

- Empty must not be presented as demo.
- Partial must not be presented as complete provider-wide coverage.
- Fixture rows must be labelled demo.
- Twitch and Kick storage, feature routes, coverage notes, and status endpoints remain separate.
- The UI must not call feature APIs to build the status matrix.
- Manual refresh may repeat the same provider status request but must not trigger collector or deployment operations.

This feature changes no database schema, collector, cron, retention rule, binding, or Cloudflare deployment configuration.
