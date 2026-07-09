# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-09

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 10 complete through U10H
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness active
R12A legal and support public-surface completion complete
R12B Stripe and support-flow readiness complete through R12B-2
R12C-0 message inventory complete PR #484
R12C-1 launch copy and FAQ complete PR #485
R12C-2 launch/share asset package complete PR #486
R12C-3 premerge candidate accepted
Current workstream R12C-3 hosted exact-SHA closeout pending after candidate merge
Exact active implementation branch work-release-r12c3-release-candidate-acceptance
Active branch created yes
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 12 specification: `product/release-readiness-spec.md`
- Phase 12 implementation plan: `product/release-readiness-plan.md`
- Active Phase 12 record: `work-in-progress/phase12-release-readiness.md`
- R12C-3 candidate contract: `audits/r12c3-release-candidate-contract.json`
- R12C-3 candidate evidence: `audits/r12c3-candidate-acceptance.json`
- R12C-3 candidate acceptance record: `operations/r12c3-release-candidate-acceptance-2026-07-09.md`
- R12A production evidence: `audits/r12a-production-acceptance.json`
- R12B-0 audit: `audits/r12b-evidence-and-configuration-audit.json`
- R12B-1 acceptance: `operations/r12b1-support-transition-acceptance-2026-07-09.md`
- R12B-2 acceptance: `operations/r12b2-refund-disclosure-acceptance-2026-07-09.md`
- R12C-0 inventory: `audits/r12c0-message-inventory.json`
- R12C-0 closeout: `operations/r12c0-message-inventory-2026-07-09.md`
- R12C-1 English source package: `product/english-launch-copy.md`
- R12C-1 structured package: `audits/r12c1-launch-copy-package.json`
- R12C-1 acceptance: `operations/r12c1-launch-copy-acceptance-2026-07-09.md`
- R12C-2 capture evidence: `audits/r12c2-launch-assets-capture.json`
- R12C-2 asset manifest: `audits/r12c2-launch-asset-manifest.json`
- R12C-2 captions: `product/launch-asset-captions.md`
- R12C-2 acceptance: `operations/r12c2-launch-assets-acceptance-2026-07-09.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12 sequence

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C-0 message inventory                           complete
R12C-1 launch copy and FAQ                         complete
R12C-2 launch/share asset package                  complete
R12C-3 premerge candidate acceptance               complete
R12C-3 exact production SHA closeout                pending after merge
```

## R12C-1 source-language contract

The approved English package contains one-line, short, and long descriptions; seven product-role summaries; provider-specific coverage limitations; Twitch/Kick separation; collection and retention explanations; a 12-question FAQ; Status/help links; Support/legal links; and the English terminology contract.

It becomes the source-language package for Phase 13–14 localization after the approved program reaches localization.

## R12C-2 accepted asset contract

R12C-2 owns the six current production-surface screenshots and their reusable external-use evidence:

```text
apps/web/public/launch-assets/
audits/r12c2-launch-assets-capture.json
audits/r12c2-launch-asset-manifest.json
product/launch-asset-captions.md
operations/r12c2-launch-assets-acceptance-2026-07-09.md
```

The package records source route, viewport, capture time, intended use, bounded captions, public-surface facts, byte size, and SHA-256 for each asset.

## R12C-3 candidate acceptance

The accepted premerge candidate evidence is fixed in:

```text
audits/r12c3-candidate-acceptance.json
operations/r12c3-release-candidate-acceptance-2026-07-09.md
```

The accepted candidate head `52584565ae3ac4b10509df68c90692915f7fe475` passed the dedicated R12C-3 workflow run `28992701959`, including typecheck/build, Content/SEO, Public Readiness, the 25-route × 4-viewport = 100-scenario browser matrix with 0 violations, candidate Support-to-Stripe transition, and candidate Refund/Disclosure consistency.

Candidate merge alone does not complete Phase 12. After candidate merge, the exact merged `main` SHA must appear in production `deployment.json` and pass hosted Production Smoke/monitoring acceptance before permanent Phase 12 release acceptance is recorded and the temporary Phase 12 working note is retired.

## Approved analytics program authorities

- Analytics Observation System specification: `product/analytics-observation-system-spec.md`
- Analytics Observation System implementation plan: `product/analytics-observation-system-plan.md`
- Prior next-feature capability audit: `product/next-feature-data-capability-audit.md`

Approved forward order:

```text
Phase 12 English release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A Baseline Engine
  -> Phase 16B Anomaly Detection
  -> Phase 16C Observed Run Intelligence
  -> Phase 16D Category-relative Analysis
  -> Phase 16E Co-movement and Relationship Analysis
  -> Phase 16F Replay and Backtest
```

Phase 12A remains blocked until R12C-3 closes the full Phase 12 release acceptance.
