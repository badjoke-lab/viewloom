# Phase 12A-2 remote schema probe

Status: active read-only production evidence path
Branch: `work-analytics-12a2-remote-schema-probe`

## Purpose

Determine whether the accepted intraday schema exists in the remote Twitch and Kick D1 databases without performing migration or writes.

## Probe

```text
GET /api/schema-audit
```

For each provider separately, one `sqlite_master` query checks:

```text
streamer_intraday_rollups table
idx_intraday_streamer_day index
intraday_rollup_status table
```

The endpoint returns presence and definition-match booleans, not raw SQL definitions.

## Boundaries

```text
migration apply no
writes no
backfill no
generation no
retention change no
new cron no
```

After production deployment, freeze observed provider-separated evidence before changing the remote-schema blocker state.
