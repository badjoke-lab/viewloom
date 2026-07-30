# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, docs index, current roadmap, current schedule, canonical runtime gate, diagnosis decision/evidence, affected specification/plan, active WIP, and development policy. Record the Current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Diagnosis decision recovery required
Original stability clock invalid
Current branch work-659-twitch-category-source-v2-completeness-recovery-package
Public Twitch category-filter exposure unauthorized
```

## Current work order

1. Implement a dormant Twitch-only `category-source-v2-candidate` package.
2. Preserve exact source-completeness states before stripping source fields.
3. Add unit, storage, execution-cost, provider-separation, rollback, and public-containment gates.
4. Do not execute production on the package PR.
5. Accept and activate separately, then freeze consecutive post-activation evidence.
6. Decide semantic handling and the new stability clock separately.

## Current boundaries

- No checkpoint rerun, backfill, row invention, threshold relaxation, synthetic category mapping, or automatic clock reset.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: decision, dormant package, acceptance, execution, evidence freeze, semantic/clock decision, final audit, or public cutover.
