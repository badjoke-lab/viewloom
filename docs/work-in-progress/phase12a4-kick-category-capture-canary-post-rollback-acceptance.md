# 12A-4-12 Kick category capture canary post-rollback read-only acceptance

## Purpose

Freeze a final, sanitized proof that the bounded Kick category canary ended, the exact canary bindings were removed, permanent category capture was not enabled, and the normal Kick collector resumed fresh authenticated snapshots.

## Execution model

The package is safe to merge before the 24-hour observation expires. A pull-request run before `2026-07-17T03:45:00.000Z` records `not_ready`, performs no Cloudflare or D1 call, and exits successfully. After expiry, the same job can be re-run or manually dispatched.

The post-expiry probe is strictly read-only:

- Cloudflare API: `GET` only
- D1: aggregate and latest-row `SELECT` only
- Worker deployment: none
- Worker rollback: none
- Trigger or canonical gate mutation: none
- Twitch authorization remains false

## Required final evidence

Acceptance requires all of the following:

1. the exact attempt-3 trigger window has expired;
2. all bounded canary bindings are absent from the production Kick service;
3. no direct permanent `CATEGORY_CAPTURE_ENABLED` binding exists;
4. the required D1 tables remain present;
5. Kick category dictionary and bounded-window category payload evidence remain present;
6. provider leakage remains zero;
7. no category payload is written after the ten-minute post-expiry grace boundary;
8. a fresh authenticated, non-empty normal Kick snapshot exists after expiry;
9. the current D1 size remains inside the accepted 90-day projection and headroom limits.

## Operational sequence

The execution workflow finalizer is expected to run on its hourly schedule after the trigger expires and deploy the normal Kick configuration. This package does not perform or repeat that rollback. It polls only for the resulting normal state and normal Kick snapshot.

After a successful artifact is frozen, the next change is a separate canonical gate update. A Twitch canary is not authorized by this package.
