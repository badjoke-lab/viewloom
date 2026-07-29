# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical gate, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR. Repair stale or conflicting source-of-truth documents before implementation.

## Current state

```text
Phase 12A-5B-R2 replacement Twitch accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Checkpoint run 30478338654 failed
Checkpoint path retired
Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Merge checkpoint evidence and retirement.
2. Create and separately accept the read-only failure-diagnosis package.
3. Diagnose three consecutive missing buckets and 248 null category refs.
4. Freeze diagnosis evidence.
5. Make a separate recovery/no-recovery and stability-clock decision.
6. Keep final mode and public cutover blocked until that decision is accepted.

## Current boundaries

- No checkpoint rerun or threshold relaxation.
- No interpolation, backfill, or invented historical rows.
- No automatic recovery or clock reset.
- No Worker deployment, new cron, cadence, D1 schema, retention, Kick, or cross-provider change.
- Diagnostic production access, when separately accepted, is Cloudflare GET and D1 SELECT/WITH only.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: package, execution, evidence freeze, diagnosis, decision, recovery, retirement, or unrelated product work. Do not combine them.

## Required validation

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Web changes also require affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.
