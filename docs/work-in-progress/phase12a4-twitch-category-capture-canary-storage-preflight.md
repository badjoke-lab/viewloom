# 12A-4-15 Twitch category canary read-only storage preflight

## Status

Prepared one-time read-only observation package. The package PR itself does not contact production. The exact request runs only after merge to `main`.

## Purpose

Measure the current Twitch D1 and account-wide D1 storage state before any later Twitch category canary trigger can be considered.

The observation also verifies:

- exact Twitch Worker and D1 identity;
- normal five-minute cadence;
- required category schema tables;
- zero cross-provider rows in the Twitch database;
- absence of temporary canary bindings and direct permanent category flag;
- a fresh, authenticated, non-empty normal Twitch snapshot.

## Read-only boundary

The production observation is limited to:

- Cloudflare API `GET` requests;
- D1 `SELECT` statements.

It must not deploy or delete Workers, mutate Worker settings, apply migrations, write D1 rows, change runtime flags, create the Twitch trigger, start category capture, change cadence, alter retention, backfill data, or touch Kick.

## Storage gates

The runner calculates from current production state:

- current Twitch D1 size;
- projected Twitch 90-day size using `48.32 MB` incremental safety;
- projected Twitch headroom against the `450 MB` operational ceiling;
- current account-wide D1 total;
- projected account-wide headroom against the `4608 MB` operational ceiling.

Acceptance thresholds:

- projected Twitch 90-day size at or below `440 MB`;
- projected Twitch headroom at or above `10 MB`;
- projected account-wide headroom at or above `500 MB`;
- provider leakage exactly `0`;
- latest normal snapshot no older than `20 minutes`;
- latest normal snapshot authenticated and non-empty;
- all canary bindings absent;
- direct permanent `CATEGORY_CAPTURE_ENABLED` absent.

## Execution model

Pull requests run static scope, contract, fixture, syntax, and development-policy checks only.

The request file is part of this package. When the accepted package is merged to `main`, the request-path push runs the one-time read-only observation. Any later deletion of the request file produces a no-op because the observer requires the exact request to remain present and valid.

The output is sanitized JSON with a deterministic SHA-256 digest. A separate acceptance PR must freeze the artifact evidence, workflow run, job, artifact ID, observation time, and digest.

No Twitch category canary trigger is authorized by this package or by the observation alone.
