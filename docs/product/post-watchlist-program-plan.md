# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.0
Created: 2026-06-25
Last updated: 2026-06-26
Current phase: Phase 9 — History P1 repair
Current window: P9H0 documentation closeout
Current branch: `work-p9h0-closeout`
Completed predecessor: P9H0 through PR #430
Exact next implementation branch: `work-history-ui-h1-metric`
Exception: a newly proven P0 may interrupt

## 1. Purpose

This document owns the complete approved execution program after Local Watchlist v1.

```text
current-roadmap.md                 product priority
current-schedule.md                exact active state and next branch
post-watchlist-program-plan.md     complete Phase 7–16 program
feature/quality specifications     stable product contracts
implementation plans               branch sequence and gates
working notes                      unstable execution memory
audit/acceptance records           evidence baseline
```

Before each branch, compare the schedule with actual branches/PRs, confirm the predecessor merge and merge report, confirm explicit continuation, read the affected specifications/plans, and record missing work before implementation. After each merge, update canonical state, issue the full merge report, name the next branch, and stop.

## 2. Program status

| Phase | Window | State | Authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | source reset | repair program locked |
| 8 | P8A | complete PR #427 | public inventory | 21 owned surfaces inventoried |
| 8 | P8B | complete PR #428 | browser audit | defect ledger and evidence complete |
| 9 | P9H0 | complete PR #430 | History baseline | deterministic failures and owners fixed |
| 9 | closeout | active | `work-p9h0-closeout` | authorities aligned and merged |
| 9 | P9H1–P9H7 | queued | `history-ui-repair-plan.md` | History repair accepted in production |
| 10 | U10A–U10H | queued | cross-site quality plan | reproduced cross-site defects accepted |
| 11 | O11A–O11G | queued | engineering/operations plan | acceptance, CI, type safety, monitoring locked |
| 12 | R12A–R12C | queued | release readiness | English legal/Support/Stripe package complete |
| 13 | I13A–I13K | queued | localization plan | English/Japanese accepted |
| 14 | I14A–I14C | queued | localization plan | Spanish/pt-BR accepted |
| 14 | L14A–L14C | queued | launch plan | staged launch and feedback classification complete |
| 15 | N15A–N15B | queued | next-feature audit | zero or one candidate approved |
| 16 | feature-specific | not approved | new specification required | separately approved feature accepted |

## 3. Completed Phase 7–8

P7A completed through PR #426. P8A completed through PR #427 with 21 owned surfaces. P8B completed through PR #428 with:

```text
21 owned routes
1440 / 820 / 390 / 360
84 production route scenarios
5 missing policy/disclosure probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

No outage, provider crossing, materially wrong provider path, or page-level horizontal overflow was found.

## 4. Completed P9H0

P9H0 completed through PR #430.

```text
Final head: e3a1f64e7225a652de95a37ea755b192565d7798
Merge: 716b8e2fb59a6783a647cb62274c82a521c0e535
Workflow: 28217951126
Artifact: history-ui-h0-baseline / 7897373665
Digest: sha256:366d5aeeb896b62201cc842f79ba9426807ae81e997a3cc5d53360cfa43b104a
```

Deterministic failures:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The 390px Kick fixture measured 15,058px, about 17.84 viewport heights, with seven major Overview sections. Local keyboard scenarios moved focus to the ViewLoom home link; the P8B production body-focus observation remains a discrepancy for P9H5 and final acceptance.

## 5. Phase 9 sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     exact next
P9H2 work-history-ui-h2-chart      queued
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

### P9H1 — metric execution

Synchronize Viewer-minutes and Peak viewers across URL, request/cache, chart, Summary, Selected day, comparison, Ranking context, supported Archives, Report, Share, and Exports. Replace metric-related expected failures with passing permanent assertions.

### P9H2 — chart interpretation

Require readable UTC date ticks, numeric scale, visible metric/unit, pointer/keyboard/touch day inspection, selected-day synchronization, honest state distinctions, accessible description, and a non-color-only legend.

### P9H3 — Overview hierarchy

Require metric-aware summary, useful selected-day analysis, coherent comparison/calendar/ranking/coverage order, and removal of duplicate or placeholder facts.

### P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing hierarchy while preserving Back/Forward, no-refetch switching, and output schemas.

### P9H5 — responsive and accessibility

Reconcile all required widths; resolve the production/local keyboard discrepancy; repair touch/keyboard inspection, focus, targets, wrapping, contrast, forced colors, and mobile density.

### P9H6–P9H7

Run the complete local candidate and all permanent gates, then use one deliberate `preview-*` candidate for real-data and exact production acceptance.

## 6. Phase 10 — cross-site quality remediation

Authority:

```text
docs/product/cross-site-quality-remediation-spec.md
docs/product/cross-site-quality-remediation-plan.md
```

Sequence:

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

Only reproduced defects are repaired. No new API, D1, collector, cron, retention, provider total, login, alert, or AI interpretation is authorized.

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

Authority:

```text
docs/product/localization-spec.md
docs/product/localization-implementation-plan.md
```

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

## 12. Scope rules

- P0 interrupts immediately.
- P1 may reorder Phase 9 when it blocks acceptance.
- P2 waits for Phase 10 unless it blocks P1 acceptance.
- P3 remains deferred.
- UI localization is not stream-language analytics.
- new APIs, D1 schemas, collector fields, cron, retention, bindings, exact sessions, provider totals, login, alerts, AI interpretation, or automatic provider-content translation require separate approval.

## 13. Current stop rule

`work-p9h0-closeout` is active only for documentation and governance alignment. After it merges, issue the full merge report and stop. Do not create `work-history-ui-h1-metric` until explicit continuation.