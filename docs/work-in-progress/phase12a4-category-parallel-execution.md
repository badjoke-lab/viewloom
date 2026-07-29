# 12A-5B-R2 replacement Twitch accumulation and pre-audit parallel work

## Status

Twitch and Kick permanent category capture are accepted and active. The guarded Twitch recovery was accepted in PR #657 and canonical state is v33.

- Replacement stability start: `2026-07-29T05:30:00.000Z`.
- Earliest replacement audit: `2026-08-05T05:30:00.000Z`.
- Replacement audit issue: #659.
- Dormant audit package: PR #661, merge `1cab151ce243e1ec58091bfd309f65671e1f41c7`.
- Package validation: run `30455002204`, job `90586212618`, success.
- Package acceptance: PR #662, merge `3f15d18ee3f7b31a71b10ff6f192eead404da92b`.
- Current defect: `sqlite_cte_scope_cross_statement`.
- Current branch: `work-659-twitch-replacement-audit-runner-query-fix`.
- Public Twitch category-filter exposure: unauthorized.
- Existing provider cadences: `*/5 * * * *`.

## Current work order

### 1. Runner repair before checkpoint execution

Pre-execution review found that the accepted runner defined CTE `scoped` in one SQL statement and referenced it from a later independent statement. SQLite CTE scope ends with the defining statement, so production checkpoint execution would fail while enumerating observed slots.

No production checkpoint or final audit has executed.

Required repair:

- export a pure SQL builder;
- enumerate observed category slots directly from `minute_snapshots`;
- retain exact Twitch provider, half-open window, and `category-source-v1` predicates;
- require every statement to begin with `SELECT` or `WITH`;
- verify no later statement uses `FROM scoped`;
- preserve 2016 final slots, checkpoint/final semantics, thresholds, and sanitized evidence shape;
- perform no Cloudflare/D1 execution or runtime mutation.

Next:

1. Validate and merge `work-659-twitch-replacement-audit-runner-query-fix`.
2. Freeze a separate repair acceptance record.
3. Resume `work-659-twitch-replacement-audit-checkpoint-package` only after repair acceptance.

### 2. Bounded checkpoints

After repair acceptance:

- create and separately accept the bounded checkpoint package;
- detect loss of binding, stale/missing category payloads, leakage, collector errors, unresolved IDs, or storage hard stops;
- remain read-only and non-authorizing;
- add no Worker cron;
- do not reset the accepted start;
- use an exact bounded trigger and sanitized artifact;
- never accept #659 or authorize public UI.

### 3. Heatmap Canvas work

- PR-1: module/responsibility split, no public behavior change.
- PR-2: hidden/disabled Canvas scene with camera/redraw/hit-test architecture.
- Preserve current API, provider separation, unfiltered fallback, and hidden category controls.
- No production renderer cutover before final validation.
- PR-1 may start after runner repair and checkpoint-package priority are secured.

### 4. Provider parity #148

- The dormant #659 package prerequisite is complete.
- Begin targeted parity work after runner repair and checkpoint-package priority are secured.
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
- Runner repair changes only dormant query construction and pure tests.
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
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json` while repair is active
- the affected feature specification and implementation plan
- relevant immutable acceptance/evidence records

Record the current-main SHA in the PR. Repair stale or conflicting documents before implementation continues.
