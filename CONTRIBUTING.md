# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical gate, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR. Repair stale or conflicting source-of-truth documents before implementation.

## Current state

```text
Phase 12A-5B-R2 replacement Twitch accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired
Diagnosis query package accepted PR #670 / #671
Diagnosis execution package accepted PR #672 / #673
Diagnosis evidence frozen and temporary path retired
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Merge the evidence/retirement PR after artifact and digest verification.
2. Create a separate diagnosis-decision PR.
3. Decide recovery, no recovery, and stability-clock treatment from frozen evidence only.
4. Do not mutate production or expose UI in the decision PR.
5. Package any required recovery separately.
6. Keep final mode and public cutover blocked until later accepted gates.

## Current boundaries

- No checkpoint rerun or threshold relaxation.
- No interpolation, backfill, or invented historical rows.
- No automatic recovery or stability-clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, cross-provider, final-mode, or public-UI change.
- Diagnosis evidence is non-authorizing.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: package, acceptance, exact trigger, execution, evidence freeze, decision, recovery, retirement, or unrelated product work. Do not combine them.

## Required validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence-retirement.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Web changes also require affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.
