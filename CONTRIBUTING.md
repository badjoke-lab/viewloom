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
12A-0 current data and capacity baseline: complete PR #490
Current workstream: 12A-1 analytics field contract
Exact next implementation branch: work-analytics-12a1-field-contract
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Permanent 12A-0 evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md
docs/operations/12a0-closeout-2026-07-10.md
```

Active analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
```

## Active 12A-1 rules

12A-1 defines provider-specific analytics field contracts. It must not introduce the 12A-2 migration or analytics runtime.

Required decisions:

```text
minimum Twitch fields for baseline work
minimum Kick fields for baseline work
minimum provider-specific fields for observed-run work
minimum provider-specific fields for category work
Twitch started_at evidence strength and retention decision
verified Kick category source before category capture approval
versioned analytics source contracts
explicit provider differences without identity-equivalence claims
```

Do not include any of the following in 12A-1:

```text
D1 migration
compact intraday rollup generation
analytics UI
raw-retention extension
new high-frequency cron
unverified category capture
exact-session or exact-stream-end claims
cross-provider totals, rankings, baselines, or relationships
```

12A-0 baseline inputs remain evidence, not authorization to expand limits:

```text
Twitch raw rows: 8,688; retained payload 314.14 MB; estimated 10.38 MB/day
Kick raw rows: 14,442; retained payload 232.96 MB; estimated 4.63 MB/day
Latest 24h cadence: 287 / 288 for each provider
```

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
