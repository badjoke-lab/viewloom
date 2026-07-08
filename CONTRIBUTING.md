# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 U10G architecture complete through PR #470
Phase 10 U10H production acceptance complete through PR #471
U10H canonical closeout complete through PR #472
Phase 11 P11A–P11F complete
Phase 11 P11G candidate merged PR #473
Phase 11 hosted production monitoring closeout pending
Current workstream: Phase 11 hosted closeout and canonical synchronization
```

Current Phase 11 record: `docs/work-in-progress/phase11-acceptance-operations.md`.
Phase 11 monitoring/escalation: `docs/operations/phase11-monitoring-and-escalation.md`.
Phase 11 maintenance cadence: `docs/operations/phase11-maintenance-cadence.md`.

Approved future analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Approved future sequence:

```text
Phase 12 release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System implementation
```

Phase 16 branches must not be created before Phase 15 closes. Analytics work must not bypass the approved data capture, capacity, calibration, coverage, and evidence gates.

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

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain separate across routes, APIs, bindings, storage, baselines, relationships, reports, exports, and coverage claims.
