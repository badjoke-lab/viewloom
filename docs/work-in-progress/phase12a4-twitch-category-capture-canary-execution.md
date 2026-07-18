# 12A-4-16 Twitch category capture canary execution with inline fresh preflight

## Status

Accepted dormant execution package under amendment. No Twitch trigger exists and no production category capture is active.

The package remains provider-separated and uses the previously accepted Twitch package PR #590, execution package PR #591, and accepted baseline storage evidence PR #599.

## Change in start gating

The accepted baseline evidence remains pinned by exact PR, merge SHA, observation timestamp, and evidence digest. It proves that the read-only observation path, schema checks, provider separation, binding checks, snapshot checks, storage projection, and evidence sanitization were accepted.

The baseline observation age no longer decides whether a later start may proceed. Instead, the exact trigger start job must run a fresh read-only preflight immediately before any Worker deployment.

The fresh read-only preflight uses only:

- Cloudflare `GET` requests;
- D1 `SELECT` statements.

It uses an ephemeral request created inside the GitHub Actions job. The request is not committed to the repository and authorizes no deployment, D1 mutation, trigger creation, or permanent runtime capture.

## Mandatory order

The start job order is fixed:

1. inspect the exact one-file Twitch trigger and accepted package identities;
2. create the ephemeral read-only request;
3. run the accepted storage-preflight runner against current production state;
4. require all fresh read-only gates to pass;
5. copy the sanitized fresh evidence into the start artifact;
6. only then run the bounded Twitch canary deployment.

A fresh preflight failure stops the job before any Worker deployment.

## Fresh production checks

Immediately before deployment the preflight verifies:

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

The exact trigger still requires:

- provider `twitch`;
- positive attempt number;
- accepted package PR #590 and merge SHA;
- accepted execution package PR #591 and merge SHA;
- accepted baseline storage-preflight PR #599 and merge SHA;
- exact baseline observation timestamp and evidence digest;
- a 23-25 hour window;
- confirmation `RUN_TWITCH_CATEGORY_CAPTURE_CANARY`.

The wrapper disables category capture at the exact `until` timestamp. The monitor/finalizer runs every two hours, so binding cleanup and the normal-config rollback may occur up to two hours after exact capture expiry. Final acceptance must verify no payload after the expiry grace boundary.

## Hard boundaries

This amendment does not:

- create the Twitch trigger;
- contact production from a pull request;
- deploy a Worker from a pull request;
- mutate D1;
- change normal Twitch configuration;
- change Kick;
- change cadence or retention;
- backfill data;
- authorize permanent category capture;
- authorize cross-provider identity or combined rankings.

The next gate is a separate exact one-file Twitch trigger. Its main-branch start job must pass the fresh read-only preflight before any Worker deployment.
