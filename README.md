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
Phase 12 English release readiness     active
R12A legal/support public surface      complete
R12A implementation                    merged PR #477
R12A production acceptance             pass
Current workstream                     R12B-0 evidence and configuration audit
Exact next branch                      work-release-r12b-stripe-support-flow
Next branch created                    no
```

Permanent R12A evidence:

```text
docs/audits/phase12-r12a-legal-support-baseline.json
docs/audits/r12a-production-acceptance.json
docs/operations/r12a-production-acceptance-2026-07-08.md
```

R12A production acceptance verified:

```text
Merged main SHA: 952f0008209363f4fd5b22587975ac247ee8d6f2
25 repository-owned HTML routes
2 provider status APIs
0 provider crossing failures
0 blocking monitoring alerts
explicit 404 behavior
```

The following routes are production accepted and resolved:

```text
/contact/
/terms/
/privacy/
/refund-policy/
/commerce-disclosure/
```

## Active Phase 12

Phase 12 authorities:

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             active
R12C English launch package and release acceptance queued
```

R12B audits the actual support/payment transition, Payment Link behavior, refund/disclosure consistency, and the external evidence needed to support Stripe configuration claims. Repository facts, hosted public behavior, and Stripe dashboard/account facts must remain distinct.

## Approved forward sequence

```text
Phase 12 English release readiness
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

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate Cloudflare validation uses `preview-*` only when runtime validation is necessary. Only latest-head evidence counts. Phase 12A and later analytics work must not bypass their approved entry gates.
