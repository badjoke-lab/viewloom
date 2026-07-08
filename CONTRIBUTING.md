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
Phase 11 production closeout complete
Phase 12 English release readiness active
Current workstream: R12A-0 current legal/support surface audit
Exact next implementation branch: work-release-r12a-legal-support
Next branch created: no
```

Permanent Phase 11 closeout: `docs/operations/phase11-production-closeout-2026-07-08.md`.

Active Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Phase 12 sequence:

```text
R12A legal and support public-surface completion
R12B Stripe and support-flow readiness
R12C English launch package and release acceptance
```

External Stripe dashboard/account state must be supported by explicit evidence and must not be inferred from repository code alone.

Approved future analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Approved future sequence:

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System implementation
```

Phase 12A and Phase 16 branches must not be created before their entry gates close. Analytics work must not bypass the approved data capture, capacity, calibration, coverage, and evidence gates.

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
