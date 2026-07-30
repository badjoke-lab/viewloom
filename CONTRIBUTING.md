# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical gate, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR. Repair stale or conflicting source-of-truth documents before implementation.

## Current state

```text
Phase 12A-5B-R2 replacement Twitch accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired
Failure diagnosis package accepted PR #670 / #671
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Merge diagnosis package acceptance PR #671.
2. Create and separately accept the one-time read-only diagnosis execution package.
3. Add an exact one-file trigger in a separate PR and execute the accepted diagnosis once.
4. Freeze sanitized diagnosis evidence and retire the temporary execution path.
5. Make a separate recovery/no-recovery and stability-clock decision.
6. Keep final mode and public cutover blocked until that decision is accepted.

## Current boundaries

- No checkpoint rerun or threshold relaxation.
- No interpolation, backfill, or invented historical rows.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, or cross-provider change.
- Diagnostic production access is D1 `SELECT` / `WITH` only and requires a separately accepted execution package and exact trigger.
- Package PRs must not use production credentials or execute production queries.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: package, acceptance, exact trigger, execution, evidence freeze, decision, recovery, retirement, or unrelated product work. Do not combine them.

## Required validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Web changes also require affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.
