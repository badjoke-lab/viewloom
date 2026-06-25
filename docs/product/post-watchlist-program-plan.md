# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 1.1
Created: 2026-06-25
Last updated: 2026-06-26
Current phase: Phase 8 — public surface inventory and browser defect audit
Completed window: P8A through PR #427
Exact next window: P8B
Exact next branch: `work-public-browser-audit`

## 1. Purpose

This document records the approved execution program after Local Watchlist v1 and provides a stable comparison point between:

- the planned phase and branch;
- the branch and PR that actually exist;
- the required deliverables;
- the acceptance evidence already present;
- the work still missing before the next phase may begin.

`current-roadmap.md` owns product priority. `current-schedule.md` owns exact current state and the next branch. This file owns the complete Phase 7–15 program. Feature-specific plans add detail without overriding it.

## 2. Repository comparison rule

Before each branch begins:

1. read `docs/README.md` in the required order;
2. confirm roadmap, schedule, this program, affected specification, affected plan, working note, and audit records agree;
3. confirm the expected predecessor PR is merged;
4. confirm explicit continuation exists;
5. confirm the branch named by the schedule does not already conflict with repository state;
6. compare required deliverables with repository files, workflows, artifacts, and production identity;
7. record missing work before implementation;
8. update documentation first when the repository has advanced beyond documented state.

After each merge:

1. issue the full merge report;
2. mark the completed branch and PR in roadmap, schedule, this program, affected plan, and working note;
3. name the exact next branch;
4. stop;
5. do not create the next branch until explicit continuation.

## 3. Program status

| Phase | Window | State | Branch / authority | Exit condition |
|---|---|---|---|---|
| 7 | P7A | complete PR #426 | `work-history-ui-repair-governance` | post-Watchlist authorities and History P1 program locked |
| 8 | P8A | complete PR #427 | `work-public-surface-inventory` | machine-readable public-surface inventory complete |
| 8 | P8B | exact next | `work-public-browser-audit` | browser evidence and ordered defect ledger complete |
| 9 | P9H0–P9H7 | queued | `history-ui-repair-plan.md` | History P1 repair accepted in production |
| 9 | narrow non-History repairs | conditional | branch named from P8B defect ledger | each approved P0/P1 accepted |
| 10 | U10A–U10E | queued | cross-site UI consolidation | shared visual/interaction system accepted |
| 11 | O11A–O11D | queued | operations and maintenance lock | acceptance, monitoring, runbooks, cadence fixed |
| 12 | R12A–R12C | queued | release readiness | Support/legal/Stripe package complete |
| 13 | L13A–L13C | queued | external launch | staged launch and feedback classification complete |
| 14 | N14A–N14B | queued | next-feature audit | zero or one candidate approved |
| 15 | feature-specific | not approved | new specification required | separately approved feature accepted |

## 4. Phase 7 — completed source reset

### P7A — governance and repair-program lock

```text
branch: work-history-ui-repair-governance
PR: #426
state: complete
```

Completed deliverables:

- corrected stale post-Watchlist root and canonical documents;
- approved the known History UI problems as P1 defects;
- removed the incorrect screenshot blocker;
- added `history-ui-repair-spec.md`;
- added `history-ui-repair-plan.md`;
- added the active History repair working note;
- updated policy verification;
- identified P8A as the exact next branch.

## 5. Phase 8 — public-surface audit

Phase 8 records what exists before repair. It does not mix audit and product repair.

### P8A — completed public surface inventory

```text
branch: work-public-surface-inventory
PR: #427
state: complete
exact next branch: work-public-browser-audit
```

Completed deliverables:

- canonical route inventory covering Portal, provider homes, Heatmap, Day Flow, Battle Lines, History, Channel, Watchlist, Status, About, Support, policy gaps, and 404;
- provider, route, title, canonical, robots, API, controls, states, owners, workflows, Preview, production, and gap evidence;
- separate route records and reusable profiles;
- explicit missing-surface and missing-acceptance ledger;
- human-readable inventory report;
- machine-readable manifest;
- validation script and CI workflow;
- no runtime UI, API, D1, collector, cron, retention, binding, or Preview change.

Inventory totals:

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

Stable P8A gaps:

- both Watchlist routes are omitted from Public Readiness;
- About, Support, Changelog, Channel, and Watchlist are omitted from the general Production Smoke page list;
- no single permanent browser matrix covers all major routes at 1440, 820, 390, and 360 pixels across required states;
- History remains an approved P1 surface despite broad legacy coverage;
- repository-owned Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes are absent.

### P8B — public browser defect audit

```text
branch: work-public-browser-audit
state: exact next after explicit continuation
```

Required viewports:

```text
1440px
820px
390px
360px
```

Required states where applicable:

```text
real/fresh
partial
stale
empty
missing
demo
error
loading
storage unavailable
long content
```

Required interaction checks:

- period and metric changes;
- Back, Forward, and direct links;
- chart scale, units, ticks, tooltip/day detail, and selected-day synchronization;
- filters, sorting, task and archive navigation;
- copy, share, PNG, CSV, JSON, and deep links;
- keyboard, focus, touch targets, reduced motion, contrast, long text, and overflow;
- Twitch/Kick separation;
- Home, Channel, Watchlist, Status, support, policy, and error entry points.

Defect classification:

```text
P0  production outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, or secondary interaction defect
P3  deferred improvement or feature request
```

Completion criteria:

- exact browser evidence exists for all major route/viewport combinations;
- every P0/P1 has exact reproduction evidence;
- affected route, state, viewport, owner, file, existing gate, and missing assertion are recorded;
- provider separation and bounded claims remain exact;
- the repair queue is ordered;
- History defects remain P1 without another approval gate;
- P9H0 is next unless a newly discovered P0 interrupts.

## 6. Phase 9 — P0/P1 repair

History is the central approved repair track. Non-History P0/P1 defects discovered in P8B receive narrow branches without displacing History for P2 polish or new features.

### History sequence

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

#### P9H0 — exact baseline and failing gates

- reproduce Twitch and Kick failures with real and deterministic data;
- trace metric, URL, request/cache, renderer, summary, selected day, ranking, archives, report, share, and exports;
- identify authoritative modules and compatibility layers;
- add failing acceptance assertions before product repair;
- freeze 1440, 820, 390, 360, partial, empty, stale, demo, and error artifacts.

#### P9H1 — metric execution

- repair Viewer-minutes and Peak viewers end to end;
- synchronize URL, request/cache, chart, scale, unit, summary, selected day, comparison, rankings, archives, report, share, and exports;
- preserve one provider request per uncached period/metric state;
- prove rendered values or units change, not only button styling.

#### P9H2 — chart interpretability

- add readable UTC date ticks and numeric scale;
- expose metric and unit;
- provide exact detail plus compact formatting;
- implement pointer, keyboard, and touch day inspection;
- preserve selected-day state;
- distinguish complete, partial, in-progress, and missing data;
- add accessible description and non-color-only legend.

#### P9H3 — Overview information architecture

- replace placeholder summary with metric-aware high-value facts;
- make selected-day analysis useful;
- order comparison, calendar, rankings, and coverage coherently;
- remove duplicated and disconnected facts;
- keep chart dominant without making supporting analysis thin.

#### P9H4 — Archives and Report & Export

- keep one visible top-level task and one archive subview;
- repair Daily, Peaks, and Battles hierarchy;
- connect provider, period, metric, selected scope, state, source, and limitations to output surfaces;
- remove oversized sparse regions or replace them with compact explicit states;
- preserve output schemas unless separately approved.

#### P9H5 — responsive and accessibility

- reconcile 1440, 820, 390, and 360px layouts;
- keep controls, axes, units, chart, and selected-day flow readable;
- verify touch and keyboard day inspection;
- enforce visible focus, 44px general targets, 48px important mobile targets, wrapping, reduced motion, contrast, forced colors, and no page overflow.

#### P9H6 — local candidate QA

- run all History and shared-web workflows on the latest candidate;
- verify both metrics, all periods, Back/Forward, direct links, tasks, archives, selected day, comparison, calendar, ranking, report, share, PNG, CSV, and JSON;
- verify Twitch/Kick separation and all data states;
- generate desktop/tablet/mobile artifacts;
- permanently reject visual-only metric switching and charts without readable scale or units.

#### P9H7 — hosted and production acceptance

- create one deliberate `preview-*` branch from the accepted local candidate;
- verify Pages Functions, bindings, real retained data, metrics, responsive behavior, and outputs;
- merge only the accepted candidate;
- verify exact production SHA through `/deployment.json`;
- run public Twitch and Kick History acceptance;
- create permanent acceptance record;
- finalize specifications and plans;
- delete the History repair working note.

## 7. Phase 10 — cross-site UI and interaction consolidation

Begin only after Phase 9 P0/P1 acceptance.

### U10A — design tokens and component audit

- typography, spacing, surfaces, borders, radii, buttons, segmented controls, status pills, focus, loading, empty, partial, and error patterns;
- document intentional provider accents versus accidental drift.

### U10B — data-visualization grammar

- axis, tick, unit, legend, tooltip, hover, selection, missing, partial, stale, and timezone conventions;
- shared rules only where data meaning is compatible.

### U10C — responsive system

- shared breakpoints and layout behavior for 1440, 820, 390, and 360px;
- remove duplicated compatibility layers only after regression coverage exists.

### U10D — accessibility consolidation

- keyboard operation, focus retention, touch targets, reduced motion, forced colors, contrast, wrapping, and non-color-only states.

### U10E — cross-site candidate acceptance

- route matrix regression;
- full-page comparison artifacts;
- deliberate Preview only if shared runtime behavior requires hosted validation;
- exact production acceptance.

## 8. Phase 11 — operations and maintenance lock

### O11A — unified acceptance matrix

Record feature, provider, contract workflow, browser workflow, Preview workflow, production acceptance, accepted SHA, last success, and artifact ownership.

### O11B — collector and capacity monitoring

Track collector success, snapshot age, rollup updates, raw retention, rollup retention, D1 usage, API timeout, partial rate, and empty rate. Prefer existing Status APIs and GitHub Actions over unnecessary cron jobs.

### O11C — failure runbooks

Separate collector, D1, Pages deployment, provider API, stale data, partial data, real empty, and frontend regression failures. Record detection, confirmation, recovery, rerun, acceptance, and user-facing state.

### O11D — maintenance cadence

```text
weekly:    production smoke, freshness, public-route checks
monthly:   dependency, D1 usage, workflow/artifact, external-link audit
quarterly: retention, provider API contract, permanent-spec review
```

## 9. Phase 12 — Support, legal, Stripe, and release readiness

### R12A — legal and policy surfaces

Audit or complete Support, Contact, Terms, Privacy, refund policy, commercial disclosure, About/Method, canonical metadata, and footer links.

### R12B — Stripe readiness

Record repository-visible requirements and separately verify external Stripe registration, Payment Link, support wording, success/cancel paths, refund path, and mobile payment flow.

### R12C — launch package

Prepare current desktop/mobile images, short and long descriptions, feature list, data limitations, collector-status explanation, GitHub link, Support link, and FAQ.

## 10. Phase 13 — external launch and feedback

### L13A — staged publication

Publish incrementally through approved channels rather than simultaneously.

### L13B — evidence ledger

Record channel, date, views, clicks, responses, misunderstood functions, defects, and requests.

### L13C — triage

Classify feedback as bug, copy problem, UX problem, data-capability request, or new-feature request. P0/P1 may interrupt. Requests do not automatically change the roadmap.

## 11. Phase 14 — next-feature data-capability audit

### N14A — candidate audit

Evaluate one candidate at a time for provider source parity, D1 growth, collector changes, rollups, Cloudflare Free limits, data honesty, user value, overlap, and maintenance cost.

### N14B — decision

Approve zero or one candidate. Deferral remains valid.

## 12. Phase 15 — separately approved feature

Phase 15 has no approved implementation branch.

It begins only when Phase 14 approves one candidate, a permanent specification and branch sequence exist, and the user explicitly authorizes implementation.

## 13. Current stop rule

P8A is complete through PR #427. After the merge report, stop. Do not create `work-public-browser-audit` until explicit continuation.
