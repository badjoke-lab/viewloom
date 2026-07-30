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
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Merge execution package acceptance PR #673.
2. Add exactly one diagnosis trigger file using package PR #672, merge `02ece37cc70de4faa5251600a465d4e68d058f29`, and acceptance PR #673.
3. Validate trigger identity on the PR while production diagnosis remains skipped.
4. Merge the trigger and execute the accepted read-only diagnosis once.
5. Freeze sanitized evidence and retire the trigger/workflow.
6. Make a separate recovery/no-recovery and stability-clock decision.
7. Keep final mode and public cutover blocked until that decision is accepted.

## Current boundaries

- No checkpoint rerun or threshold relaxation.
- No interpolation, backfill, or invented historical rows.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, cross-provider, final-mode, or public-UI change.
- Diagnostic production access is D1 `SELECT` / `WITH` only and requires the accepted execution package and exact trigger.
- The trigger PR must change only the exact trigger file and must not execute production diagnosis.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: package, acceptance, exact trigger, execution, evidence freeze, decision, recovery, retirement, or unrelated product work. Do not combine them.

## Required validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Web changes also require affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.
