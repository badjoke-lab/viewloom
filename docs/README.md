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
Checkpoint run 30478338654 failed
Checkpoint path retired yes
Failure diagnosis query package accepted PR #670 / #671
Failure diagnosis execution package accepted PR #672 / #673
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/product/twitch-replacement-seven-day-audit-spec.md`
6. frozen checkpoint evidence and retirement record
7. diagnosis query package contract/acceptance
8. diagnosis execution package contract/acceptance and trigger contract
9. active WIP
10. the affected feature specification and plan

## Current gate

The checkpoint failed slot coverage, consecutive-gap, and category-reference gates. Frozen values remain 151/154 (`0.980519`), three missing buckets at `07:20`, `07:25`, `07:30` UTC, and 45,039/45,287 category refs (`0.994524`) with 248 null refs.

The read-only query package is accepted through PRs #670/#671. The one-time execution package is accepted through PRs #672/#673. The current gate is an exact one-file diagnosis trigger. The trigger must identify package PR #672, merge `02ece37cc70de4faa5251600a465d4e68d058f29`, and acceptance PR #673. Production diagnosis remains skipped on the trigger PR and can run only after its main merge.

## Evidence chain

- Recovery acceptance: PR #657; canonical v33 sync: PR #658.
- Runner package/acceptance/repair: PRs #661–#664.
- Checkpoint package/acceptance/trigger: PRs #665–#667.
- Checkpoint run/job/artifact: `30478338654` / `90665697236` / `8734980337`.
- Artifact digest: `sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b`.
- Evidence JSON SHA-256: `041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f`.
- Checkpoint evidence/retirement: PR #669.
- Diagnosis query package/acceptance: PRs #670/#671.
- Diagnosis execution package: PR #672; merge `02ece37cc70de4faa5251600a465d4e68d058f29`.
- Diagnosis execution package acceptance: PR #673.
- Package validation run/job: `30539504888` / `90860798797`.

## Current order

1. Merge execution package acceptance PR #673.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger`.
3. Add exactly one trigger file with the accepted package identity and a bounded `startAt`.
4. Confirm trigger validation succeeds and production diagnosis is skipped on the PR.
5. Squash merge the trigger and execute the read-only diagnosis once.
6. Freeze sanitized evidence and retire the trigger/workflow.
7. Make a separate recovery/no-recovery and stability-clock decision.
8. Keep final mode and public cutover blocked until that decision is accepted.

## Invariants

- No checkpoint rerun, threshold relaxation, interpolation, backfill, or automatic clock reset.
- Diagnosis is D1 `SELECT` / `WITH` only.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the production fallback.
- A diagnosis never accepts #659 or authorizes public UI by itself.
- Current-main documents, not cached chat summaries, determine authorization.
