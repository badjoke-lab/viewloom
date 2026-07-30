# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical runtime gate, diagnosis decision/evidence, accepted v2 package contract/acceptance, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Diagnosis decision recovery required
Original stability clock invalid
Package accepted PR #682 / #684
Current branch work-659-twitch-category-source-v2-completeness-execution-package
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Build a Twitch-only disabled-by-default execution package for the accepted `category-source-v2-candidate`.
2. Preserve v1 as the default and rollback path.
3. Define an exact trigger, bounded timeout, two-consecutive-snapshot evidence, rollback, storage, and provider-separation gates.
4. Accept the execution package separately before an exact trigger.
5. Freeze evidence and decide semantic handling/new clock separately.

## Current boundaries

- No production execution before a separately accepted execution package and exact trigger.
- No checkpoint rerun, backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: decision, dormant package, package acceptance, execution package, execution acceptance, exact trigger, evidence freeze, semantic/clock decision, final audit, or public cutover.
