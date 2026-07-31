# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch and again before merge, fetch current `main` and read `AGENTS.md`, the docs index, current roadmap, current schedule, canonical runtime gate, diagnosis records, corrected observation package/acceptance, successful observation evidence, evidence retirement, execution-path retirement, affected specification/plan, active WIP, and development policy. Record the current-main SHA in every PR.

## Current state

```text
Phase 12A-5B-R2 Twitch category source completeness recovery
Original stability clock invalid and retired
Corrected observation package accepted PR #692 / #693
Successful observation PR #695 / run 30620512044 / job 91123756273
Evidence frozen PR #697
Temporary execution path retired PR #698
Current gate semantic handling and new seven-day stability-clock decision
Current branch work-659-twitch-category-source-v2-semantic-clock-decision
Public Twitch category-filter exposure unauthorized
```

## Accepted result

Two consecutive real, non-empty, fresh Twitch v2 snapshots passed all integrity, dictionary, provider-separation, and freshness gates. Canonical v1 rollback succeeded. The exact trigger and all one-time production execution paths are retired.

## Current work order

1. Produce a separate semantic and clock decision from the frozen evidence.
2. Do not invent mappings, relax thresholds, backfill, or reset the clock automatically.
3. If a new clock is accepted, freeze its exact start in the decision record and require seven stable days before final audit.
4. Keep final mode and public category UI blocked until separate acceptance.

## Current boundaries

- No observation rerun or recreation of the retired execution path without a new governed package and trigger sequence.
- No Kick, cadence, retention, cross-provider, final-mode, or public-UI change.
- Existing unfiltered Heatmap remains the fallback.

## Change classification

Use one PR per responsibility: evidence freeze, execution-path retirement, semantic/clock decision, stability-window evidence, final audit, or public cutover.
