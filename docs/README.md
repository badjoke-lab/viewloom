# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-30

## Current execution state

```text
Phase 12A-5B-R2 replacement Twitch accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active yes
Kick permanent category capture active yes
Checkpoint run 30478338654 failed
Checkpoint path retired yes
Diagnosis query package accepted PR #670 / #671
Diagnosis execution package accepted PR #672 / #673
Diagnosis trigger PR #678
Diagnosis evidence frozen yes
Diagnosis execution path retired yes
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision
Public Twitch category-filter exposure authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. `docs/product/twitch-replacement-seven-day-audit-spec.md`
6. frozen checkpoint evidence and retirement
7. diagnosis query/execution contracts and acceptances
8. `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json`
9. `docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json`
10. active WIP and affected feature specification/plan

## Frozen chain

- Checkpoint run/job/artifact: `30478338654` / `90665697236` / `8734980337`.
- Checkpoint failure: 151/154 slots, three missing buckets, 45,039/45,287 category refs, 248 null refs.
- Query package/acceptance: PRs #670/#671.
- Execution package/acceptance: PRs #672/#673.
- Trigger PR/merge: #678 / `ccb05bce0622a23e211c2c1eadc23052377d302e`.
- Diagnosis execution identifiers: `PENDING_DIAGNOSIS_IDENTIFIERS`.
- Diagnosis evidence SHA-256: `PENDING_DIAGNOSIS_EVIDENCE_SHA256`.

## Current gate

Diagnosis evidence is frozen and the exact trigger, one-time execution workflow, and temporary reporter are retired. The next gate is a separate checkpoint-failure diagnosis decision.

The decision must determine, without production mutation:

- whether the three missing rows were permanently absent or only unavailable to the checkpoint query;
- whether collector-run history identifies a bounded operational cause;
- whether null refs are concentrated in stable upstream-empty channels or indicate a collector defect;
- whether post-checkpoint null-ref behavior is stable or worsening;
- whether recovery is required;
- whether the original replacement stability clock remains valid, must restart, or needs another bounded rule.

Diagnosis evidence itself does not decide recovery, accept #659, authorize final mode, or expose public category controls.

## Current order

1. Merge the evidence/retirement PR after replacing pending identifiers with verified values.
2. Create `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision`.
3. Freeze a separate recovery/no-recovery and stability-clock decision.
4. Package any required recovery separately.
5. Keep final mode and public cutover blocked until later accepted gates.

## Invariants

- No checkpoint rerun, threshold relaxation, interpolation, backfill, or automatic clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the production fallback.
- Current-main documents, not cached chat summaries, determine authorization.
