# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-10

```text
Phase 8 P8B complete PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete PR #451
P9H7 canonical closeout complete PR #453
Phase 10 U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness complete through R12B-2
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

## Phase 12 permanent acceptance

- Release acceptance evidence: `../audits/phase12-release-acceptance.json`
- Production closeout contract: `../audits/phase12-production-closeout-contract.json`
- Release acceptance record: `../operations/phase12-release-acceptance-2026-07-09.md`
- R12C-3 candidate evidence: `../audits/r12c3-candidate-acceptance.json`
- R12C-3 candidate record: `../operations/r12c3-release-candidate-acceptance-2026-07-09.md`

Accepted production identity:

```text
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:      32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Environment: production
Branch: main
HTML routes: 25
Status APIs: 2
Sitemap URLs: 21
Launch assets: 6
Blocking alerts: 0
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`
- 12A-0 production baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-0 closeout: `../audits/12a0-closeout.json`
- 12A-0 acceptance record: `../operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md`
- 12A-0 closeout record: `../operations/12a0-closeout-2026-07-10.md`

Phase 12A purpose:

```text
begin collecting and compacting evidence that current daily rollups cannot reconstruct later
preserve Free Strong constraints
measure storage/query budgets before migration
retain Twitch/Kick provider separation
avoid analytics UI before evidence and calibration gates
```

## Completed 12A-0 baseline

12A-0 completed as evidence-only work. Permanent evidence records current D1 row counts, payload size, oldest/latest raw buckets, rollup observations, query timing, provider source and coverage modes, five-minute cadence behavior, retention schedules, field matrix, upstream discarded fields, and the current collector-duration measurement boundary.

```text
Twitch raw rows: 8,688
Twitch retained payload: 314.14 MB
Twitch estimated payload/day: 10.38 MB
Twitch rollup observed days: 74

Kick raw rows: 14,442
Kick retained payload: 232.96 MB
Kick estimated payload/day: 4.63 MB
Kick rollup observed days: 52

Latest 24h cadence: 287 / 288 for each provider
```

No migration or runtime change was authorized by 12A-0.

## Active 12A-1 boundary

12A-1 is the analytics field-contract workstream.

Required decisions:

```text
minimum provider-specific baseline fields
minimum provider-specific observed-run fields
minimum provider-specific category fields
Twitch started_at evidence strength and retention decision
verified Kick category source before capture approval
versioned analytics source contracts
explicit provider differences without identity-equivalence claims
```

12A-1 must not introduce a D1 migration, compact-rollup generation, analytics UI, raw-retention extension, a new high-frequency cron, unverified category capture, exact-session claims, or cross-provider analytics.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
  12A-0 current data and capacity baseline            complete PR #490
  12A-1 analytics field contract                      current
  12A-2 compact intraday rollup design and migration  queued
  12A-3 bounded intraday rollup generation            queued
  12A-4 category capture foundation                    queued
  12A-5 foundation acceptance and accumulation handoff queued
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16A Baseline Engine
Phase 16B Anomaly Detection
Phase 16C Observed Run Intelligence
Phase 16D Category-relative Analysis
Phase 16E Co-movement and Relationship Analysis
Phase 16F Replay and Backtest
```

Phase 16 implementation remains gated by Phase 15 evidence, calibration, storage cost, query cost, coverage, and false-positive acceptance.
