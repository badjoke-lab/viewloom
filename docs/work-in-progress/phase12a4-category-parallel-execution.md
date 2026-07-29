# 12A-5B-R2 replacement Twitch accumulation and pre-audit parallel work

## Status

Twitch and Kick permanent category capture are accepted and active. The guarded Twitch recovery was accepted in PR #657 and canonical state is v33.

- Replacement stability start: `2026-07-29T05:30:00.000Z`.
- Earliest replacement audit: `2026-08-05T05:30:00.000Z`.
- Replacement audit issue: #659.
- Dormant audit package: PR #661, merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Package validation: run `30455002204`, job `90586212618`, success.
- Package acceptance: PR #662, merge `3f15d18ee3f7b31a71b10ff6f192eead404da92b`.
- Runner repair: PR #663, merge `ab33afa4d6195532652791be2380a1fa9a278491`.
- Runner repair validation: run `30475011149`, job `90654426211`, success.
- Runner repair acceptance: PR #664.
- Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.
- Public Twitch category-filter exposure: unauthorized.
- Existing provider cadences: `*/5 * * * *`.

## Current work order

### 1. Bounded checkpoint package

The accepted dormant runner now:

- exports a pure SQL builder;
- enumerates observed category slots directly from `minute_snapshots`;
- retains the exact Twitch provider, half-open window, and `category-source-v1` predicates;
- requires every statement to begin with `SELECT` or `WITH`;
- has no later statement using `FROM scoped`;
- preserves 2016 final slots, checkpoint/final semantics, thresholds, and sanitized evidence shape.

No production checkpoint or final audit has executed.

Next:

1. Create and validate `work-659-twitch-replacement-audit-checkpoint-package`.
2. Add a bounded checkpoint execution workflow and exact trigger contract.
3. Add no Worker cron and use no production credentials on the package PR.
4. Validate accepted package and repair identities, exact start, capped completed boundary, read-only statements, evidence shape, public containment, and Kick baseline.
5. Freeze a separate checkpoint-path acceptance record before production read-only execution.

### 2. Bounded checkpoint execution

After checkpoint-path acceptance:

- execute checkpoint mode only through the accepted bounded path;
- detect loss of binding, stale/missing category payloads, leakage, collector errors, unresolved IDs, or storage hard stops;
- remain read-only and non-authorizing;
- add no Worker cron;
- do not reset the accepted start;
- use an exact bounded trigger and sanitized artifact;
- freeze workflow/job/artifact/digest identities;
- retire the one-time trigger/path after its bounded purpose unless an accepted contract retains it;
- never accept #659 or authorize public UI.

### 3. Heatmap Canvas work

- PR-1: module/responsibility split, no public behavior change.
- PR-2: hidden/disabled Canvas scene with camera/redraw/hit-test architecture.
- Preserve current API, provider separation, unfiltered fallback, and hidden category controls.
- No production renderer cutover before final validation.
- PR-1 may start after checkpoint-package priority is secured.

### 4. Provider parity #148

- Begin targeted parity work after checkpoint-package priority is secured.
- Align Day Flow and Battle Lines product skeletons and states.
- No collector, cadence, D1, retention, category authorization, or cross-provider change.

### 5. Final boundary

At or after `2026-08-05T05:30:00.000Z`, execute #659 final mode read-only, freeze evidence, and accept or reject the complete replacement window. A passing audit does not expose UI.

## Recovery result retained

- Trigger PR: #655.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Acceptance and execution-path retirement: PR #657.
- Canonical synchronization: PR #658 / commit `e1fea3f6626a4df3e8b950dcacad3c678683ccc8`.
- Permanent binding present; two real/non-empty/fresh category-bearing snapshots passed.
- Cadence unchanged; leakage zero; storage gates passed; rollback not required; Kick unchanged.

## Shared boundaries

- Twitch and Kick remain provider-separated.
- No new Worker cron, D1 schema update, backfill, or retention expansion.
- The accepted runner repair changed only dormant query construction and pure tests.
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
- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
- the affected feature specification and implementation plan
- relevant immutable acceptance/evidence records

Record the current-main SHA in the PR. Repair stale or conflicting documents before implementation continues.
