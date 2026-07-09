# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A legal/support public-surface completion complete
R12B Stripe/support readiness complete through R12B-2
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete PR #485
R12C-2 launch/share asset package complete PR #486
R12C-3 candidate acceptance complete PR #487
R12C-3 exact production SHA closeout complete
Current phase: Phase 12A Analytics Capture Foundation
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-capacity-baseline
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Active analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/phase12-release-acceptance.json
```

## Active 12A-0 rules

12A-0 is evidence-only and must not introduce runtime changes.

Required evidence:

```text
current D1 row counts
payload size
oldest/latest raw bucket
daily-rollup counts
collector duration
relevant query timings
Twitch/Kick source modes and coverage behavior
five-minute cadence behavior
rollup/retention schedule behavior
current field matrix
upstream fields discarded before storage
```

Completion requires permanent machine-readable baseline evidence and storage/query budgets before migration.

Do not include any of the following in 12A-0:

```text
runtime feature changes
schema migration
intraday rollup generation
new analytics UI
raw-retention extension
new high-frequency cron
unsupported session/category claims
cross-provider totals, rankings, baselines, or relationships
```

Current capacity evidence carried into 12A-0:

```text
Twitch: at-or-over-window, 300 / 300, hasMore true
Kick:   at-or-over-window, 100 / 100
```

These are baseline inputs, not authorization to expand limits.

R12B external-state boundaries remain in force. Current Stripe Dashboard/account facts must be supported by direct evidence and must not be inferred from repository code or public browser behavior alone.

## Approved future sequence

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System implementation
```

Phase 16 branches must not be created before Phase 15 closes. Analytics work must not bypass approved data capture, capacity, calibration, coverage, and evidence gates.

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
