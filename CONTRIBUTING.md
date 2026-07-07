# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 U10G architecture complete through PR #470
Phase 10 U10H production acceptance complete through PR #471
U10H canonical closeout complete through PR #472
Phase 11 P11A–P11F complete
Phase 11 P11G final acceptance active
Active implementation branch: work-quality-phase11-acceptance-operations
Current workstream: P11G final pre-merge acceptance
```

Active Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.
Phase 11 monitoring/escalation: `docs/operations/phase11-monitoring-and-escalation.md`.
Phase 11 maintenance cadence: `docs/operations/phase11-maintenance-cadence.md`.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and entry check
  -> implementation
  -> targeted checks
  -> browser evidence where relevant
  -> final latest-head candidate checks
  -> merge
  -> hosted production monitoring closeout when required
  -> canonical closeout
  -> full report and stop
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain separate.
