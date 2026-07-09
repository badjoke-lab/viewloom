# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A complete
R12B complete through R12B-2
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/operations/phase12-release-acceptance-2026-07-09.md
docs/audits/r12c3-candidate-acceptance.json
docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

Exact production acceptance:

```text
main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Production Smoke run: 28993206779
Independent closeout probe run: 28993547481
```

## Phase 12A boundary

12A-0 is evidence-only baseline work. Record current D1/storage/query/cadence/capacity facts before schema migration or analytics runtime changes.

Closeout capacity observations carried forward:

```text
Twitch 300/300  at-or-over-window
Kick   100/100  at-or-over-window
```

These observations do not authorize collection-window expansion, raw-retention extension, provider combination, or stronger coverage claims.

R12B external-state boundaries remain in force. Current Stripe Dashboard/account facts must be supported by direct evidence and must not be inferred from repository code or public browser behavior alone.

Approved sequence:

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System implementation
```

Phase 16 branches must not be created before Phase 15 entry gates close. Analytics work must not bypass approved data capture, capacity, calibration, coverage, and evidence gates.

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
