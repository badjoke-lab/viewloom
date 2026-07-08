# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness complete through R12B-2
Current workstream: R12C-0 message inventory
Exact next implementation branch: work-release-r12c0-message-inventory
Next branch created: no
```

Active Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Permanent R12B evidence:

```text
docs/audits/r12b-evidence-and-configuration-audit.json
docs/audits/r12b-repository-consistency-notes.md
docs/operations/r12b0-evidence-audit-2026-07-09.md
docs/operations/r12b1-support-transition-acceptance-2026-07-09.md
docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md
```

Phase 12 sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C English launch package and release acceptance active at R12C-0
```

R12C-0 must inventory the current English source package before broad launch copy is written. Inventory the Portal/About descriptions, feature roles, bounded-data limitations, provider-separation wording, Status/help/support/legal links, FAQ-like explanations, screenshots/share assets, missing launch explanations/assets, and terminology candidates.

R12B external-state boundaries remain in force. Current Stripe Dashboard/account facts must be supported by direct evidence and must not be inferred from repository code or public browser behavior alone.

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

Phase 12A and Phase 16 branches must not be created before their entry gates close. Analytics work must not bypass approved data capture, capacity, calibration, coverage, and evidence gates.

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
