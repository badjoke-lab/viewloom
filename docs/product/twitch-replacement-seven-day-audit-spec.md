# Twitch replacement seven-day category accumulation audit specification

Status: source of truth  
Tracking issue: #659  
Parent issue: #623  
Hidden UI issue: #635  
Canonical start: `2026-07-29T05:30:00.000Z`  
Earliest final execution: `2026-08-05T05:30:00.000Z`

## Purpose

Define the accepted dormant read-only runner, accepted runner repair, accepted checkpoint execution package, exact trigger, diagnostic checkpoint evidence, final execution, evidence acceptance, and failure handling for the replacement Twitch seven-day category accumulation audit.

The audit decides only whether the hidden Twitch Heatmap category filter is eligible for a later separate public-cutover PR. It does not expose UI.

## Accepted baseline

- Recovery trigger PR: #655.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Recovery acceptance PR: #657.
- Canonical synchronization: PR #658 / commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Permanent Twitch binding present.
- Existing Twitch and Kick cadence: `*/5 * * * *`.
- Provider leakage at recovery: zero.
- Kick change at recovery: none.
- Public category-filter exposure: unauthorized.

## Accepted dormant runner

- Source package PR: #661.
- Package acceptance PR: #662.
- Exact window: `[2026-07-29T05:30:00Z, 2026-08-05T05:30:00Z)`.
- Expected five-minute slots: 2016.
- Window semantics: half-open.
- Checkpoint mode: diagnostic and non-authorizing.
- Final mode: prohibited before the exact boundary.
- Production execution in package/acceptance PRs: none.

## Accepted runner repair

Pre-execution review found `sqlite_cte_scope_cross_statement`. The original query defined CTE `scoped` in one SQL statement and referenced it from a later independent statement. SQLite CTE scope ends with the defining statement, so production execution would have failed before slot evidence completion.

Accepted repair:

- repair PR #663;
- repair merge `ab33afa4d6195532652791be2380a1fa9a278491`;
- validation run/job `30475011149` / `90654426211`;
- repair acceptance PR #664;
- observed-slot enumeration reads `minute_snapshots` directly;
- no later statement uses `FROM scoped`;
- all D1 statements remain SELECT/WITH;
- exact window, 2016 final slots, checkpoint/final semantics, thresholds, and evidence shape remain unchanged;
- no production checkpoint/final execution occurred before or during repair acceptance.

## Accepted checkpoint execution package

Checkpoint package PR: #665.  
Checkpoint package merge: `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.  
Checkpoint package validation: run `30476596379`, job `90659857133`.  
Checkpoint package acceptance PR: #666.  
Current branch: `work-659-twitch-replacement-audit-checkpoint-trigger`.

Package authorities:

- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`
- `.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml`
- `scripts/verify-12a5-twitch-replacement-audit-checkpoint-package.mjs`

Accepted behavior:

- mode is checkpoint only;
- checkpoint end is the latest completed five-minute boundary capped at final end;
- package/acceptance PRs use no production credentials and perform no production execution;
- trigger must be an exact one-file PR and must bind to package PR #665 and merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`;
- workflow has no schedule or workflow_dispatch entry;
- production execution starts only from the exact trigger-file push to main;
- Cloudflare calls are GET only;
- D1 statements are SELECT/WITH only;
- sanitized JSON artifact is required;
- Worker deployment, D1 mutation, binding/secret mutation, cadence/new cron, backfill, retention, Kick change, public UI, final mode, and cross-provider behavior are unauthorized.

## Exact checkpoint trigger

The next PR must add only:

`docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json`

Required shape:

```json
{
  "schemaVersion": "viewloom-12a5-twitch-replacement-audit-checkpoint-trigger-v1",
  "status": "armed",
  "provider": "twitch",
  "mode": "checkpoint",
  "oneTime": true,
  "confirmation": "RUN_TWITCH_REPLACEMENT_AUDIT_CHECKPOINT",
  "packagePr": 665,
  "packageMergeSha": "317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a",
  "startAt": "<accepted exact timestamp>"
}
```

The trigger PR validates identity but does not execute production checkpoint mode before merge. The merged trigger must be within the contract’s allowed past skew and maximum future delay.

## Window identity

The only valid accumulation start is `2026-07-29T05:30:00.000Z`.

Checkpoint mode uses:

- the accepted start;
- latest completed five-minute boundary at execution time;
- an end never later than `2026-08-05T05:30:00.000Z`.

Final mode uses the exact accepted full window and rejects execution before the final boundary.

Missing slots are reported exactly and are never interpolated.

## Required evidence

### Slot continuity

- expected and observed five-minute slots;
- exact missing timestamps;
- duplicates and invalid/out-of-window buckets;
- coverage ratio;
- maximum consecutive missing slots;
- bounded-gap decision.

### Payload and category integrity

- real, non-empty, fresh snapshots;
- `category-source-v1` continuity;
- stream/viewer totals;
- category-bearing rows;
- valid category references;
- unresolved observed category IDs;
- dictionary names and contract state.

### Runtime and provider integrity

- permanent Twitch binding present;
- obsolete canary bindings absent;
- five-minute cadence unchanged;
- collector-error history within threshold;
- provider leakage zero;
- Kick permanent configuration/runtime baseline unchanged.

### Storage

- current Twitch database size;
- projected 90-day size at or below 440 MB;
- provider headroom at or above 10 MB;
- projected account-wide D1 headroom at or above 500 MB.

### Public containment

- normal Twitch Heatmap contains no public category control;
- public navigation contains no hidden entry;
- Kick pages contain no Twitch category control;
- existing unfiltered Heatmap remains usable.

## Checkpoint semantics

Checkpoint evidence is diagnostic.

A checkpoint:

- may run before the final boundary only through the accepted trigger path;
- never accepts #659;
- never authorizes public UI;
- never guarantees final acceptance;
- never authorizes automatic mutation after failure;
- must freeze workflow/job/artifact/digest and sanitized evidence;
- must be followed by trigger/path retirement after its bounded purpose.

## Final mode

Final mode:

- is prohibited before `2026-08-05T05:30:00.000Z`;
- uses the exact 2016-slot half-open window;
- performs no deployment or D1 mutation;
- requires separate evidence acceptance;
- does not expose UI by itself.

## Failure

On checkpoint or final failure:

- perform no mutation;
- keep the hidden UI non-public;
- record the exact failed gate and sanitized evidence;
- preserve the existing unfiltered Heatmap;
- decide recovery work separately;
- do not reset the clock without a separately verified recovery event.

## Retirement

The one-time checkpoint trigger and temporary execution path must be retired after evidence freeze unless an accepted follow-up contract explicitly retains a reusable read-only verifier. The dormant runner and pure tests may remain while current for #659.
