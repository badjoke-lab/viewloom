# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.5
Created: 2026-06-25
Last updated: 2026-06-27
Current phase: Phase 9 — P9H2 complete; P9H3 next
Current implementation branch: none
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed metric synchronization: PR #434
Completed chart interpretation: PR #436
Completed P9H2 canonical closeout: PR #437
Exact next implementation branch after explicit continuation: `work-history-ui-h3-overview`

## Historical P9H2 active snapshot

The following values describe the program before PR #436 merged. They are retained for permanent P9H2 gates and are not current execution state.

```text
Version: 2.4
Current phase: Phase 9 — P9H2 chart interpretation
Current implementation branch: `work-history-ui-h2-chart`
| 9 | P9H2 | active
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   exact next after P9H2 merge and explicit continuation; not created
```

## Historical P9H1 closeout snapshot

```text
Version: 2.3
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created
```

## 1. Purpose

This document owns the complete approved execution program after Local Watchlist v1. Before each branch, compare the schedule with actual branches/PRs, confirm explicit continuation, read affected specifications/plans, and record missing work. After each merge, update canonical state, issue the full report, name the next branch, and stop.

## 2. Program status

| Phase | Window | State | Authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | source reset | repair program locked |
| 8 | P8A | complete PR #427 | public inventory | owned surfaces inventoried |
| 8 | P8B | complete PR #428 | browser audit | evidence complete |
| 9 | P9H0 | complete PR #430 | History baseline | deterministic baseline fixed |
| 9 | closeout | complete PR #432 | governance closeout | authorities aligned |
| 9 | final-state | complete PR #433 | canonical correction | P9H1 entry exact |
| 9 | P9H1 | complete PR #434 | `history-ui-repair-plan.md` | metric execution synchronized |
| 9 | P9H2 | complete PR #436 | `history-ui-repair-plan.md` | chart interpretation accepted |
| 9 | P9H2-closeout | complete PR #437 | canonical state | P9H3 entry exact |
| 9 | P9H3–P9H7 | queued | `history-ui-repair-plan.md` | History repair accepted in production |
| 10 | U10A–U10H | queued | cross-site quality plan | reproduced quality issues accepted |
| 11 | O11A–O11G | queued | engineering/operations plan | acceptance, CI, type safety, monitoring locked |
| 12 | R12A–R12C | queued | release readiness | English legal/Support/Stripe package complete |
| 13 | I13A–I13K | queued | localization plan | English/Japanese accepted |
| 14 | I14A–I14C | queued | localization plan | Spanish/pt-BR accepted |
| 14 | L14A–L14C | queued | launch plan | staged launch complete |
| 15 | N15A–N15B | queued | next-feature audit | zero or one candidate approved |
| 16 | feature-specific | not approved | new specification required | separately approved feature accepted |

## 3. Completed P9H0–P9H2

P9H0 completed through PR #430. Documentation/program closeout completed through PR #432. Canonical entry state was corrected through PR #433. P9H1 completed through PR #434. P9H2 completed through PR #436 and was canonically closed through PR #437.

P9H1 evidence:

```text
Final head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Workflow: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

P9H2 evidence:

```text
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow: 28278497196
Artifact: history-ui-h2-chart / 7921020539
Digest: sha256:e6eeb9b2d1dad28237ad467554f4e1adcff5b4cc56577a8525d2d1cb1bb316ea
```

P9H2 requires readable UTC date ticks, numeric scale, visible metric/unit, pointer/keyboard/touch day inspection, selected-day synchronization, exact daily detail, complete/partial/in-progress/missing/demo distinction, accessible SVG semantics, and a non-color-only legend. Day inspection reuses the loaded History response and does not cross provider boundaries.

## 4. Phase 9 sequence

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

### P9H3 — Overview hierarchy

Require metric-aware Summary, useful Selected-day analysis, coherent comparison/calendar/ranking/coverage order, compact mobile task flow, and removal of duplicate or placeholder facts.

### P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing hierarchy while preserving Back/Forward, no-refetch switching, and output schemas.

### P9H5 — responsive and accessibility

Reconcile required widths; resolve the production/local keyboard discrepancy; repair touch/keyboard inspection, focus, targets, wrapping, contrast, forced colors, and mobile density.

### P9H6–P9H7

Run the complete local candidate and all permanent gates, then one deliberate `preview-*` candidate for real-data and exact production acceptance.

## 5. Later phases

```text
Phase 10  cross-site defect/UI/architecture repair
Phase 11  acceptance, CI, type safety, monitoring, maintenance
Phase 12  English legal, Support, Stripe, release readiness
Phase 13  English/Japanese localization
Phase 14  Spanish/pt-BR localization and staged launch
Phase 15  next-feature data-capability audit
Phase 16  not approved
```

Initial locales are `en`, `ja`, `es`, and `pt-BR`. Arabic/RTL requires separate evidence and approval. Phase 16 begins only after one candidate is separately approved and receives a new permanent specification, implementation plan, and acceptance plan.

## 6. Stop rule

P9H2 is complete and canonically closed through PR #437. Do not create `work-history-ui-h3-overview` until explicit continuation is received. After every merge, issue the full report and stop.