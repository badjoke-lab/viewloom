# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-30

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Twitch and Kick permanent category capture accepted on their existing five-minute collectors.
- Guarded Twitch recovery accepted in PR #657 and canonical state synchronized to v33.
- Dormant replacement runner accepted through PRs #661/#662.
- SQL scope defect repaired through PRs #663/#664 before production execution.
- Bounded checkpoint package accepted through PRs #665/#666.
- Exact trigger PR #667 merged and checkpoint run `30478338654` executed read-only.
- Sanitized checkpoint artifact `8734980337` was produced.

### Current gate: checkpoint failure diagnosis

The checkpoint failed three contractual data gates:

1. slot coverage `0.980519 < 0.995`;
2. three consecutive missing slots at `2026-07-29T07:20Z`, `07:25Z`, and `07:30Z`, exceeding the maximum of two;
3. category-reference coverage `0.994524 < 0.995`, with 248 null references among 45,287 stream references.

All runtime safety gates passed: read-only execution, exact start, identities, five-minute cadence, schema, permanent bindings, storage, public containment, zero provider leakage, fresh real latest snapshot, and Kick unchanged.

The one-time trigger, execution workflow, and reporter are retired. Public category-filter exposure remains unauthorized.

## Active deliverable

Create and separately accept `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package`.

The diagnosis must remain read-only and determine:

- the exact cause and surrounding collector state for the three missing buckets;
- whether those buckets can appear without backfill or mutation;
- the per-snapshot/per-stream distribution of the 248 null category references;
- whether null refs are upstream absence, normalization loss, or collection-path loss;
- whether recovery and a new verified clock are required.

## Final-audit status

`2026-08-05T05:30:00Z` remains the earliest calendar boundary, but final execution is blocked until the diagnosis and a separate decision are accepted. The checkpoint failure cannot be ignored, rerun away, or repaired by relaxing thresholds.

## Parallel work

Heatmap Canvas module split and #148 provider parity may resume only after checkpoint evidence/retirement is merged and diagnosis priority is secured. They must not touch collector behavior, cadence, category authorization, or Kick runtime.

## Hard boundaries

- no checkpoint rerun;
- no threshold relaxation;
- no invented/backfilled rows;
- no automatic recovery or clock reset;
- no Worker deployment, new cron, cadence, D1 schema, retention, Kick, or cross-provider change;
- no public category-filter exposure;
- existing unfiltered Heatmap remains the fallback.

## Source of truth

- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
- `docs/operations/development-and-deployment-policy.md`
