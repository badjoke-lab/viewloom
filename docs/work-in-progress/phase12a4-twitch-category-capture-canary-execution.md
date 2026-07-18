# 12A-4-16 Twitch category capture canary execution with start-boundary fresh preflight

## Status

Accepted dormant execution package with a start-order fix under review. Attempt 1 was cancelled before the scheduled boundary and before any Worker deployment.

The exact trigger currently records attempt 1, but its execution run is cancelled and no production category capture is active. A separate exact one-file update will arm attempt 2 only after this fix is accepted.

## Attempt 1 safe cancellation

Attempt 1 used trigger PR #604 and main SHA `62d24460d4250aca89c72916d9fade42c09f9503`.

The execution run was:

- workflow run `29624622275`;
- start job `88026455393`;
- artifact `8423630417`;
- artifact digest `sha256:13891b14e96a9efcfc13298e7579c653d271c27269e397389dcacf60f2787777`.

The fresh read-only preflight passed at `2026-07-18T01:09:16.159Z`, but the workflow then waited for the scheduled start inside the deployment runner. That ordering could make a previously fresh snapshot older than the 20-minute threshold by deployment time.

The run was cancelled while still waiting. The artifact contains `fresh-storage-preflight.json` only. It contains no start evidence, no successful deployment result, and no active binding evidence.

Confirmed boundaries:

- Worker deployment: no;
- runtime category capture: no;
- D1 mutation: no;
- permanent `CATEGORY_CAPTURE_ENABLED`: absent;
- Kick change: no.

## Corrected mandatory order

The start job order is now fixed:

1. inspect the exact one-file Twitch trigger and accepted package identities;
2. wait until the exact `startAt` boundary, with a maximum wait of three hours;
3. create the ephemeral read-only preflight request;
4. run the accepted storage-preflight runner against current production state;
5. require all fresh read-only gates to pass;
6. copy the sanitized fresh evidence into the start artifact;
7. only then deploy the bounded Twitch canary.

A wait failure or fresh-preflight failure stops the job before any Worker deployment.

## Accepted baseline and fresh production evidence

The accepted baseline evidence remains pinned by exact PR, merge SHA, observation timestamp, and evidence digest. It proves that the read-only observation path, schema checks, provider separation, binding checks, snapshot checks, storage projection, and evidence sanitization were accepted.

The deploy decision is made by a new same-job observation after the exact start boundary. It uses only:

- Cloudflare `GET` requests;
- D1 `SELECT` statements.

The ephemeral request is not committed and authorizes no deployment by itself, D1 mutation, trigger creation, or permanent runtime capture.

Immediately before deployment the fresh preflight verifies:

- exact Twitch Worker and D1 identity;
- normal five-minute cadence;
- current Twitch D1 size;
- current account-wide D1 total;
- projected Twitch 90-day size at or below `440 MB`;
- projected Twitch headroom at or above `10 MB`;
- projected account-wide headroom at or above `500 MB`;
- required category schema tables;
- provider leakage exactly `0`;
- temporary canary bindings absent;
- permanent direct `CATEGORY_CAPTURE_ENABLED` absent;
- latest normal Twitch snapshot fresh, authenticated, and non-empty.

## Bounded canary behavior

The exact trigger requires:

- provider `twitch`;
- positive attempt number;
- accepted package PR #590 and merge SHA;
- accepted execution package PR #591 and merge SHA;
- accepted baseline storage-preflight PR #599 and merge SHA;
- exact baseline observation timestamp and evidence digest;
- a 23-25 hour window;
- confirmation `RUN_TWITCH_CATEGORY_CAPTURE_CANARY`.

The wrapper disables category capture at the exact `until` timestamp. The monitor/finalizer runs every two hours, so binding cleanup and normal-config rollback may occur up to two hours after exact capture expiry. Final acceptance must verify no payload after the expiry grace boundary.

## Hard boundaries

This fix does not:

- change the trigger file;
- contact production from the pull request;
- deploy a Worker from the pull request;
- mutate D1;
- change normal Twitch configuration;
- change Kick;
- change cadence or retention;
- backfill data;
- authorize permanent category capture;
- authorize cross-provider identity or combined rankings.

The next gate is an exact one-file attempt 2 trigger. Its start job must reach the start boundary, pass the fresh read-only preflight, and only then deploy the bounded Twitch canary.

## Attempt 2 monitor failure and rollback

Attempt 2 started successfully after the exact start boundary and fresh read-only preflight. The first scheduled monitor run `29629390710` failed while parsing Wrangler D1 JSON output with `wrangler_json_output_missing`.

This was a monitor parser failure, not a storage or provider-separation failure. At the failure checkpoint:

- Twitch D1 was `320.45 MB`;
- projected 90-day Twitch size was `368.77 MB`;
- provider headroom was `81.23 MB`;
- account-wide headroom was `882.78 MB`;
- the attempt-2 bindings matched before inspection;
- the normal Twitch configuration rollback exited `0`;
- all canary bindings were absent after rollback;
- the permanent direct category flag remained absent;
- Kick remained unchanged.

Artifact `8424948287` with digest `sha256:cf2ff1038ea4f51ec7d378fcba9e0503090afefa2ac0f831931dfeee43d06ed8` records the failure and successful rollback. Runtime category capture is no longer active.

The focused fix separates Wrangler stdout from stderr and replaces the suffix parser with ANSI-tolerant balanced JSON extraction. Fixtures cover prefixes, ANSI sequences, trailing warnings, and missing JSON. A future attempt still requires a separate exact trigger and a fresh start-job read-only preflight.

