# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-10

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

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
Current phase Phase 12A Analytics Capture Foundation
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
Current workstream 12A-2 compact intraday rollup design and migration
Exact next implementation branch work-analytics-12a2-intraday-rollup-design
Next branch created no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior capability audit: `product/next-feature-data-capability-audit.md`
- 12A-0 baseline evidence: `audits/12a0-current-data-capacity-baseline.json`
- 12A-0 closeout evidence: `audits/12a0-closeout.json`
- 12A-1 field contract: `audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `audits/12a1-source-evidence.json`
- 12A-1 human contract: `product/analytics-field-contract-v1.md`
- 12A-1 acceptance: `operations/12a1-field-contract-acceptance-2026-07-10.md`
- 12A-1 closeout: `audits/12a1-closeout.json`
- 12A-1 closeout record: `operations/12a1-closeout-2026-07-10.md`
- Phase 12 release acceptance: `audits/phase12-release-acceptance.json`
- Phase 12 closeout contract: `audits/phase12-production-closeout-contract.json`
- Phase 12 release record: `operations/phase12-release-acceptance-2026-07-09.md`
- R12C-3 candidate evidence: `audits/r12c3-candidate-acceptance.json`
- R12C-3 candidate acceptance record: `operations/r12c3-release-candidate-acceptance-2026-07-09.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12A

Phase 12A captures and compacts evidence that current daily rollups cannot reconstruct later.

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 compact intraday rollup design and migration  current
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

### Completed 12A-0

12A-0 permanently records provider-separated production storage, cadence, source, coverage, rollup, field-loss, duration-boundary, and query timing evidence.

```text
Twitch raw rows: 8,688; retained payload: 314.14 MB; estimated: 10.38 MB/day
Kick raw rows: 14,442; retained payload: 232.96 MB; estimated: 4.63 MB/day
Latest 24h cadence: 287 / 288 for each provider
```

### Completed 12A-1

12A-1 froze provider-specific field semantics before migration design.

```text
Twitch provider_started_at: approved for future capture as provider_reported_start_time
Kick provider_started_at: unavailable until source verification
Twitch category capture: unapproved
Kick category capture: unapproved pending accepted live primary-path evidence
cross-provider category identity equivalence: prohibited
```

### Active 12A-2

Exact next branch:

```text
work-analytics-12a2-intraday-rollup-design
```

12A-2 must design bounded provider-separated compact intraday storage for 90-day baseline capability without extending raw retention. Migration remains blocked until provider-specific row, byte, retention, index, and query budgets are accepted against the 12A-0 baseline.

Required design evidence:

```text
rows/day
bytes/row
bytes/day
retained rows
retained size
index cost
query plan and timing target
refresh scope
retention policy
failure visibility
```

## Approved analytics program order

```text
Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
