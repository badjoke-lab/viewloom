# 12A-4-14 Twitch category capture canary execution package

## Status

Candidate execution/evidence package only. No trigger exists and production execution is not authorized.

## Purpose

Prepare the exact trigger inspection, storage preflight, bounded deployment, checkpoint evidence, hard-stop rollback, expiry rollback, and sanitized artifact path required for a later Twitch category capture canary.

The package is dormant while `docs/audits/12a4-twitch-category-capture-canary-trigger.json` is absent.

## Cost-aware monitor design

The wrapper disables category capture at the exact `until` timestamp. The GitHub monitor/finalizer runs every two hours rather than every hour while this temporary execution package is present.

This means:

- capture expiry is exact in the Worker wrapper;
- binding cleanup and final rollback may occur up to two hours after expiry;
- a later acceptance package must verify no category payload after the exact expiry grace boundary;
- the execution workflow must be retired immediately after final acceptance.

## Storage preflight

Every `start`, `monitor`, and `finalize` action recalculates from current production state:

- current Twitch D1 file size;
- current account-wide D1 file-size total;
- projected Twitch 90-day size using `48.32 MB` incremental safety;
- projected Twitch provider headroom against `450 MB`;
- projected account-wide headroom against `4608 MB`.

Hard stops:

- Twitch projected size above `440 MB`;
- Twitch provider headroom below `10 MB`;
- account-wide projected headroom below `500 MB`;
- provider leakage above `0`;
- mismatched or pre-existing canary bindings;
- failed post-deploy binding verification.

## Dormant package boundary

This pull request may add the future gated execution path, but it must not add the exact trigger.

During this pull request:

- push start job is skipped;
- scheduled inspector sees no trigger and no-ops;
- workflow dispatch validates only;
- no Cloudflare production call occurs;
- no Worker is deployed;
- no remote D1 query occurs;
- normal Twitch config is unchanged;
- Kick is unchanged;
- permanent category capture remains unauthorized.

## Later exact trigger

A later exact one-file trigger must include:

- accepted package PR #590 and merge SHA;
- accepted execution package PR and merge SHA;
- provider `twitch`;
- positive attempt;
- 23-25 hour bounded window;
- confirmation `RUN_TWITCH_CATEGORY_CAPTURE_CANARY`.

The trigger must not be accepted unless current Twitch and account-wide storage projections pass immediately before its creation.
