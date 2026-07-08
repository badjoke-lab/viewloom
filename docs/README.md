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
Current workstream R12C-0 message inventory
Exact next implementation branch work-release-r12c0-message-inventory
Next branch created no
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Phase 12 specification: `product/release-readiness-spec.md`
- Phase 12 implementation plan: `product/release-readiness-plan.md`
- Active Phase 12 record: `work-in-progress/phase12-release-readiness.md`
- R12A production evidence: `audits/r12a-production-acceptance.json`
- R12B-0 audit: `audits/r12b-evidence-and-configuration-audit.json`
- R12B repository consistency record: `audits/r12b-repository-consistency-notes.md`
- R12B-0 operation record: `operations/r12b0-evidence-audit-2026-07-09.md`
- R12B-1 acceptance: `operations/r12b1-support-transition-acceptance-2026-07-09.md`
- R12B-2 acceptance: `operations/r12b2-refund-disclosure-acceptance-2026-07-09.md`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`
- Permanent Phase 11 closeout: `operations/phase11-production-closeout-2026-07-08.md`
- Permanent U10H production acceptance: `operations/u10h-production-acceptance-2026-07-04.md`

## Active Phase 12 sequence

```text
R12A legal and support public-surface completion   complete
R12B Stripe and support-flow readiness             complete
R12C English launch package and release acceptance active at R12C-0
```

R12B accepted the public Support-to-Stripe path, desktop/mobile transition behavior, refund/disclosure wording consistency, legal-link availability, and mobile Back/return behavior. Current external Stripe Dashboard/account facts that were not directly proven remain explicitly pending and are not converted into current-state claims.

## R12C-0 scope

R12C-0 inventories the current English source package before launch copy is written:

```text
Portal and About descriptions
feature-role descriptions
bounded-data and coverage limitations
Twitch/Kick separation explanation
Status and methodology/help links
Support and legal links
FAQ-like explanations
current screenshots and share assets
missing launch explanations and assets
approved terminology candidates
```

The exact next implementation branch is `work-release-r12c0-message-inventory`, which must not be created before the R12B-2 closeout PR merges and that merge is verified.

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
