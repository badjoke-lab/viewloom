# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-09

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
Current workstream 12A-0 current data and capacity baseline
Exact next implementation branch work-analytics-12a0-capacity-baseline
Next branch created no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior capability audit: `product/next-feature-data-capability-audit.md`
- Phase 12 release acceptance: `audits/phase12-release-acceptance.json`
- Phase 12 closeout contract: `audits/phase12-production-closeout-contract.json`
- Phase 12 release record: `operations/phase12-release-acceptance-2026-07-09.md`
- R12C-3 candidate evidence: `audits/r12c3-candidate-acceptance.json`
- R12C-3 candidate acceptance record: `operations/r12c3-release-candidate-acceptance-2026-07-09.md`
- R12C-2 capture evidence: `audits/r12c2-launch-assets-capture.json`
- R12C-2 asset manifest: `audits/r12c2-launch-asset-manifest.json`
- R12C-2 captions: `product/launch-asset-captions.md`
- R12C-1 English source package: `product/english-launch-copy.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Phase 12 permanent closeout

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 premerge candidate acceptance               complete
R12C-3 exact production SHA closeout                complete
```

Accepted production identity:

```text
Expected main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Deployed SHA:      32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
HTML routes: 25
Status APIs: 2
Sitemap URLs: 21
Launch assets: 6
Blocking alerts: 0
```

The permanent Phase 12 release evidence also records Twitch `300/300` with `hasMore=true` and Kick `100/100` as at-or-over-window capacity observations. These are Phase 12A-0 baseline inputs and do not authorize collection-limit expansion.

The R12B external-state evidence boundary remains in force: repository/public-browser evidence does not prove unobserved current Stripe Dashboard/account state.

## Active Phase 12A

Phase 12A begins evidence capture and compact aggregation for facts that current daily rollups cannot reconstruct later.

Sequence:

```text
12A-0 current data and capacity baseline            active
12A-1 analytics field contract                      queued
12A-2 compact intraday rollup design and migration  queued
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

### Active 12A-0

Exact next branch:

```text
work-analytics-12a0-capacity-baseline
```

12A-0 must record current D1 row counts, payload size, oldest/latest raw bucket, daily-rollup counts, collector duration, relevant query timings, provider source modes and coverage behavior, five-minute cadence and retention behavior, the current field matrix, and upstream fields discarded before storage.

12A-0 is evidence-only. No runtime change is allowed.

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
