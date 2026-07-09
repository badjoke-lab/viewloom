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
R12A complete
R12B complete through R12B-2
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream 12A-0 current data and capacity baseline
Exact next implementation branch work-analytics-12a0-current-data-capacity-baseline
Next branch created no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 12 permanent acceptance: `audits/phase12-release-acceptance.json`
- Phase 12 operations record: `operations/phase12-release-acceptance-2026-07-09.md`
- R12C-3 candidate evidence: `audits/r12c3-candidate-acceptance.json`
- R12C-3 candidate acceptance record: `operations/r12c3-release-candidate-acceptance-2026-07-09.md`
- R12C-3 contract: `audits/r12c3-release-candidate-contract.json`
- R12C-2 asset manifest: `audits/r12c2-launch-asset-manifest.json`
- R12C-1 English source package: `product/english-launch-copy.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

Current Phase 12A analytics authorities:

- `product/analytics-observation-system-spec.md`
- `product/analytics-observation-system-plan.md`
- `product/next-feature-data-capability-audit.md`

## Phase 12 closeout

Phase 12 is complete.

```text
R12C-3 merge SHA
32c27a9a772cb62ff38f009c5fd1bb095ac27ad8

Production Smoke run
28993206779

Production Smoke artifact
8188712759

Independent closeout probe run
28993547481
```

Permanent acceptance records:

```text
audits/phase12-release-acceptance.json
operations/phase12-release-acceptance-2026-07-09.md
```

The exact merged `main` SHA passed production deployment identity, 25-route smoke, separate provider binding, collector freshness, monitoring, and explicit 404 verification. The independent closeout probe re-downloaded and re-verified the Production Smoke artifact before permanent closeout.

## Retained Phase 12 packages

R12C-1 source language:

```text
product/english-launch-copy.md
audits/r12c1-launch-copy-package.json
operations/r12c1-launch-copy-acceptance-2026-07-09.md
```

R12C-2 launch/share assets:

```text
../apps/web/public/launch-assets/
audits/r12c2-launch-assets-capture.json
audits/r12c2-launch-asset-manifest.json
product/launch-asset-captions.md
operations/r12c2-launch-assets-acceptance-2026-07-09.md
```

R12C-3 candidate acceptance:

```text
audits/r12c3-candidate-acceptance.json
operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

## Current Phase 12A program

Phase 12A Analytics Capture Foundation is current. Exact next workstream:

```text
12A-0 current data and capacity baseline
branch: work-analytics-12a0-current-data-capacity-baseline
```

12A-0 is evidence-only. It records current D1/storage/query/cadence/capacity facts before migration or runtime changes.

Capacity observations carried forward from Phase 12 closeout:

```text
Twitch 300/300  at-or-over-window
Kick   100/100  at-or-over-window
```

These observations do not authorize larger collection windows, raw-retention extension, provider combination, or stronger coverage claims.

## Approved forward order

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

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
