# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 U10G architecture complete through PR #470
Phase 10 U10H production acceptance complete through PR #471
U10H canonical closeout complete through PR #472
Phase 11 acceptance and operations active
Active implementation branch: work-quality-phase11-acceptance-operations
Current workstream: P11A strict-null baseline
```

Active Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.
Permanent U10H acceptance: `docs/operations/u10h-production-acceptance-2026-07-04.md`.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and entry check
  -> implementation
  -> targeted checks
  -> browser evidence where relevant
  -> merge
  -> canonical closeout
  -> full report and stop
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain separate.
