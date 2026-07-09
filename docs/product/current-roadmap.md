# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-09

```text
Phase 8 P8B complete PR #428
Phase 9 History P1 repair complete
Phase 10 U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A complete PR #477
R12B complete through R12B-2 PR #481-#483
R12C-0 complete PR #484
R12C-1 complete PR #485
R12C-2 complete PR #486
R12C-3 complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream: 12A-0 current data and capacity baseline
Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline
Next branch created: no
```

## Phase 12 closeout evidence

Permanent acceptance:

```text
../audits/phase12-release-acceptance.json
../operations/phase12-release-acceptance-2026-07-09.md
```

Exact production acceptance:

```text
main SHA: 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8
Production Smoke run: 28993206779
Production Smoke artifact: 8188712759
Independent closeout probe run: 28993547481
Result: pass
```

Phase 12 sequence is fully complete:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 release candidate acceptance                complete
```

## Current Phase 12A program

Phase 12A builds the capture and compact aggregation foundation required before later analytics features.

Exact next workstream:

```text
12A-0 current data and capacity baseline
branch: work-analytics-12a0-current-data-capacity-baseline
```

12A-0 records current storage/query/cadence/capacity facts before schema migration or runtime changes.

Capacity observations carried forward from Phase 12 closeout:

```text
Twitch 300/300  at-or-over-window
Kick   100/100  at-or-over-window
```

They are baseline inputs, not authorization to expand observed windows, extend raw retention, combine providers, or strengthen coverage claims.

Phase 12A workstream order:

```text
12A-0 current data and capacity baseline
12A-1 analytics field contract
12A-2 compact intraday rollup design and migration
12A-3 bounded intraday rollup generation
12A-4 provider-specific category capture foundation
12A-5 production acceptance and accumulation handoff
```

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16 Analytics Observation System program
  Phase 16A Baseline Engine
  Phase 16B Anomaly Detection
  Phase 16C Observed Run Intelligence
  Phase 16D Category-relative Analysis
  Phase 16E Co-movement and Relationship Analysis
  Phase 16F Replay and Backtest
```

Phase 16 implementation remains gated by Phase 15 evidence, calibration, storage cost, and query-cost acceptance.
