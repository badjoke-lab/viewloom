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

The initial one-time package redeployed only the canonical normal Kick collector configuration:

```text
workers/collector-kick/wrangler.toml
```

That configuration kept:

- service: `viewloom-collector-kick`;
- cron: `*/5 * * * *`;
- normal entrypoint: `src/entry.ts`;
- D1 binding: `vl_kick_hot`;
- intraday generation enabled;
- permanent category capture flag absent;
- canary bindings absent.

The redeploy alone did not restore snapshots. PR #576 then repaired the active collector path by:

- accepting official Kick rows with nested `channel.slug` and channel display-name fields;
- logging scheduled collection lifecycle events;
- writing an explicit `empty-scheduled-observation` row only when a successful scheduled run writes no current observation;
- protecting real cross-minute writes from being replaced by a synthetic empty row.

## Recovery completed

PR #576 merged as `4c0e9afeadda9c443d83594648cdf1ea7079cf00`.

Read-only production evidence then confirmed:

- `2026-07-16T02:35:00.000Z`: 100 streams, 655,000 viewers, source `authenticated`;
- `2026-07-16T02:50:00.000Z`: 100 streams, 659,200 viewers, source `authenticated`;
- both acceptance reads completed on the first polling attempt;
- bounded tail from `02:40:05Z` to `02:47:05Z` observed five scheduled events;
- exceptions observed: `0`;
- provider leakage rows: `0`;
- category canary bindings: absent;
- permanent `CATEGORY_CAPTURE_ENABLED`: absent;
- Twitch changes: none.

The normal collector recovery outcome is accepted.

## Hard boundary

This recovery did not:

- start category capture;
- start Twitch work;
- execute a remote migration;
- call the manual `/collect` route;
- run a backfill;
- change retention;
- change category analytics UI;
- permit cross-provider category identity or combined rankings.

All post-repair D1 writes came from the normal scheduled collector path.

## Retirement

The one-time recovery workflow is retired.

- the main-branch push trigger is removed;
- the production recovery job is removed;
- the trigger is marked `retired` and `consumed`;
- future normal collector changes must use the canonical collector deployment workflow;
- any future category canary requires a new explicit trigger and a fresh read-only preflight.
