# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, storage, rankings, exports, baselines, relationships, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry and repeated temporal relationships
- History = Trends and retained analytical evidence
- Channel = one retained channel footprint and future personal baseline/run interpretation
- Local Watchlist = browser-local saved evidence

## Current state

```text
Local Watchlist v1                     complete PR #425
Phase 8 inventory/browser audit        complete PR #428
Phase 9 History P1 repair              complete
Phase 10 quality program               complete through U10H
Phase 11 P11A-P11G                     complete
Phase 11 production closeout           complete
Phase 12 English release readiness     complete
R12A legal/support public surface      complete
R12B Stripe/support readiness          complete through R12B-2
R12C-0 message inventory               complete PR #484
R12C-1 launch copy and FAQ             complete PR #485
R12C-2 launch/share asset package      complete PR #486
R12C-3 release candidate acceptance    complete PR #487
Phase 12A Analytics Capture Foundation current
Current workstream                     12A-0 current data and capacity baseline
Exact next implementation branch       work-analytics-12a0-current-data-capacity-baseline
Next branch created                    no
```

## Phase 12 permanent acceptance

Phase 12 closed with exact production SHA acceptance.

```text
R12C-3 merge SHA
32c27a9a772cb62ff38f009c5fd1bb095ac27ad8

Production Smoke run
28993206779

Production Smoke artifact
8188712759

Independent closeout probe
28993547481
```

Permanent evidence:

```text
docs/audits/phase12-release-acceptance.json
docs/operations/phase12-release-acceptance-2026-07-09.md
docs/audits/r12c3-candidate-acceptance.json
docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

Accepted production facts include 25 public routes, separate Twitch/Kick provider bindings, fresh provider observations, zero provider-crossing failures, zero blocking monitoring alerts, and passing explicit 404 evidence.

## Retained launch packages

R12C-1 English source package:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md
```

R12C-2 production-surface launch/share package:

```text
apps/web/public/launch-assets/
docs/audits/r12c2-launch-assets-capture.json
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md
```

The English package becomes the source language for Phase 13–14 localization. The launch/share package contains current Portal desktop/mobile and representative Twitch Heatmap, Day Flow, Battle Lines, and History screenshots with source routes, viewports, capture evidence, captions, byte sizes, and SHA-256 values.

## Current Phase 12A program

Phase 12A starts with **12A-0 current data and capacity baseline**.

The first workstream is evidence-only. It records current D1/storage/query/cadence/capacity facts before schema migration or analytics runtime changes. Closeout observations carried forward are:

```text
Twitch 300 / 300  at-or-over-window
Kick   100 / 100  at-or-over-window
```

These observations do not authorize larger collection windows, raw-retention extension, provider combination, or stronger coverage claims.

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
Phase 13-14 localization while analytics evidence accumulates
Phase 15 Analytics Capability and Calibration Audit
Phase 16A Baseline Engine
Phase 16B Anomaly Detection
Phase 16C Observed Run Intelligence
Phase 16D Category-relative Analysis
Phase 16E Co-movement and Relationship Analysis
Phase 16F Replay and Backtest
```

The analytics target is:

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

Permanent analytics authorities:

```text
docs/product/analytics-observation-system-spec.md
docs/product/analytics-observation-system-plan.md
docs/product/next-feature-data-capability-audit.md
```

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate runtime validation uses `preview-*` only when necessary. Only latest-head evidence counts.
