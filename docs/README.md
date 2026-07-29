# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-30

## Current execution state

```text
Phase 12A-5B-R2 replacement Twitch accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Replacement stability start 2026-07-29T05:30:00.000Z
Earliest calendar final boundary 2026-08-05T05:30:00.000Z
Checkpoint run 30478338654
Checkpoint outcome failed
Trigger/execution/reporter retired yes
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/product/twitch-replacement-seven-day-audit-spec.md`
6. `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
7. `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`
8. `docs/work-in-progress/phase12a4-category-parallel-execution.md`
9. the affected feature specification and plan
10. relevant immutable package/acceptance records

## Current gate

The checkpoint executed read-only at `2026-07-29T18:20:00Z` and failed three accepted data gates:

- slot coverage 151/154 (`0.980519`, required `0.995`);
- three consecutive missing buckets at `07:20`, `07:25`, `07:30` UTC;
- category-reference coverage 45,039/45,287 (`0.994524`, required `0.995`), with 248 null refs.

The null refs are not invalid indices and are not unresolved dictionary IDs. Runtime identities, cadence, bindings, storage, public containment, latest real/fresh category snapshot, provider leakage, and Kick baseline passed.

The trigger, checkpoint workflow, and reporter are retired. The current gate is a separately accepted read-only failure-diagnosis package. Public category controls remain hidden.

## Evidence chain

- Recovery acceptance: PR #657.
- Canonical v33 synchronization: PR #658.
- Dormant runner package/acceptance: PRs #661/#662.
- Runner repair/acceptance: PRs #663/#664.
- Checkpoint package/acceptance: PRs #665/#666.
- Trigger PR: #667; merge `ee8125ecd12f7ec620af13fd78d9a3c3c7e18f98`.
- Checkpoint run/job/artifact: `30478338654` / `90665697236` / `8734980337`.
- Artifact digest: `sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b`.
- Evidence JSON SHA-256: `041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f`.
- Evidence: `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`.
- Retirement: `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`.

## Current order

1. Merge checkpoint evidence and retirement.
2. Create/accept a read-only failure-diagnosis package.
3. Diagnose the three missing buckets and 248 null refs.
4. Freeze diagnosis evidence.
5. Make a separate recovery/no-recovery and clock decision.
6. Keep final mode and public cutover blocked until that decision is accepted.

## Invariants

- No rerun, threshold relaxation, interpolation, backfill, or automatic clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, or cross-provider change.
- Existing unfiltered Heatmap remains the production fallback.
- A checkpoint never accepts #659 or authorizes public UI.
- Current-main documents, not cached chat summaries, determine authorization.
