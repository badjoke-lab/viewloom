# 12A-4 Kick canary expiry binding cleanup

## Status

Accepted and retired.

The dormant cleanup package merged in PR #586 and the exact one-file trigger merged in PR #587. The canonical normal Kick configuration was redeployed, the expired attempt-3 canary bindings were removed, and the independent post-rollback read-only acceptance completed with final artifact `8399137444`.

## Incident and recovery evidence

The first post-rollback read-only attempt used run `29488056134`, job `87810458773`, artifact `8398761959`. It rejected one gate only:

- `canaryBindingsAbsent`: false

All other conditions had already passed. The recovery then deployed only:

```text
workers/collector-kick/wrangler.toml
```

The accepted final evidence observed:

- canary bindings: absent;
- permanent direct `CATEGORY_CAPTURE_ENABLED`: absent;
- latest normal Kick snapshot: authenticated and non-empty;
- streams: `100`;
- viewers: `239409`;
- category payload rows after the ten-minute grace boundary: `0`;
- provider leakage rows: `0`;
- projected 90-day size: `317.48 MB`;
- provider headroom: `132.52 MB`;
- Twitch changed: false.

## Retirement

The one-time cleanup trigger is `consumed_and_retired`.

The production cleanup workflow is retired:

- no push trigger;
- no production deployment job;
- no Cloudflare credential references;
- no trigger rearm path;
- normal Kick collector bundle validation remains dry-run only.

The cleanup runner remains in repository history but is no longer reachable from a production workflow.

## Boundary

This recovery did not:

- restart category capture;
- add a permanent category flag;
- modify Twitch;
- change collector cadence;
- call a manual collection endpoint;
- run a migration or backfill;
- change retention;
- alter application UI or cross-provider behavior.

Twitch remains blocked until the accepted final evidence is frozen in the canonical gate by a separate change.
