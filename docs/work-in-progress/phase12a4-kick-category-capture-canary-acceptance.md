# Phase 12A-4-11 — Kick category capture canary read-only acceptance

## Purpose

Validate the active Kick-only category capture canary without changing production state.

This gate follows:

- accepted Kick canary package PR #562;
- accepted dormant execution package PR #563;
- recorded execution merge identity PR #564;
- canonical gate advancement PR #566;
- exact one-file trigger PR #568, merged as `1b6d5750a04b6f70bad7e00f31843898573d006a`.

## Read-only checks

The pull-request workflow reads only:

- the exact trigger and accepted package identities;
- the production Kick Worker settings through Cloudflare `GET`;
- current Kick D1 size through Cloudflare `GET`;
- aggregate `SELECT` results from the Kick D1 database.

The evidence verifies:

- the trigger is inside its 24-hour active window;
- the production Kick Worker exposes the exact bounded canary bindings;
- the permanent `CATEGORY_CAPTURE_ENABLED` binding is absent;
- projected 90-day storage remains at or below 330 MB;
- projected provider headroom remains at or above 100 MB;
- Kick category dictionary rows exist;
- category-bearing Kick snapshot rows exist;
- provider leakage remains zero;
- collector health remains acceptable;
- Twitch has not been authorized or started.

## Hard boundary

This PR does not:

- deploy or delete a Worker;
- modify Worker settings;
- execute a migration;
- write D1 rows;
- change collector cadence;
- run a backfill;
- change retention;
- add category analytics UI;
- start Twitch category capture;
- permit cross-provider category identity or combined rankings.

## Acceptance

The generated evidence artifact is accepted only when all read-only gates pass. A failure must remain diagnostic: it must not deploy, roll back, mutate the trigger, or write production data.

After initial acceptance, the existing scheduled execution workflow continues hourly read-only checkpoints and performs the bounded final rollback at expiry. A separate permanent evidence PR is required before any Twitch canary decision.
