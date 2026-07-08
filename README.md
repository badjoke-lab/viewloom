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
R12B Stripe/support readiness          complete through R12B-2
R12C-0 message inventory               complete
R12C-1 launch copy and FAQ             active
Exact next branch                      work-release-r12c1-launch-copy-faq
Next branch created                    no
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

Permanent R12C-0 evidence:

```text
docs/audits/r12c0-message-inventory.json
docs/audits/r12c0-message-inventory.md
docs/operations/r12c0-message-inventory-2026-07-09.md
```

R12C-0 inventoried current Portal/About messages, provider-specific descriptions, feature roles, cadence/retention/coverage boundaries, Twitch/Kick separation wording, Status/help/support/legal links, FAQ source material, terminology candidates, the current generic OG asset, CI screenshot evidence sources, and missing launch messages/assets.

## Active R12C-1

R12C-1 produces the evidence-bounded English launch package:

```text
one-line description
short listing description
long description
feature-role summary
coverage limitations
provider separation explanation
retention explanation
FAQ
Support/legal links
Status/help links
```

R12C-1 must not claim complete platform coverage, official analytics, unique viewers, exact creator revenue, exact session reconstruction, combined Twitch/Kick audience totals, or cross-platform rankings.

R12C-2 remains responsible for a curated screenshot/share package. The current `apps/web/public/og/viewloom.svg` is a generic identity card, while Public Browser screenshots are CI acceptance artifacts rather than a curated launch package.

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

Canonical reading starts at `docs/README.md`. Ordinary work uses `work-*`; deliberate runtime validation uses `preview-*` only when necessary. Only latest-head evidence counts. Phase 12A remains blocked until R12C-3 closes Phase 12.
