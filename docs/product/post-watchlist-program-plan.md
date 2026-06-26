# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.0
Created: 2026-06-25
Last updated: 2026-06-26
Current phase: Phase 9 — History P1 repair
Current window: P9H0
Current branch: `work-history-ui-h0-baseline`
Completed predecessor: Phase 8 P8B through PR #428
Exact next branch after P9H0: `work-history-ui-h1-metric`
Exception: a newly proven P0 may interrupt

## 1. Purpose

This document owns the complete approved execution program after Local Watchlist v1. It compares planned phases, actual branches and PRs, required deliverables, evidence, and remaining work.

```text
current-roadmap.md                         product priority
current-schedule.md                        exact active state and next branch
post-watchlist-program-plan.md             complete Phase 7–16 program
feature specifications                     stable product contracts
implementation plans                       branch sequence and gates
working notes                              unstable execution memory
P8A/P8B audit records                      route, evidence, and defect baseline
```

Before each branch, compare the schedule with actual branches, confirm the predecessor merge and merge report, confirm explicit continuation, read the affected specification/plan, and record missing deliverables before implementation. After each merge, issue the full merge report, update canonical state, name the exact next branch, and stop.

## 2. Program status

| Phase | Window | State | Branch / authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | `work-history-ui-repair-governance` | post-Watchlist authorities and History P1 program locked |
| 8 | P8A | complete PR #427 | `work-public-surface-inventory` | machine-readable public-surface inventory complete |
| 8 | P8B | complete PR #428 | `work-public-browser-audit` | browser evidence and ordered defect ledger complete |
| 9 | P9H0 | active | `work-history-ui-h0-baseline` | authorities aligned; exact failing-gate baseline complete |
| 9 | P9H1–P9H7 | queued | `history-ui-repair-plan.md` | History P1 repair accepted in production |
| 10 | U10A–U10H | queued | `cross-site-quality-remediation-plan.md` | reproduced cross-site defects and architecture debt accepted |
| 11 | O11A–O11G | queued | `cross-site-quality-remediation-plan.md` | acceptance, CI, type safety, monitoring, runbooks, cadence locked |
| 12 | R12A–R12C | queued | this plan and legal/Stripe records | English release-readiness package complete |
| 13 | I13A–I13K | queued | `localization-implementation-plan.md` | English/Japanese localization accepted in production |
| 14 | I14A–I14C | queued | `localization-implementation-plan.md` | Spanish/pt-BR localization accepted |
| 14 | L14A–L14C | queued | this plan | staged launch and feedback classification complete |
| 15 | N15A–N15B | queued | next-feature audit | zero or one candidate approved |
| 16 | feature-specific | not approved | new permanent specification required | separately approved feature accepted |

## 3. Completed Phase 7 — source reset

P7A completed through PR #426. It corrected stale authorities, approved History problems as P1 defects, added the History repair specification/plan/note, updated policy verification, and locked the public audit as the next work.

## 4. Completed Phase 8 — public-surface audit

### P8A — static inventory

```text
branch: work-public-surface-inventory
PR: #427
20 Vite HTML inputs
1 explicit 404 page
21 owned inventory entries
16 indexable routes
4 noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

### P8B — browser defect audit

```text
branch: work-public-browser-audit
PR: #428
21 routes × 1440 / 820 / 390 / 360
84 production browser scenarios
5 missing policy/disclosure probes
10 deterministic History state/interaction scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

P8B found no outage, materially wrong provider path, provider crossing, or horizontal overflow. It approved the following ordered repair work:

- History metric synchronization, keyboard entry, and task hierarchy as P1;
- shared target sizes, readiness/smoke omissions, missing legal routes, and Day Flow date naming as P2.

The permanent audit package remains historical evidence and must not be rewritten as if Phase 8 were still active.

## 5. Phase 9 — History P1 repair

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

### P9H0 — documentation alignment, baseline, and failing gates

- align roadmap, schedule, program, index, affected specifications/plans, working note, entry instructions, PR template, and policy verifier;
- reproduce Twitch and Kick failures with real and deterministic data;
- trace metric, URL, request/cache, renderer, summary, selected day, comparison, ranking, archives, report, share, and exports;
- identify authoritative modules and compatibility/hotfix layers;
- add failing assertions before repair without leaving required CI permanently red;
- freeze required viewport and state artifacts.

### P9H1 — metric execution

Synchronize Viewer-minutes and Peak viewers across URL, request/cache, chart, summary, selected day, comparison, rankings, archives, report, share, and exports. Prove rendered meaning changes, not only selected styling.

### P9H2 — chart interpretation

Require readable UTC date ticks, numeric scale, visible metric/unit, pointer/keyboard/touch day inspection, selected-day synchronization, honest state distinctions, accessible description, and a non-color-only legend.

### P9H3 — Overview hierarchy

Require metric-aware high-value summary, useful selected-day analysis, coherent comparison/calendar/ranking/coverage order, and removal of duplicate or placeholder facts.

### P9H4 — Archives and Report & Export

Repair Daily, Peaks, Battles, and publishing workspace hierarchy while preserving verified Back/Forward, no-refetch behavior, and output schemas.

### P9H5 — responsive and accessibility

Reconcile 1440, 820, 390, and 360px layouts; repair first keyboard entry, touch/keyboard day inspection, visible focus, target sizes, wrapping, reduced motion, contrast, forced colors, and mobile task density.

### P9H6 — complete local candidate

Run all History and shared-web workflows on the latest head and permanently reject visual-only metric switching and chart-without-scale regressions.

### P9H7 — hosted and production acceptance

Use one deliberate `preview-*` branch from the accepted local candidate, verify bindings and real retained data, merge only the accepted candidate, verify exact production SHA, issue permanent acceptance, and delete the History repair working note.

## 6. Phase 10 — cross-site quality remediation

Authority:

```text
docs/product/cross-site-quality-remediation-spec.md
docs/product/cross-site-quality-remediation-plan.md
```

Begin only after Phase 9 production acceptance.

```text
U10A defect ledger, ownership, and reproduction gates
U10B shared shell, tokens, navigation, footer, and state panels
U10C chart, tooltip, legend, loading, empty, and error grammar
U10D Day Flow and Battle Lines selection/initial-render coherence
U10E responsive, 44px targets, labels, focus, and input accessibility
U10F Channel empty-entry, Watchlist readiness, and route/smoke coverage
U10G duplicate entry, obsolete layer, and compatibility cleanup
U10H complete local/Preview/production acceptance
```

Only reproduced defects are repaired. No new API, D1, collector, cron, retention, binding, exact-session claim, provider total, login, alert, or AI interpretation is authorized.

## 7. Phase 11 — engineering and operations lock

```text
O11A all-public acceptance inventory and permanent matrix contract
O11B unified browser matrix for routes, widths, and core states
O11C workflow consolidation without weakening feature gates
O11D Web application strict-null-checking migration
O11E Pages Functions and worker boundary type-safety migration
O11F freshness, capacity, deployment, and failure runbooks
O11G weekly/monthly/quarterly maintenance cadence and phase acceptance
```

Prefer existing Status APIs and GitHub Actions over unnecessary cron work. Type-safety work is staged so one giant migration cannot hide behavioral regressions.

## 8. Phase 12 — English Support, legal, Stripe, and release readiness

```text
R12A Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, About, footer audit
R12B Stripe registration, Payment Link, wording, refund, and mobile-flow verification
R12C English launch images, descriptions, limitations, status explanation, links, and FAQ
```

English is the source language. Legal and support content must be structurally reusable by the later localization program rather than duplicated into unrelated HTML fragments.

## 9. Phase 13 — localization foundation plus English/Japanese

Authority:

```text
docs/product/localization-spec.md
docs/product/localization-implementation-plan.md
```

```text
I13A localization contract, route manifest, fallback, SEO, and translation boundary
I13B locale registry, typed message keys, and catalog loader
I13C Intl formatters, pseudo-locale, missing-key and parity gates
I13D Portal, shared shell, navigation, footer, and provider homes
I13E Heatmap
I13F Day Flow
I13G Battle Lines
I13H History
I13I Channel, Watchlist, Status, About, Support, and legal pages
I13J Japanese catalog, CJK layout, copy review, and accessibility review
I13K English/Japanese full-route browser, Preview, and production acceptance
```

Existing English routes remain canonical. Japanese uses locale-prefixed routes. Provider-origin data such as streamer names, channel IDs, titles, and categories is not translated.

## 10. Phase 14 — Spanish/pt-BR and staged launch

```text
I14A Spanish catalog and visual/copy QA
I14B Brazilian Portuguese catalog and visual/copy QA
I14C four-language hreflang, sitemap, canonical, browser, Preview, and production acceptance
L14A staged English/Japanese publication
L14B Spanish/pt-BR publication and channel evidence ledger
L14C bug/copy/UX/data-capability/feature-request classification
```

Initial locale set:

```text
en
ja
es
pt-BR
```

Arabic/RTL is excluded. It requires actual usage evidence, a separate RTL specification, and separately approved branches.

## 11. Phase 15 — next-feature capability audit

```text
N15A current data and maintenance capability audit
N15B approve zero or one candidate and define its permanent specification/plan
```

Evaluate one candidate at a time for provider source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, value, overlap, and maintenance cost.

UI localization is not stream-language collection. Category, stream-language, event, session, and alert capabilities remain unapproved unless Phase 15 separately proves and approves them.

## 12. Phase 16 — separately approved feature

Phase 16 has no approved implementation branch. It begins only after Phase 15 approves one candidate, a permanent specification and branch sequence exist, and the user explicitly authorizes implementation.

## 13. Interrupt and scope rules

- P0 interrupts immediately.
- P1 may reorder Phase 9 when it blocks acceptance.
- P2 waits for Phase 10 unless it blocks Phase 9 acceptance.
- P3 remains deferred.
- new APIs, D1 schemas, collector fields, cron, retention, bindings, exact-session claims, provider totals, login, alerts, AI interpretation, or stream-language analytics require separate specification and roadmap approval.
- localization runtime work must not begin before Phase 13.
- no major feature is developed in parallel with Phase 9–14.

## 14. Current stop rule

P9H0 is active on `work-history-ui-h0-baseline`. After its PR merges, issue the full merge report and stop. Do not create `work-history-ui-h1-metric` until explicit continuation.