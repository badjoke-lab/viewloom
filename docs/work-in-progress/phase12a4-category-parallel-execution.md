# 12A-5B-R2 replacement Twitch accumulation and pre-audit parallel work

## Status

Twitch and Kick permanent category capture are accepted and active. The guarded Twitch recovery was accepted in PR #657 and canonical state is v33.

- Replacement stability start: `2026-07-29T05:30:00.000Z`.
- Earliest final audit: `2026-08-05T05:30:00.000Z`.
- Replacement audit issue: #659.
- Dormant runner package: PR #661 / acceptance PR #662.
- Runner repair: PR #663 / acceptance PR #664.
- Checkpoint package: PR #665, merge `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
- Checkpoint package validation: run `30476596379`, job `90659857133`, success.
- Checkpoint package acceptance: PR #666.
- Current branch: `work-659-twitch-replacement-audit-checkpoint-trigger`.
- Public Twitch category-filter exposure: unauthorized.
- Existing provider cadences: `*/5 * * * *`.

## Current work order

### 1. Exact checkpoint trigger

Add only:

`docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json`

The trigger must use:

- schema `viewloom-12a5-twitch-replacement-audit-checkpoint-trigger-v1`;
- provider `twitch`;
- mode `checkpoint`;
- oneTime `true`;
- confirmation `RUN_TWITCH_REPLACEMENT_AUDIT_CHECKPOINT`;
- package PR `665`;
- package merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`;
- an exact start time inside the accepted bound.

The trigger PR validates identity only. Production execution occurs only after merge to main.

### 2. Bounded checkpoint execution

After trigger merge:

- execute checkpoint mode once;
- use the accepted accumulation start and latest completed five-minute boundary capped at final end;
- perform Cloudflare GET and D1 SELECT/WITH only;
- freeze sanitized evidence plus run/job/artifact/digest identities;
- report slot gaps, payload/reference/dictionary integrity, runtime/binding/cadence/errors/leakage, storage, public containment, and Kick unchanged;
- never accept #659 or authorize public UI;
- retire the trigger and temporary path after evidence freeze.

### 3. Heatmap Canvas work

After checkpoint execution/evidence priority is secured:

- PR-1: module/responsibility split, no public behavior change;
- PR-2: hidden/disabled Canvas scene with camera/redraw/hit-test architecture;
- preserve current API, provider separation, unfiltered fallback, and hidden category controls;
- no production renderer cutover before final validation.

### 4. Provider parity #148

- Begin targeted parity work after checkpoint priority is secured.
- Align Day Flow and Battle Lines product skeletons and states.
- No collector, cadence, D1, retention, category authorization, or cross-provider change.

### 5. Final boundary

At or after `2026-08-05T05:30:00.000Z`, execute #659 final mode read-only, freeze evidence, and accept or reject the complete 2016-slot replacement window. A passing audit does not expose UI.

## Shared boundaries

- Twitch and Kick remain provider-separated.
- No new Worker cron, D1 schema update, backfill, or retention expansion.
- The checkpoint package is checkpoint-only and read-only.
- No public Twitch category UI before accepted #659 final evidence and separate cutover.
- Existing unfiltered Heatmap remains the production fallback.
- No Heatmap Canvas cutover before independent final validation.
- Historical rejected evidence cannot authorize release.

## Mandatory source documents

Before each branch and before merge, read current-main versions of:

- `AGENTS.md`
- `docs/README.md`
- `docs/operations/development-and-deployment-policy.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`
- the affected feature specification and implementation plan
- relevant immutable acceptance/evidence records

Record the current-main SHA in the PR. Repair stale or conflicting documents before implementation continues.
