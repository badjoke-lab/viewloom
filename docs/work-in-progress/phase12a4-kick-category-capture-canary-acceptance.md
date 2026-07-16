# Phase 12A-4-11 — Kick category capture canary read-only acceptance attempt 3

## Purpose

Validate the active Kick-only category capture canary without changing production state.

This gate follows:

- accepted Kick canary package PR #562;
- accepted dormant execution package PR #563;
- recorded execution merge identity PR #564;
- canonical gate advancement PR #566;
- normal collector repair PR #576;
- one-time recovery retirement PR #577;
- failed no-deploy attempt 2 trigger PR #578;
- execution-path repair PR #580, merged as `654543c46713c327a76f6ff7e61feeea97231982`;
- exact one-file attempt 3 trigger PR #581, merged as `952716ee71ff9b15aae8771803ee8350cd8b917f`.

## Read-only checks

The pull-request workflow reads only:

- the exact attempt 3 trigger and accepted package identities;
- the production Kick Worker settings through Cloudflare `GET`;
- current Kick D1 size through Cloudflare `GET`;
- aggregate `SELECT` results from the Kick D1 database.

The probe is bounded and may poll while the start workflow deploys the canary and the first scheduled category-bearing snapshot is written.

The evidence verifies:

- the trigger is inside its 24-hour active window;
- the production Kick Worker exposes the exact bounded attempt 3 canary bindings;
- the permanent `CATEGORY_CAPTURE_ENABLED` binding is absent;
- projected 90-day storage remains at or below 330 MB;
- projected provider headroom remains at or above 100 MB;
- Kick category dictionary rows exist;
- category-bearing Kick snapshot rows exist;
- provider leakage remains zero;
- the latest Kick minute snapshot exists and remains within the accepted freshness threshold;
- Twitch has not been authorized or started.

Kick production health is derived from the latest `minute_snapshots` row. The Kick database does not require Twitch's `collector_status` table.

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

The generated evidence artifact is accepted only when all read-only gates pass. A failure remains diagnostic: it must not deploy, roll back, mutate the trigger, or write production data.

After initial acceptance, the scheduled execution workflow continues hourly read-only checkpoints and performs the bounded final rollback at expiry. A separate permanent evidence PR is required before any Twitch canary decision.
