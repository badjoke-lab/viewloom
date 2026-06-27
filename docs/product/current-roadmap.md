# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-27

## 1. Current position

```text
Phase 7 P7A   complete PR #426
Phase 8 P8A   complete PR #427
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
P9H0 closeout complete PR #432
Final-state correction complete PR #433
Phase 9 P9H1  complete PR #434
Phase 9 P9H2  complete PR #436
P9H2 canonical closeout complete PR #437
Active implementation branch: none
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
```

## Historical gate snapshots

The following values are retained for permanent acceptance gates and are not current execution state.

```text
Phase 9 P9H2  active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no

Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
P9H2 branch created: no
```

## 2. Verified state

- Local Watchlist v1 is complete through PR #425.
- The source-of-truth reset is complete through PR #426.
- Public-surface inventory and browser audit are complete through PR #428.
- The deterministic History baseline and governance closeout are complete through PR #433.
- History metric synchronization is complete through PR #434.
- History chart interpretation is complete through PR #436 and canonically closed through PR #437.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

P9H1 accepted evidence:

```text
Head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
```

P9H2 accepted evidence:

```text
Head: ccba4d4c29dd1442a684e35bafba23d392410365
Workflow run: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
```

The remaining deterministic History defect is `history-mobile-task-flow-too-long`, owned by P9H3/P9H5. The production/local keyboard discrepancy remains for P9H5 and final acceptance.

## 3. Authority map

```text
Product priority: docs/product/current-roadmap.md
Exact current state: docs/product/current-schedule.md
Complete Phase 7–16 program: docs/product/post-watchlist-program-plan.md
History repair: docs/product/history-ui-repair-spec.md
                docs/product/history-ui-repair-plan.md
                docs/work-in-progress/history-ui-repair-working-note.md
```

## 4. Ordered roadmap

```text
Phase 7   source-of-truth reset                              complete PR #426
Phase 8   inventory and browser defect audit                 complete PR #428
Phase 9   History P1 repair                                  P9H2 complete; P9H3 next
Phase 10  cross-site defect/UI/architecture repair           queued
Phase 11  acceptance, CI, type safety, monitoring            queued
Phase 12  English legal, Support, Stripe, release readiness  queued
Phase 13  localization foundation plus English/Japanese      approved and queued
Phase 14  Spanish/pt-BR localization and staged launch       approved and queued
Phase 15  next-feature data-capability audit                 queued
Phase 16  one separately approved major feature              not approved
```

No Phase 16 feature is approved.

## 5. Phase 9 sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      complete PR #436
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H2 repairs chart interpretation: readable UTC date ticks, numeric scale, visible metric and unit, exact daily detail, chart/URL/Selected-day synchronization, pointer/keyboard/touch inspection, complete/partial/in-progress/missing/demo distinction without color alone, and accessible SVG semantics. Day inspection reuses the loaded response.

P9H3 repairs Overview hierarchy. P9H4 repairs Archives and publishing hierarchy. P9H5 repairs responsive/accessibility behavior and the production/local keyboard discrepancy. P9H6–P9H7 perform candidate and production acceptance.

## 6. Stop rule

P9H2 is complete and canonically closed through PR #437. Do not create `work-history-ui-h3-overview` until explicit continuation is received. After every merge, issue the full report and stop.