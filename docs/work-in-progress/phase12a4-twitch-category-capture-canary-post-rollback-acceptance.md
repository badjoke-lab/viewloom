# 12A-4-18 Twitch category capture canary post-rollback read-only acceptance

## Purpose

Freeze a final sanitized proof that the bounded Twitch category canary ended, the normal Twitch configuration was restored, all exact canary bindings disappeared, permanent category capture was not enabled, and normal five-minute Twitch snapshots continued after expiry.

The scheduled finalizer already completed successfully in workflow run `29677847983`, job `88168491392`, artifact `8439540426`. That artifact proves rollback deployment and binding removal, but its category count is lifetime-wide. This independent read-only gate adds the missing time-bounded proof that no category-bearing snapshot was written after the ten-minute post-expiry grace boundary.

## Execution model

The package performs production observation only after the exact attempt-3 window has expired. The post-expiry probe is strictly read-only:

- Cloudflare API: `GET` only
- D1: aggregate and latest-row `SELECT` only
- Worker deployment or rollback: none
- Trigger or canonical gate mutation: none
- Kick change: none
- Permanent category enablement: none

## Required final evidence

Acceptance requires all of the following:

1. the exact attempt-3 trigger window has expired;
2. all bounded Twitch canary bindings are absent;
3. no direct permanent `CATEGORY_CAPTURE_ENABLED` binding exists;
4. the required Twitch D1 category tables remain present;
5. Twitch dictionary rows and category-bearing snapshots inside the bounded window remain present;
6. provider leakage remains zero across dictionary, snapshot, and rollup tables;
7. no category-bearing snapshot exists after the ten-minute post-expiry grace boundary;
8. a fresh, real, non-empty normal Twitch snapshot exists after expiry;
9. projected Twitch and account-wide D1 storage remain inside the accepted limits.

## Operational sequence

This package does not repeat the successful finalizer rollback. It only polls the resulting normal state and D1 evidence. After a successful artifact is frozen, a separate closeout change must advance the canonical gate, retire the consumed Twitch trigger and temporary production workflows, close stale attempt-2 acceptance PR #612, and close Issue #519. Permanent category capture remains a separate decision and is not authorized here.
