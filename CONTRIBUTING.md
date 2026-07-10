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
12A-1 analytics field contract: complete PR #492
Current workstream: 12A-2 compact intraday rollup design and migration
Exact next implementation branch: work-analytics-12a2-intraday-rollup-design
Next branch created: no
```

Permanent Phase 12 acceptance:

```text
docs/audits/phase12-release-acceptance.json
docs/audits/phase12-production-closeout-contract.json
docs/operations/phase12-release-acceptance-2026-07-09.md
```

Permanent Phase 12A evidence:

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a0-closeout.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a1-closeout.json
docs/product/analytics-field-contract-v1.md
docs/operations/12a1-field-contract-acceptance-2026-07-10.md
docs/operations/12a1-closeout-2026-07-10.md
```

## Active 12A-2 rules

12A-2 designs and budgets provider-separated compact intraday storage before migration.

Required provider-specific evidence:

```text
rows per day
bytes per row
bytes per day
retained rows
retained size
index cost
query plan
query timing target
refresh scope
retention policy
failure visibility
```

The design must be compared against the accepted 12A-0 baseline:

```text
Twitch estimated raw payload baseline 10.38 MB/day
Kick estimated raw payload baseline    4.63 MB/day
```

12A-1 source contracts remain authoritative:

```text
Twitch provider_started_at may be used only as provider_reported_start_time evidence
Kick provider_started_at remains unavailable until source verification
Twitch category capture remains unapproved
Kick category capture remains unapproved pending accepted live primary-path evidence
cross-provider category identity equivalence is prohibited
```

Do not include any of the following before budget acceptance:

```text
migration deployment
raw-retention extension
new high-frequency cron by default
category capture activation
exact-session claims
cross-provider totals, rankings, baselines, categories, or relationships
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
