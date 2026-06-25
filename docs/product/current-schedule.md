# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-26

## 1. Operating rules

- P0 production failures interrupt planned work immediately.
- P1 defects interrupt or reorder the active repair phase when they block acceptance.
- `work-*` branches are implementation, repair, audit, test, or documentation branches.
- `preview-*` branches are reserved for deliberate Cloudflare runtime validation of completed candidates.
- Only the latest candidate head is authoritative.
- Full acceptance uses the exact deployed revision.
- After every merge, issue the full merge report, update this schedule, identify the exact next branch, stop, and wait for explicit continuation.
- Every branch must read the roadmap, this schedule, `post-watchlist-program-plan.md`, the affected specification/plan, the active working note, and relevant audit records before changing code.
- When repository state and documentation disagree, update documentation first and do not proceed from chat memory.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core; P8A inventory complete
Day Flow                                 production core; P8A inventory complete
Battle Lines                             production core; P8A inventory complete
History baseline H1-H7                   production accepted
History public-quality repair            approved P1 program
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 P8A inventory                    complete through PR #427
Phase 8 P8B browser audit                exact next
Phase 9 P0/P1 repair                     queued
Phase 10 shared UI consolidation         queued
Phase 11 operations lock                 queued
Phase 12 support/legal/release readiness queued
Phase 13 external launch                 queued
Phase 14 next-feature audit              queued
Phase 15 next major feature              not approved
```

## 3. Current state and next branch

```text
Completed window: P8A — public surface inventory
Completed branch: work-public-surface-inventory
Completion PR: #427
Runtime change: none

Exact next window: P8B — public browser defect audit
Exact next branch: work-public-browser-audit
State: waiting for explicit continuation after P8A merge report
```

No P8B branch exists yet.

Governing files for the next branch:

```text
docs/README.md
docs/product/current-roadmap.md
docs/product/current-schedule.md
docs/product/post-watchlist-program-plan.md
docs/product/history-and-trends-spec.md
docs/product/history-ui-repair-spec.md
docs/product/history-layout-rebuild-plan.md
docs/product/history-ui-repair-plan.md
docs/work-in-progress/history-ui-repair-working-note.md
docs/audits/README.md
docs/audits/public-surface-inventory.json
docs/audits/public-surface-inventory.md
docs/audits/public-surface-gaps.json
```

## 4. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           exact next after explicit continuation
P9H0 work-history-ui-h0-baseline         after P8B merge report unless P0 interrupts
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before the preceding merge report and explicit continuation.

## 5. P8A — completed public surface inventory

```text
branch: work-public-surface-inventory
PR: #427
state: complete
```

Completed package:

```text
docs/audits/P8A_SCOPE.md
docs/audits/README.md
docs/audits/public-surface-inventory.json
docs/audits/public-surface-inventory.md
docs/audits/public-surface-gaps.json
docs/audits/public-surface-routes-portal.json
docs/audits/public-surface-routes-twitch.json
docs/audits/public-surface-routes-kick.json
docs/audits/public-surface-profiles-core.json
docs/audits/public-surface-profiles-analysis.json
docs/audits/public-surface-profiles-history.json
docs/audits/public-surface-profiles-utility.json
scripts/verify-public-surface-inventory.mjs
.github/workflows/public-surface-inventory.yml
```

Verified inventory totals:

```text
20 Vite HTML inputs
1 explicit not-found page
21 owned inventory entries
16 indexable routes
4 explicit noindex utility routes
16 sitemap routes
18 Public Readiness configured pages
13 Production Smoke page routes
```

Stable findings:

- all repository-owned public HTML routes have route records and reusable owner/control/state/gate profiles;
- Twitch APIs are bound to `DB_TWITCH_HOT` and Kick APIs to `DB_KICK_HOT`;
- combined totals and rankings remain forbidden;
- History tasks, metrics, archives, selected day, comparison, calendar, rankings, coverage, reports, share, PNG, CSV, and JSON are inventoried;
- both Watchlist routes are omitted from Public Readiness configuration;
- About, Support, Changelog, Channel, and Watchlist routes are absent from the general Production Smoke page list;
- no consolidated browser matrix covers every major route, required viewport, and data state;
- Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes are absent;
- P8A made no runtime UI, API, D1, collector, cron, retention, binding, or Preview change.

## 6. P8B — public browser defect audit

Branch to create only after explicit continuation:

```text
work-public-browser-audit
```

Required viewport matrix:

```text
1440px
820px
390px
360px
```

Required state matrix where applicable:

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

Required route groups:

```text
Portal
Twitch Home
Kick Home
Twitch/Kick Heatmap
Twitch/Kick Day Flow
Twitch/Kick Battle Lines
Twitch/Kick History
Twitch/Kick Channel
Twitch/Kick Watchlist
Twitch/Kick Status
About
Support and missing-policy entry points
404
```

Required interaction checks:

- period and metric changes;
- Back, Forward, and direct links;
- chart scale, units, ticks, tooltip/day detail, and selected-day synchronization;
- filters, sorting, task and archive navigation;
- copy, share, PNG, CSV, JSON, and deep-link actions;
- keyboard, focus, target sizes, reduced motion, contrast, long text, and overflow;
- provider separation;
- loading, recovery, partial, missing, stale, empty, demo, and error honesty.

History-specific evidence:

```text
1440px Twitch Overview
1440px Kick Overview
820px task and control wrapping
390px Overview and selected-day flow
360px narrow chart and control behavior
Viewer-minutes before and after
Peak viewers before and after
Archives Daily / Peaks / Battles
Report & Export
Back / Forward and direct links
```

Defect classes:

```text
P0  outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, or secondary interaction defect
P3  deferred improvement or feature request
```

The known History problems remain P1 without another approval gate.

P8B completion criteria:

- exact browser evidence exists for all major route/viewport combinations;
- every P0/P1 has an exact reproduction;
- affected route, state, viewport, owner, file, existing gate, and missing assertion are recorded;
- provider separation and bounded-coverage claims remain exact;
- the ordered Phase 9 repair queue is explicit;
- P9H0 is the exact next branch unless a newly discovered P0 interrupts;
- no product repair is mixed into the audit PR unless a P0 requires immediate isolation.

## 7. Phase 9 — P0/P1 repair schedule

### P9H0 — History baseline and failing gates

```text
branch: work-history-ui-h0-baseline
```

- trace metric state through URL, API query, payload, chart, summary, selected day, comparison, rankings, archives, report, share, and exports;
- identify owner modules and compatibility layers;
- add failing assertions for visible metric changes, axes, scale, units, selected-day detail, sparse regions, touch behavior, and Back/Forward;
- freeze 1440, 820, 390, 360, partial, empty, stale, demo, and error artifacts;
- no broad styling rewrite.

### P9H1 — metric execution repair

```text
branch: work-history-ui-h1-metric
```

- repair Viewer-minutes and Peak viewers end to end;
- synchronize URL, request/cache, chart, summary, selected day, comparison, rankings, archives, report, share, and exports;
- preserve one provider request per uncached period/metric state;
- prove visible values or units change, not only selected styling.

### P9H2 — chart interpretability repair

```text
branch: work-history-ui-h2-chart
```

- readable UTC X-axis;
- readable numeric Y-axis or equivalent scale;
- metric label and unit;
- pointer, keyboard, and touch day details;
- selected-day state;
- complete, partial, in-progress, and missing distinctions;
- non-color-only legend and accessible description.

### P9H3 — Overview information architecture

```text
branch: work-history-ui-h3-overview
```

- metric-aware high-value summary;
- useful selected-day panel;
- compact previous-period comparison;
- calendar and rankings in approved order;
- no duplicate or placeholder facts;
- clear provider, period, metric, state, and coverage hierarchy.

### P9H4 — task and lower-page repair

```text
branch: work-history-ui-h4-tasks
```

- one visible top-level task and one archive subview;
- repaired Daily, Peaks, and Battles hierarchy;
- Report & Export connected to provider, period, metric, selected scope, source, state, and limitations;
- oversized sparse regions replaced by compact explicit states;
- existing output schemas preserved unless separately approved.

### P9H5 — responsive and accessibility repair

```text
branch: work-history-ui-h5-responsive
```

- reconcile 1440, 820, 390, and 360px layouts;
- keep controls, axes, units, and selected-day flow readable;
- implement touch day inspection;
- verify keyboard order, focus, target sizes, wrapping, reduced motion, contrast, and forced colors;
- no page-level horizontal overflow.

### P9H6 — complete local candidate QA

```text
branch: work-history-ui-h6-candidate
```

- all History and shared-web workflows on the latest candidate head;
- both metrics and all supported periods;
- Back, Forward, direct links, tasks, archives, selected day, comparison, calendar, rankings, report, share, PNG, CSV, and JSON;
- Twitch/Kick separation;
- real, partial, stale, empty, missing, demo, and error states;
- desktop/tablet/mobile full-page artifacts;
- permanent rejection of visual-only metric switching and chart-without-scale regressions.

### P9H7 — Preview, production acceptance, and closure

```text
work branch: work-history-ui-h7-acceptance
hosted branch: one deliberate preview-* branch chosen later
```

- deliberate Preview from the completed P9H6 candidate;
- Pages Functions and Twitch/Kick binding verification;
- real retained-data verification for both metrics;
- responsive and output verification;
- merge only the accepted candidate;
- exact production SHA through `/deployment.json`;
- public Twitch and Kick History acceptance;
- permanent acceptance record;
- stable specification and plan update;
- deletion of `history-ui-repair-working-note.md`.

## 8. Other Phase 9 repairs

P8B may identify non-History P0/P1 defects in Portal, Heatmap, Day Flow, Battle Lines, Channel, Watchlist, Status, or support surfaces.

Rules:

- P0 may interrupt immediately;
- P1 receives a narrow branch and exact gate;
- P2 waits for Phase 10 unless it blocks a repaired P1 surface;
- no new feature may enter Phase 9;
- History remains the central scheduled repair track.

## 9. Later phases

- Phase 10: shared UI, chart, responsive, and accessibility consolidation.
- Phase 11: unified acceptance, monitoring, runbooks, and maintenance cadence.
- Phase 12: Support, Contact, Terms, Privacy, refund, disclosure, Stripe, and launch readiness.
- Phase 13: staged external launch and feedback classification.
- Phase 14: one-candidate-at-a-time data-capability audit.
- Phase 15: no branch until one candidate is approved and explicitly authorized.

## 10. Current stop rule

P8A is complete through PR #427. Stop after the full merge report. Do not create `work-public-browser-audit` until explicit continuation.
