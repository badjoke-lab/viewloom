# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 6.5
Last updated: 2026-07-09
Current phase: Phase 12 — English release readiness
Current workstream: R12C-1 launch copy and FAQ
Exact next implementation branch: `work-release-r12c1-launch-copy-faq`
Next branch created: no

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness complete through R12B-2
R12C-0 message inventory complete
R12C-1 launch copy and FAQ active
R12C-2 launch/share asset package queued
R12C-3 release candidate acceptance queued
Phase 12A Analytics Capture Foundation approved and queued
Phase 13-14 localization queued after Phase 12A
Phase 15 Analytics Capability and Calibration Audit queued
Phase 16 Analytics Observation System approved and gated by Phase 15
```

## Program sequence

```text
Phase 12 English release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

## Phase 12 authorities

```text
docs/product/release-readiness-spec.md
docs/product/release-readiness-plan.md
docs/work-in-progress/phase12-release-readiness.md
```

Sequence:

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         active
R12C-2 launch/share asset package                  queued
R12C-3 release candidate acceptance                queued
```

## R12C-0 closeout

Permanent evidence:

```text
docs/audits/r12c0-message-inventory.json
docs/audits/r12c0-message-inventory.md
docs/operations/r12c0-message-inventory-2026-07-09.md
```

R12C-0 inventoried:

```text
Portal/About source messages
provider-specific description boundaries
Heatmap / Day Flow / Battle Lines / History roles
Channel / Local Watchlist / Status utility roles
cadence / retention / coverage boundaries
Twitch/Kick separation wording
Status/help/support/legal routes
FAQ source material
English terminology candidates
repo-owned generic OG asset
CI screenshot evidence source
R12C-1 message gaps
R12C-2 asset gaps
```

## R12C-1 active scope

Produce and integrate, as appropriate:

```text
one-line product description
short listing description
long product description
feature-role summary
coverage limitations
provider separation explanation
retention explanation
FAQ
Support/legal links
Status/help links
```

R12C-1 copy must remain evidence-bounded. It must use the R12C-0 inventory rather than invent new platform-wide coverage, official analytics, unique-viewer, exact-revenue, exact-session, combined-provider, or cross-platform ranking claims.

English remains the source language for Phase 13–14.

## R12C-2 queued scope

The current repo-owned share asset is the generic `apps/web/public/og/viewloom.svg`. Public Browser screenshots are CI acceptance artifacts rather than a curated launch package.

R12C-2 therefore owns curated current desktop/mobile screenshots, representative feature screenshots, a source-route/viewport/date/use manifest, and bounded captions.

## Phase 12A purpose

Phase 12A begins data capture and compact aggregation for facts that existing daily rollups cannot reconstruct later. It starts only after R12C-3 closes Phase 12.

```text
current capacity baseline
analytics field contract
compact intraday rollup model
bounded rollup generation
provider-specific category capture foundation
production acceptance and accumulation handoff
```

Capacity observations carried forward:

```text
Twitch 300/300 at-or-over-window
Kick 100/100 at-or-over-window
```

They are baseline inputs, not authorization to expand observed windows.

## Phase 13-14 relationship to analytics

Localization remains the active product program after Phase 12A. During localization, compact intraday/category evidence may accumulate, while Phase 16 feature work remains blocked until Phase 15.

## Phase 15 purpose

```text
sample support thresholds
baseline fallback hierarchy
baseline configuration v1
anomaly rule candidate v1
observed-run gap/confidence policy
category coverage policy
relationship candidate policy
replay execution policy
storage/query budget evidence
```

## Phase 16 purpose

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

The program does not authorize raw-retention expansion, high-frequency cron growth, all-pairs continuous computation, unsupported causal attribution, provider mixing, or constant LLM inference.

Permanent analytics authorities:

- `docs/product/analytics-observation-system-spec.md`
- `docs/product/analytics-observation-system-plan.md`
- `docs/product/next-feature-data-capability-audit.md`
