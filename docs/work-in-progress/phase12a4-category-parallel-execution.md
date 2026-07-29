# 12A-5B-R2 replacement Twitch accumulation and pre-audit parallel work

## Status

Twitch and Kick permanent category capture are accepted and active. The guarded Twitch recovery was accepted in PR #657 and canonical state is v33.

- Replacement stability start: `2026-07-29T05:30:00.000Z`.
- Earliest replacement audit: `2026-08-05T05:30:00.000Z`.
- Replacement audit issue: #659.
- Public Twitch category-filter exposure: unauthorized.
- Existing provider cadences: `*/5 * * * *`.

## Current work order

### 1. Replacement audit readiness

- Freeze the audit specification.
- Build the dormant read-only #659 audit package.
- Verify exact window identity, expected slots, bounded gaps, category contract/reference/dictionary continuity, errors, binding, leakage, freshness, storage, public-surface absence, and Kick immutability.
- Produce sanitized artifacts only.
- Add no production trigger until a separately accepted package requires it.

### 2. Bounded checkpoints

- Detect loss of binding, stale/missing category payloads, leakage, collector errors, unresolved IDs, or storage hard stops before the final day.
- Remain read-only and non-authorizing.
- Do not add a Worker cron.
- Do not reset the accepted start.

### 3. Heatmap Canvas work

- PR-1: module/responsibility split, no public behavior change.
- PR-2: hidden/disabled Canvas scene with camera/redraw/hit-test architecture.
- Preserve current API, provider separation, unfiltered fallback, and hidden category controls.
- No production renderer cutover before final validation.

### 4. Provider parity #148

- Begin only after the #659 package candidate is complete.
- Align Day Flow and Battle Lines product skeletons and states.
- No collector, cadence, D1, retention, category authorization, or cross-provider change.

### 5. Final boundary

At or after `2026-08-05T05:30:00.000Z`, execute #659 read-only, freeze evidence, and accept or reject the complete replacement window. A passing audit does not expose UI.

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
- No public Twitch category UI before accepted #659 evidence and separate cutover.
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
- the affected feature specification and implementation plan
- relevant immutable acceptance/evidence records

Record the current-main SHA in the PR. Repair stale or conflicting documents before implementation continues.
