# Phase 12A-4 — Kick normal collector recovery read-only acceptance

## Purpose

Confirm that recovery PR #573 restored the canonical normal Kick collector before any new category canary attempt is considered.

The incident baseline is fixed at:

- latest bucket: `2026-07-15T11:50:00.000Z`;
- latest collection: `2026-07-15T11:50:40.703Z`;
- normal collection was 137.17 minutes stale at the failed attempt 1 acceptance read.

## Read-only checks

This pull request reads only:

- production Kick Worker settings through Cloudflare `GET`;
- the latest normal Kick snapshot through D1 `SELECT`;
- provider leakage count through D1 `SELECT`.

Acceptance requires:

- the failed category canary trigger remains absent;
- a latest normal Kick snapshot exists;
- that snapshot is newer than the incident snapshot;
- the snapshot is no more than 10 minutes old at observation time;
- all category canary bindings remain absent;
- the permanent `CATEGORY_CAPTURE_ENABLED` binding remains absent;
- provider leakage remains zero.

## Hard boundary

This acceptance does not deploy a Worker, change Worker settings, call `/collect`, execute a migration, write D1 rows, run a backfill, change retention, start category capture, or change Twitch.

Twitch remains unchanged and blocked from category canary work.

## Next gate

One accepted fresh snapshot proves the recovery action worked. At least one additional normal five-minute snapshot must then be confirmed before a new category canary trigger is issued.
