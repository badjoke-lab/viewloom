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
R12C-0 message inventory               complete PR #484
R12C-1 launch copy and FAQ             complete PR #485
R12C-2 launch/share asset package      complete
R12C-3 release candidate acceptance    active
Exact next branch                      work-release-r12c3-release-candidate-acceptance
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
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 release candidate acceptance                active
```

Permanent R12C-1 package:

```text
docs/product/english-launch-copy.md
docs/audits/r12c1-launch-copy-package.json
docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md
```

The R12C-1 package provides one-line, short, and long descriptions; seven product-role summaries; coverage, provider-separation, cadence, and retention explanations; a 12-question FAQ; Status/help links; Support/legal links; and the English terminology contract.

The English package becomes the Phase 13–14 localization source after the approved program reaches localization.

## R12C-2 accepted package

R12C-2 fixed current production-surface screenshots and their evidence contract:

```text
apps/web/public/launch-assets/
docs/audits/r12c2-launch-assets-capture.json
docs/audits/r12c2-launch-asset-manifest.json
docs/product/launch-asset-captions.md
docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md
```

The package contains current desktop and mobile Portal screenshots plus representative Heatmap, Day Flow, Battle Lines, and History screenshots. The manifest records source route, viewport, capture time, intended use, captions, hashes, and public-surface evidence.

The generic `apps/web/public/og/viewloom.svg` remains usable as an identity card and is separate from the representative product screenshot package.

## Active R12C-3

R12C-3 is the Phase 12 release candidate acceptance workstream. It owns:

```text
full web typecheck
production build
public-surface inventory verification
Public Readiness
Public Browser Audit
affected responsive/accessibility gates
provider separation contracts
legal/support direct-link checks
outbound payment/support link checks
metadata/canonical/sitemap checks
deliberate hosted validation where required
exact production SHA smoke after merge
```

Phase 12A does not start until R12C-3 closes the full Phase 12 release acceptance.

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
