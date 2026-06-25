# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 1.2
Created: 2026-06-25
Last updated: 2026-06-26
Current phase: Phase 8 — public surface inventory and browser defect audit
Current window: P8B
Current branch: `work-public-browser-audit`
Completed predecessor: P8A through PR #427
Exact next branch after P8B: `work-history-ui-h0-baseline`
Exception: a newly proven P0 may interrupt

## 1. Purpose

This document owns the complete approved execution program after Local Watchlist v1. It is the comparison point between planned phases, actual branches and PRs, required deliverables, evidence, and remaining work.

```text
current-roadmap.md                 product priority
current-schedule.md                exact active state and next branch
post-watchlist-program-plan.md     complete Phase 7–15 program
feature specifications             stable product contracts
implementation plans               feature-specific branch sequence and gates
working notes                      unstable execution memory
P8A/P8B audit records              route ownership, evidence, and defect baseline
```

Before each branch, compare the schedule with actual branches, confirm the predecessor merge and merge report, confirm explicit continuation, and record missing deliverables before implementation. After each merge, issue the full merge report, update canonical state, name the exact next branch, and stop.

## 2. Program status

| Phase | Window | State | Branch / authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | `work-history-ui-repair-governance` | post-Watchlist authorities and History P1 program locked |
| 8 | P8A | complete PR #427 | `work-public-surface-inventory` | machine-readable public-surface inventory complete |
| 8 | P8B | active | `work-public-browser-audit` | browser evidence and ordered defect ledger complete |
| 9 | P9H0–P9H7 | queued | `history-ui-repair-plan.md` | History P1 repair accepted in production |
| 9 | narrow non-History repairs | conditional | named from P8B defect ledger | each approved P0/P1 accepted |
| 10 | U10A–U10E | queued | cross-site UI consolidation | shared visual/interaction system accepted |
| 11 | O11A–O11D | queued | operations and maintenance lock | acceptance, monitoring, runbooks, cadence fixed |
| 12 | R12A–R12C | queued | release readiness | Support/legal/Stripe package complete |
| 13 | L13A–L13C | queued | external launch | staged launch and feedback classification complete |
| 14 | N14A–N14B | queued | next-feature audit | zero or one candidate approved |
| 15 | feature-specific | not approved | new specification required | separately approved feature accepted |

## 3. Completed Phase 7 — source reset

P7A completed through PR #426. It corrected stale post-Watchlist authorities, approved known History problems as P1 defects, removed the incorrect screenshot blocker, added the History repair specification/plan/note, updated policy verification, and locked P8A as the next branch.

## 4. Phase 8 — public-surface audit

Phase 8 records what exists before repair. It does not mix audit and product repair.

### P8A — completed static inventory

```text
branch: work-public-surface-inventory
PR: #427
state: complete
20 Vite HTML inputs
1 explicit 404 page
21 owned inventory entries
16 indexable routes
4 noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

P8A recorded owners, provider bindings, controls, states, metadata, existing gates, and missing coverage. It also recorded five absent repository-owned routes: Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure.

### P8B — active public browser defect audit

```text
branch: work-public-browser-audit
state: active completion branch
runtime matrix: produced
machine-readable ledger: produced
human-readable report: produced
latest-head gates and merge: remaining
exact next branch: work-history-ui-h0-baseline
```

Executed matrix:

```text
21 routes × 1440 / 820 / 390 / 360
84 production browser scenarios
5 missing policy/disclosure probes
10 deterministic History state and interaction scenarios
```

Result recorded by the committed defect ledger:

```text
P0 0
P1 3
P2 5
P3 0
```

P8B completion requires machine-readable runtime evidence, screenshots, a committed defect ledger, a human-readable report, an ordered Phase 9 queue, latest-head CI, and no mixed product repair.

## 5. Historical P8A handoff record retained for completed Watchlist verification

The following exact values describe the state at the end of P8A. They are not the current branch schedule.

```text
Completed window: P8A through PR #427
Exact next branch: `work-public-browser-audit`
```

| Phase | Window | Historical state |
|---|---|---|
| 7 | P7A | complete PR #426 |
| 8 | P8A | complete PR #427 |
| 8 | P8B | exact next |

The current next branch after P8B is `work-history-ui-h0-baseline`.

## 6. Phase 9 — P0/P1 repair

History is the central approved repair track. Non-History P0/P1 defects discovered in P8B receive narrow branches. P2 work does not displace History unless it blocks P1 acceptance.

```text
P9H0 work-history-ui-h0-baseline
P9H1 work-history-ui-h1-metric
P9H2 work-history-ui-h2-chart
P9H3 work-history-ui-h3-overview
P9H4 work-history-ui-h4-tasks
P9H5 work-history-ui-h5-responsive
P9H6 work-history-ui-h6-candidate
P9H7 work-history-ui-h7-acceptance
```

### P9H0 — baseline and failing permanent gates

- reproduce Twitch and Kick failures with real and deterministic data;
- trace metric, URL, request/cache, renderer, summary, selected day, ranking, archives, report, share, and exports;
- identify authoritative modules and compatibility layers;
- add failing assertions before product repair;
- freeze required viewport and state artifacts.

### P9H1 — metric execution

Synchronize Viewer-minutes and Peak viewers across URL, request/cache, chart, summary, selected day, comparison, rankings, archives, report, share, and exports. Prove rendered meaning changes, not only selected styling.

### P9H2 — chart interpretation

Require readable UTC date ticks, numeric scale, visible metric/unit, pointer/keyboard/touch day inspection, selected-day synchronization, honest state distinctions, accessible description, and a non-color-only legend.

### P9H3 — Overview hierarchy

Require metric-aware high-value summary, useful selected-day analysis, coherent comparison/calendar/ranking/coverage order, and removal of duplicate or placeholder facts.

### P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing workspace hierarchy while preserving verified Back/Forward and no-refetch behavior and existing output schemas.

### P9H5 — responsive and accessibility

Reconcile 1440, 820, 390, and 360px layouts; repair first keyboard entry, touch/keyboard day inspection, visible focus, target sizes, wrapping, reduced motion, contrast, forced colors, and mobile task density.

### P9H6 — complete local candidate

Run all History and shared-web workflows on the latest head and permanently reject visual-only metric switching and chart-without-scale regressions.

### P9H7 — hosted and production acceptance

Use one deliberate `preview-*` branch from the accepted local candidate, verify bindings and real retained data, merge only the accepted candidate, verify exact production SHA, issue permanent acceptance, and delete the working note.

## 7. Phase 10 — cross-site UI and interaction consolidation

```text
U10A design tokens and component audit
U10B data-visualization grammar
U10C responsive system
U10D accessibility consolidation
U10E cross-site candidate and production acceptance
```

Begin only after Phase 9 P0/P1 acceptance.

## 8. Phase 11 — operations and maintenance lock

```text
O11A unified acceptance matrix
O11B collector freshness and capacity monitoring
O11C failure runbooks
O11D weekly/monthly/quarterly maintenance cadence
```

Prefer existing Status APIs and GitHub Actions over unnecessary cron work.

## 9. Phase 12 — Support, legal, Stripe, and release readiness

```text
R12A Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, About, footer audit
R12B Stripe registration, Payment Link, wording, refund, and mobile-flow verification
R12C launch images, descriptions, limitations, status explanation, links, and FAQ
```

## 10. Phase 13 — external launch and feedback

```text
L13A staged publication
L13B channel/date/views/clicks/responses evidence ledger
L13C bug/copy/UX/data-capability/feature-request classification
```

P0/P1 may interrupt. Feature requests do not automatically change the roadmap.

## 11. Phase 14 — next-feature capability audit

Evaluate one candidate at a time for provider source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, value, overlap, and maintenance cost. Approve zero or one candidate.

## 12. Phase 15 — separately approved feature

Phase 15 has no approved implementation branch. It begins only after Phase 14 approves one candidate, a permanent specification and branch sequence exist, and the user explicitly authorizes implementation.

## 13. Interrupt and scope rules

- P0 interrupts immediately.
- P1 may reorder Phase 9 when it blocks acceptance.
- P2 waits for the relevant quality phase unless it blocks P1 acceptance.
- P3 remains deferred.
- new APIs, D1 schemas, collector fields, cron, retention, bindings, exact-session claims, provider totals, login, alerts, or AI interpretation require specification and roadmap approval.

## 14. Current stop rule

P8B is active only as the completion branch. After PR #428 merges, issue the full merge report and stop. Do not create `work-history-ui-h0-baseline` until explicit continuation.
