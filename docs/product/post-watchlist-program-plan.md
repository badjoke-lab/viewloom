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

The following exact values describe the source-of-truth program before PR #436 merged. They are retained for permanent P9H2 gates and are not the current execution state.

```text
Version: 2.4
Current phase: Phase 9 — P9H2 chart interpretation
Current implementation branch: `work-history-ui-h2-chart`
| 9 | P9H2 | active
P9H2 work-history-ui-h2-chart      active
P9H3 work-history-ui-h3-overview   exact next after P9H2 merge and explicit continuation; not created
```

## Historical P9H1 closeout snapshot

The following exact values describe the source-of-truth program immediately after PR #435. They are retained for historical acceptance gates and are not the current execution state.

```text
Version: 2.3
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created
```

## 1. Purpose

This document owns the complete approved execution program after Local Watchlist v1.

```text
current-roadmap.md                 product priority
current-schedule.md                exact current state and branch
post-watchlist-program-plan.md     complete Phase 7–16 program
feature/quality specifications     stable product contracts
implementation plans               branch sequence and gates
working notes                      unstable execution memory
audit/acceptance records           evidence baseline
```

Before each branch, compare the schedule with actual branches/PRs, confirm explicit continuation, read affected specifications/plans, and record missing work. After each merge, update canonical state, issue the full report, name the next branch, and stop.

## 2. Program status

| Phase | Window | State | Authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | source reset | repair program locked |
| 8 | P8A | complete PR #427 | public inventory | 21 owned surfaces inventoried |
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
| 14 | L14A–L14C | queued | launch plan | staged launch and feedback classification complete |
| 15 | N15A–N15B | queued | next-feature audit | zero or one candidate approved |
| 16 | feature-specific | not approved | new specification required | separately approved feature accepted |

## 3. Completed Phase 7–8

P7A completed through PR #426. P8A completed through PR #427 with 21 owned surfaces. P8B completed through PR #428 with 84 production route scenarios, five policy/disclosure probes, ten deterministic History scenarios, and no P0 result.

## 4. Completed P9H0–P9H2

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

P9H1 synchronizes Viewer-minutes and Peak viewers across URL, request, chart, Summary, Selected day, comparison, Ranking context, Daily archive, Report, Share, and Exports. It preserves provider separation, one request per uncached provider/period/metric state, local task no-refetch, degraded states, and output schemas. Daily rows without observations are excluded from metric-day selection.

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

### P9H2 — chart interpretation

P9H2 requires readable UTC date ticks, numeric scale, visible metric/unit, pointer/keyboard/touch day inspection, selected-day synchronization, exact daily detail, complete/partial/in-progress/missing/demo distinction, accessible SVG title and description, and a non-color-only legend. Day inspection reuses the loaded History response and does not cross provider boundaries.

### P9H3 — Overview hierarchy

Require metric-aware summary, useful selected-day analysis, coherent comparison/calendar/ranking/coverage order, compact mobile task flow, and removal of duplicate or placeholder facts.

### P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing hierarchy while preserving Back/Forward, no-refetch switching, and output schemas.

### P9H5 — responsive and accessibility

Reconcile all required widths; resolve the production/local keyboard discrepancy; repair touch/keyboard inspection, focus, targets, wrapping, contrast, forced colors, and mobile density.

### P9H6–P9H7

Run the complete local candidate and all permanent gates, then use one deliberate `preview-*` candidate for real-data and exact production acceptance.

## 6. Phase 10 — cross-site quality remediation

```text
U10A defect ledger and ownership baseline
U10B shared shell and components
U10C visualization/state grammar
U10D Day Flow and Battle Lines coherence
U10E responsive and accessibility
U10F route/readiness/smoke coverage
U10G architecture cleanup
U10H local/Preview/production acceptance
```

## 7. Phase 11 — engineering and operations lock

```text
O11A all-public acceptance inventory
O11B unified browser matrix
O11C workflow consolidation without weakening gates
O11D browser application strict-null migration
O11E Functions/worker strict-null migration
O11F monitoring and failure runbooks
O11G maintenance cadence and acceptance
```

## 8. Phase 12 — English release readiness

```text
R12A Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, About/footer audit
R12B Stripe registration, Payment Link, wording, refund, and mobile-flow verification
R12C English launch assets, limitations, status explanation, links, and FAQ
```

English is the source language. Legal/support content must be structured for later localization.

## 9. Phase 13 — English and Japanese localization

```text
I13A localization contract and route manifest
I13B locale registry, typed keys, catalog loader
I13C Intl formatting, pseudo-locale, parity gates
I13D shared shell and provider homes
I13E Heatmap
I13F Day Flow
I13G Battle Lines
I13H History
I13I Channel, Watchlist, Status, About, Support, legal
I13J Japanese catalog and CJK/accessibility review
I13K English/Japanese browser, Preview, production acceptance
```

## 10. Phase 14 — Spanish/pt-BR and staged launch

```text
I14A Spanish catalog and QA
I14B Brazilian Portuguese catalog and QA
I14C four-language SEO/browser/Preview/production acceptance
L14A English/Japanese publication
L14B Spanish/pt-BR publication and evidence ledger
L14C feedback classification and phase closure
```

Initial locales are `en`, `ja`, `es`, and `pt-BR`. Arabic/RTL requires separate evidence and approval.

## 11. Phase 15–16

Phase 15 evaluates one candidate at a time for source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, value, overlap, and maintenance cost. Phase 16 begins only after one candidate is separately approved with its own specification and branch sequence.

## 12. Current stop rule

P9H2 is complete and canonically closed through PR #437. Do not create `work-history-ui-h3-overview` until explicit continuation is received. After every merge, issue the full report and stop.