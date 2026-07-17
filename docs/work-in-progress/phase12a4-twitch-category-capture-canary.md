# 12A-4-13 Twitch category capture canary package

## Status

Candidate package only. Production execution is not authorized.

## Purpose

Prepare a disabled-by-default, provider-isolated Twitch category capture canary package after the accepted and retired Kick canary chain.

This package proves only that:

- the Twitch wrapper can enforce a bounded 23-25 hour window;
- committed configuration remains disabled;
- invalid, pending, and expired windows cannot enable category capture;
- the normal Twitch collector and D1 identity remain unchanged;
- normal and disabled-canary bundles compile;
- no production trigger, deployment, D1 operation, or permanent flag is included.

## Storage boundary

Twitch has materially less accepted storage headroom than Kick. A later execution package must capture current remote size and recalculate all projections before any trigger can be accepted.

Required execution-time hard stops:

- projected Twitch 90-day size at or below `440 MB`;
- projected Twitch provider headroom at or above `10 MB`;
- projected account-wide headroom at or above `500 MB`;
- category generator queries at or below `12`;
- collector latency delta at or below `2000 ms`;
- provider leakage rows exactly `0`.

This package does not claim those current storage gates pass. It only freezes them as mandatory preconditions.

## Package files

- `workers/collector-twitch/src/entry-category-canary.ts`
- `workers/collector-twitch/wrangler.category-canary.toml`
- `docs/audits/12a4-twitch-category-capture-canary-package-contract.json`
- `.github/workflows/analytics-12a4-twitch-category-capture-canary-package.yml`
- package scope, verifier, and fixtures under `scripts/`

## Hard boundary

This pull request must not:

- create a trigger;
- add a push or schedule workflow event;
- reference Cloudflare credentials;
- deploy a Worker;
- call remote D1;
- change `workers/collector-twitch/wrangler.toml`;
- change Kick files;
- start runtime category capture;
- add a new cron;
- change cadence, retention, or backfill behavior;
- add category UI;
- merge provider identities or rankings;
- authorize permanent enablement.

## Later gates

1. Accept this dormant package through PR-only validation.
2. Design a separate dormant execution/evidence package.
3. Capture current Twitch D1 and account-wide storage evidence.
4. Accept a later exact one-file trigger only if every storage and runtime precondition passes.
5. Run a bounded 24-hour Twitch canary.
6. Freeze final rollback evidence in a separate acceptance PR.

No later step is automatic.
