# 12A-4-17 Twitch category capture bounded canary observation

## Status

Attempt 2 started successfully after the exact start boundary and a fresh read-only production preflight. The bounded Twitch-only category canary is active for the accepted window from `2026-07-18T02:30:00.000Z` through `2026-07-19T02:30:00.000Z`.

Permanent category capture remains unauthorized. Kick is unchanged. The next gate is bounded observation followed by expiry finalization and rollback verification.

## Accepted attempt 2 start evidence

- source SHA: `21b62f250a1ddb6952623d718ca27ebc11f83c1d`;
- workflow run: `29625794630`;
- start job: `88029850124`;
- artifact: `8424232005` / `analytics-12a4-twitch-category-canary-start-attempt-2`;
- artifact size: `2338` bytes;
- artifact digest: `sha256:039e1d260473f5aa72b67eac119b8175e2d9d9be9676c822d0021989e584b038`;
- execution outcome: `started`;
- canary deployment exit code: `0`.

The artifact contains exactly two sanitized JSON evidence files:

- `fresh-storage-preflight.json`;
- `evidence-start-attempt-2.json`.

It contains no credentials, channel identities, or raw payload rows.

## Verified mandatory ordering

The start job completed in the required order:

1. exact trigger inspection;
2. exact start-boundary wait;
3. ephemeral read-only request creation;
4. fresh Cloudflare `GET` / D1 `SELECT` preflight;
5. bounded Twitch canary deployment;
6. sanitized evidence upload.

The exact timestamps prove the ordering:

- boundary reached: `2026-07-18T02:30:01.978Z`;
- fresh preflight observed: `2026-07-18T02:30:02.030Z`;
- deployment evidence observed: `2026-07-18T02:30:19.053Z`.

## Fresh read-only preflight acceptance

The fresh preflight outcome was `accepted_candidate` with digest `sha256:2ad41e149c2ded1f95148f44c6cb6ea6b4a55fce7d54bce373414e1ea2b5de49`.

All required gates passed:

- provider storage: pass;
- account-wide storage: pass;
- required schema: pass;
- provider leakage: `0` rows, pass;
- canary/permanent binding absence before deployment: pass;
- latest normal Twitch snapshot: present, authenticated, non-empty, and fresh, pass;
- all read-only gates: pass.

Storage evidence at the boundary:

- Twitch current size: `319.8 MB`;
- projected Twitch 90-day size: `368.12 MB`;
- projected Twitch headroom: `81.88 MB`;
- account current size: `3672.69 MB`;
- projected account-wide headroom: `886.99 MB`.

The preflight performed no production mutation, created no trigger, and started no runtime capture by itself.

## Bounded deployment state

The post-deploy service identity remained:

- service: `viewloom-collector-twitch`;
- database: `b77221fe-80a3-4749-bc0e-d3ad54003dcf`;
- cadence: `*/5 * * * *`.

Only the temporary canary bindings were added:

- enabled: `true`;
- provider: `twitch`;
- started at: `2026-07-18T02:30:00.000Z`;
- until: `2026-07-19T02:30:00.000Z`;
- attempt: `2`.

The direct permanent `CATEGORY_CAPTURE_ENABLED` flag remains absent. No rollback was required at start.

## Attempt 1 safe cancellation

Attempt 1 used trigger PR #604 and main SHA `62d24460d4250aca89c72916d9fade42c09f9503`.

- workflow run: `29624622275`;
- start job: `88026455393`;
- artifact: `8423630417`;
- conclusion: cancelled before deployment.

Its fresh preflight occurred before the scheduled wait, so the run was cancelled while waiting. The artifact contains preflight evidence only and proves that no Worker deployment, D1 mutation, or runtime category capture occurred.

PR #609 corrected the order before attempt 2 was armed by PR #610.

## Hard boundaries

This acceptance does not authorize:

- production runtime capture beyond the exact canary window;
- permanent category enablement;
- Kick category capture or Kick configuration changes;
- cadence or retention changes;
- backfill;
- category analytics UI;
- cross-provider category identity, totals, or rankings.

## Next gate

Observe the bounded Twitch canary through the accepted window. Final acceptance requires exact workflow/job/artifact evidence for:

- provider leakage remaining zero;
- category capture limited to Twitch;
- normal snapshot health and cadence remaining intact;
- bounded storage and execution behavior;
- automatic expiry and removal of temporary canary bindings;
- no category payload after the accepted expiry grace boundary;
- permanent category enablement remaining absent;
- Kick remaining unchanged.
