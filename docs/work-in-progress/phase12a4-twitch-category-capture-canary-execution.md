# 12A-4-14 Twitch category capture canary execution package

## Status

Accepted dormant execution/evidence package. No trigger exists and production execution is not authorized.

PR #591 candidate head `4a97486545926b251ee3307946f625310119becf` passed exact scope, execution contract, trigger/storage/binding/rollback fixtures, development policy, and normal/disabled-canary Worker dry-runs in workflow run `29576877370`, job `87873237039`. The package merged at `5c302c8b674edd1d13ab5a467465ed60d0fb96c5`.

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

A separate read-only storage-preflight contract must be accepted before an exact trigger is valid. At a start event, that preflight evidence must be no older than 60 minutes and its PR, merge SHA, observation timestamp, and digest must match the trigger exactly. The runner still recalculates all storage gates immediately before deployment.

## Dormant package boundary

This accepted package did not add the exact trigger.

During PR #591:

- push start job was skipped;
- scheduled inspector job was skipped;
- monitor/finalize job was skipped;
- no Cloudflare production call occurred;
- no Worker was deployed;
- no remote D1 query occurred;
- normal Twitch config remained unchanged;
- Kick remained unchanged;
- permanent category capture remained unauthorized.

## Later exact trigger

A later exact one-file trigger must include:

- accepted package PR #590 and merge SHA;
- accepted execution package PR #591 and merge SHA;
- accepted storage-preflight PR and merge SHA;
- exact storage-preflight observation timestamp and evidence digest;
- provider `twitch`;
- positive attempt;
- 23-25 hour bounded window;
- confirmation `RUN_TWITCH_CATEGORY_CAPTURE_CANARY`.

The trigger must not be accepted unless current Twitch and account-wide storage projections pass in a separate read-only preflight and are rechecked immediately before deployment.
