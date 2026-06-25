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

This document owns the complete approved execution program after Local Watchlist v1. It is the stable comparison point between planned phases, actual branches and PRs, required deliverables, available evidence, and remaining work.

Authority split:

```text
current-roadmap.md                 product priority
current-schedule.md                exact active state and next branch
post-watchlist-program-plan.md     complete Phase 7–15 program
feature specifications             stable product contracts
implementation plans               feature-specific branch sequence and gates
working notes                      unstable execution memory
P8A/P8B audit records              route ownership, evidence, and defect baseline
```

## 2. Repository comparison rule

Before each branch:

1. read `docs/README.md` in the required order;
2. confirm roadmap, schedule, this program, affected specification, plan, working note, and audit records agree;
3. confirm the predecessor PR is merged and its full merge report was issued;
4. confirm explicit continuation exists;
5. confirm the scheduled branch does not conflict with repository state;
6. compare required deliverables with files, workflows, artifacts, and production identity;
7. record missing work before implementation;
8. update documentation first when repository state has advanced.

After each merge:

1. issue the full merge report;
2. mark the completed branch and PR in all governing documents;
3. name the exact next branch;
4. stop;
5. do not create the next branch until explicit continuation.

## 3. Program status

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

## 4. Completed Phase 7 — source reset

P7A completed through PR #426.

- corrected stale post-Watchlist authorities;
- approved known History problems as P1 defects;
- removed the incorrect screenshot blocker;
- added the History repair specification, plan, and working note;
- updated policy verification;
- locked P8A as the next branch.

## 5. Phase 8 — public-surface audit

Phase 8 records what exists before repair. It does not mix audit and product repair.

### P8A — completed static inventory

```text
branch: work-public-surface-inventory
PR: #427
state: complete
```

P8A produced:

```text
20 Vite HTML inputs
1 explicit 404 page
21 owned inventory entries
16 indexable routes
4 noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

It recorded owners, provider bindings, controls, states, metadata, existing gates, and missing coverage. It also recorded five absent repository-owned routes: Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure.

### P8B — active public browser defect audit

```text
branch: work-public-browser-audit
state: active
exact next branch: work-history-ui-h0-baseline
```

Required owned-route matrix:

```text
21 routes × 1440 / 820 / 390 / 360
84 production browser scenarios
```

Additional required evidence:

```text
5 missing policy/disclosure probes
10 deterministic History state and interaction scenarios
real/fresh, partial, stale, empty, missing, demo, error, loading, in-progress
storage unavailable and long-content evidence where applicable
```

Required checks:

- status, title, canonical, robots, H1, entry rendering, and recovery links;
- horizontal overflow, focus entry, accessible names, and mobile target sizes;
- period and metric changes, Back/Forward, direct links, task/archive navigation;
- chart scale, units, ticks, day detail, and selected-day synchronization;
- copy, share, PNG, CSV, JSON, and deep links where supported;
- provider-specific API calls and provider-crossing detection;
- honest data-state language.

Defect classes:

```text
P0  production outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, automation, or secondary interaction defect
P3  deferred improvement or feature request
```

P8B completion requires machine-readable runtime evidence, screenshots, a committed defect ledger, a human-readable report, an ordered Phase 9 queue, latest-head CI, and no mixed product repair.

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

- synchronize Viewer-minutes and Peak viewers across URL, request/cache, chart, summary, selected day, comparison, rankings, archives, report, share, and exports;
- preserve one provider request per uncached provider/period/metric state;
- prove rendered meaning changes, not only selected styling.

### P9H2 — chart interpretation

- readable UTC date ticks and numeric scale;
- visible metric and unit;
- pointer, keyboard, and touch day inspection;
- selected-day synchronization;
- complete, partial, in-progress, and missing distinctions;
- accessible description and non-color-only legend.

### P9H3 — Overview hierarchy

- metric-aware high-value summary;
- useful selected-day analysis;
- coherent comparison, calendar, ranking, and coverage order;
- remove duplicate and placeholder facts.

### P9H4 — Archives and Report & Export

- one visible top-level task and one archive subview;
- repair Daily, Peaks, Battles, and publishing workspace hierarchy;
- connect outputs to provider, period, metric, scope, source, state, and limitations;
- remove oversized sparse regions;
- preserve output schemas unless separately approved.

### P9H5 — responsive and accessibility

- reconcile 1440, 820, 390, and 360px layouts;
- touch and keyboard day inspection;
- visible focus, target sizes, wrapping, reduced motion, contrast, forced colors, and no overflow.

### P9H6 — complete local candidate

- all History and shared-web workflows on latest head;
- metrics, periods, Back/Forward, direct links, tasks, archives, selected day, comparison, calendar, rankings, report, share, PNG, CSV, and JSON;
- provider separation and all required states;
- desktop/tablet/mobile artifacts;
- permanent rejection of visual-only metric switching and chart-without-scale regressions.

### P9H7 — hosted and production acceptance

- one deliberate `preview-*` branch from the accepted local candidate;
- verify Pages Functions, bindings, real retained data, metrics, responsive behavior, and outputs;
- merge only the accepted candidate;
- verify exact production SHA through `/deployment.json`;
- public Twitch and Kick acceptance;
- permanent acceptance record and working-note deletion.

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

P8B is active. After its completion PR merges, issue the full merge report and stop. Do not create `work-history-ui-h0-baseline` until explicit continuation.
