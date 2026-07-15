# Phase 12A-4 — Kick normal collector operational recovery

## Incident

Kick category canary attempt 1 was armed for 2026-07-15 22:30 JST, but read-only evidence showed that the normal Kick collector had already stopped producing snapshots before the canary window.

Observed read-only facts:

- latest Kick bucket: `2026-07-15T11:50:00.000Z`;
- latest collection: `2026-07-15T11:50:40.703Z`;
- observation: `2026-07-15T14:07:50.870Z`;
- staleness: `137.17` minutes;
- exact canary bindings: absent;
- category dictionary rows: `0`;
- category-bearing snapshot rows: `0`;
- provider leakage rows: `0`;
- storage: `287.70 MB` current, `309.71 MB` projected 90-day size, `140.29 MB` projected headroom.

Attempt 1 therefore never became a valid canary observation. Its trigger was removed by PR #572 before recovery work.

## Recovery action

This one-time package deploys only the canonical normal Kick collector configuration:

```text
workers/collector-kick/wrangler.toml
```

That configuration keeps:

- service: `viewloom-collector-kick`;
- cron: `*/5 * * * *`;
- normal entrypoint: `src/entry.ts`;
- D1 binding: `vl_kick_hot`;
- intraday generation enabled;
- permanent category capture flag absent;
- canary bindings absent.

After deployment, the workflow polls the Kick D1 database until a snapshot newer than the pre-deploy snapshot is observed or the bounded polling window ends.

## Success gates

Recovery succeeds only when:

- the one-time trigger is valid and unexpired;
- the normal Kick Worker deploy succeeds;
- no canary binding remains after deploy;
- `CATEGORY_CAPTURE_ENABLED` remains absent;
- a newer Kick snapshot appears after deployment;
- the new snapshot is no more than 10 minutes old;
- provider leakage remains zero.

## Hard boundary

This recovery does not:

- start category capture;
- start Twitch work;
- execute a remote migration;
- call the manual `/collect` route;
- run a backfill;
- change retention;
- change category analytics UI;
- permit cross-provider category identity or combined rankings.

The only production mutation is redeploying the already canonical normal Kick collector configuration. Any D1 write after deployment must come from the restored normal 5-minute cron.

## Next gate

After recovery, multiple consecutive normal Kick snapshots must be confirmed before a new category canary attempt is armed.
