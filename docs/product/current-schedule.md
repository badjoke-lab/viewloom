# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-25

## 1. Operating rules

- P0 production failures interrupt planned work immediately.
- P1 defects interrupt or reorder the active repair phase when they block acceptance.
- `work-*` branches are implementation, repair, audit, test, or documentation branches.
- `preview-*` branches are reserved for deliberate Cloudflare runtime validation of completed candidates.
- Only the latest candidate head is authoritative.
- Full acceptance uses the exact deployed revision.
- After every merge, issue the full merge report, identify the next branch, stop, and wait for explicit continuation.
- Every branch must read the current roadmap, this schedule, the active permanent specification, the active implementation plan, and the active working note before changing code.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core; Phase 8 audit pending
Day Flow                                 production core; Phase 8 audit pending
Battle Lines                             production core; Phase 8 audit pending
History baseline H1-H7                   production accepted
History public-quality repair            approved P1 program
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     active
Phase 8 public audit                     next
Phase 9 P0/P1 repair                     queued
Phase 10 shared UI consolidation         queued
Phase 11 operations lock                 queued
Phase 12 support/legal/release readiness queued
Phase 13 external launch                 queued
Phase 14 next-feature audit              queued
Phase 15 next major feature              not approved
```

## 3. Active window

```text
Phase 7 — source-of-truth reset and repair-program lock
Window: P7A
Branch: work-history-ui-repair-governance
State: active
Runtime change: none allowed
```

Governing files:

```text
docs/README.md
docs/product/current-roadmap.md
docs/product/current-schedule.md
docs/product/history-and-trends-spec.md
docs/product/history-ui-repair-spec.md
docs/product/history-layout-rebuild-plan.md
docs/product/history-ui-repair-plan.md
docs/work-in-progress/history-ui-repair-working-note.md
```

P7A deliverables:

- correct stale post-Watchlist state in root and canonical documents;
- remove the statement that History repair is blocked on screenshots;
- classify the known History problems as approved P1 defects;
- establish permanent repair specification and active implementation plan;
- establish one active working note;
- update repository policy verification to require these authorities;
- identify P8A as the exact next branch.

P7A completion criteria:

- roadmap, schedule, documentation index, root README, repair spec, plan, and note agree;
- no runtime History, API, database, collector, cron, retention, binding, or export-schema change;
- Development policy and relevant documentation checks pass;
- PR is merged and fully reported.

## 4. Immediate sequence

```text
P7A  work-history-ui-repair-governance   active
P8A  work-public-surface-inventory       next after P7A merge report
P8B  work-public-browser-audit           after P8A merge report
P9H0 work-history-ui-h0-baseline         after P8B merge report
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch exists yet.

## 5. Phase 8 schedule — public surface audit

### P8A — public surface inventory

Branch:

```text
work-public-surface-inventory
```

Purpose:

Create one machine-readable inventory of public routes, providers, metadata, APIs, user controls, data states, entry points, and current acceptance coverage.

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
Support and policy surfaces
404
```

History inventory must include:

- Overview, Archives, and Report & Export;
- Daily, Peaks, and Battles;
- 7d, 30d, and custom periods;
- Viewer-minutes and Peak viewers;
- chart, selected day, comparison, calendar, rankings, coverage;
- report, short post, share card, PNG, CSV, and JSON;
- existing local, Preview, and production gates.

P8A completion criteria:

- every public route has an owner and acceptance status;
- missing browser/state coverage is explicit;
- no product repair is mixed into the inventory PR;
- exact next branch is P8B.

### P8B — public browser defect audit

Branch:

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
```

Required interaction checks:

- period and metric changes;
- Back / Forward and direct links;
- chart scale, units, ticks, tooltip/day detail;
- selected-day synchronization;
- filters, sorting, task and archive navigation;
- keyboard, focus, touch targets, reduced motion, long text, overflow;
- provider separation;
- output and deep-link actions.

Defect classes:

```text
P0  outage, materially wrong data, provider/privacy failure
P1  primary feature unusable, misleading, or materially incomplete
P2  clarity, consistency, polish, or secondary interaction defect
P3  deferred improvement or feature request
```

The known History problems remain P1 without another approval gate.

P8B completion criteria:

- exact reproduction evidence exists for every P0/P1;
- affected routes, states, files, and workflows are identified;
- the repair queue is ordered without beginning a new feature;
- exact next branch is P9H0 unless a newly discovered P0 interrupts.

## 6. Phase 9 schedule — P0/P1 repair

### P9H0 — History baseline and failing gates

Branch:

```text
work-history-ui-h0-baseline
```

Deliverables:

- trace metric state from controls through URL, API query, payload, chart, summary, inspector, comparison, rankings, archives, report, share, and export;
- identify current owner modules and compatibility layers;
- add failing assertions for visible metric changes, chart scale/units/ticks, selected-day detail, sparse regions, touch behavior, and Back/Forward;
- freeze 1440, 820, 390, and 360px baseline artifacts;
- document real, partial, empty, stale, demo, and error behavior.

No broad styling rewrite is allowed in P9H0.

### P9H1 — metric execution repair

Branch:

```text
work-history-ui-h1-metric
```

Deliverables:

- repair Viewer-minutes and Peak viewers end to end;
- synchronize URL state, request/cache behavior, chart values, units, summary, selected day, comparison, ranking meaning, archives, report, and export context;
- preserve one provider request per uncached period/metric state;
- preserve task/archive no-refetch behavior;
- add regression evidence that rendered values or units change, not only button styling.

### P9H2 — chart interpretability repair

Branch:

```text
work-history-ui-h2-chart
```

Deliverables:

- readable UTC X-axis ticks;
- readable numeric Y-axis or equivalent scale;
- metric label and unit;
- compact and exact values;
- visible selected day;
- pointer, keyboard, and touch-accessible day details;
- complete, partial, in-progress, and missing distinctions;
- non-color-only legend and accessible description.

### P9H3 — Overview information architecture repair

Branch:

```text
work-history-ui-h3-overview
```

Deliverables:

- metric-aware high-value summary;
- useful selected-day panel;
- compact comparable previous-period change;
- calendar and Top streamers in the approved analysis order;
- removal of duplicate or placeholder facts;
- clear provider, period, metric, state, and coverage hierarchy.

### P9H4 — task and lower-page repair

Branch:

```text
work-history-ui-h4-tasks
```

Deliverables:

- one visible top-level task and one archive subview;
- repaired Daily, Peaks, and Battles hierarchy and bounded visibility;
- Report & Export connected to current provider, period, metric, selected scope, source, state, and limitations;
- oversized sparse regions removed or replaced by compact explicit states;
- existing output schemas preserved unless separately approved.

### P9H5 — responsive and accessibility repair

Branch:

```text
work-history-ui-h5-responsive
```

Deliverables:

- 1440, 820, 390, and 360px reconciliation;
- readable controls, axes, units, and selected-day flow;
- touch day inspection;
- keyboard order and visible focus;
- 44px general touch targets;
- 48px important mobile management/publishing targets;
- wrapping, reduced motion, contrast, and forced-color support;
- no page-level horizontal overflow.

### P9H6 — complete local candidate QA

Branch:

```text
work-history-ui-h6-candidate
```

Deliverables:

- all History and shared-web workflows on the latest candidate head;
- both metrics and all supported periods;
- Back / Forward, direct links, tasks, archives, selected day, comparison, calendar, ranking, report, share, PNG, CSV, and JSON;
- Twitch/Kick separation;
- real, partial, stale, empty, missing, demo, and error states;
- desktop/tablet/mobile full-page artifacts;
- permanent rejection of visual-only metric switching and chart-without-scale regressions.

### P9H7 — Preview, production acceptance, and closure

Work branch:

```text
work-history-ui-h7-acceptance
```

Hosted branch is chosen later and must use `preview-*`.

Deliverables:

- one deliberate Preview from the completed P9H6 candidate;
- Pages Functions and Twitch/Kick binding verification;
- real retained-data verification for both metrics;
- responsive and output verification;
- merge of the accepted candidate only;
- exact production SHA through `/deployment.json`;
- public Twitch and Kick History acceptance;
- permanent acceptance record;
- stable specification and plan update;
- deletion of `history-ui-repair-working-note.md`.

## 7. Other Phase 9 repairs

P8B may identify non-History P0/P1 defects in Portal, Heatmap, Day Flow, Battle Lines, Channel, Watchlist, Status, or support surfaces.

Rules:

- P0 may interrupt immediately;
- P1 receives a narrow branch and exact gate;
- P2 waits for Phase 10 unless it blocks a repaired P1 surface;
- no new feature may enter Phase 9;
- History remains the central scheduled repair track.

## 8. Later phases

### Phase 10 — shared UI system

Unify typography, spacing, surfaces, controls, chart grammar, status, loading, empty, partial, error, focus, and responsive behavior after P0/P1 repair.

### Phase 11 — operations lock

Create the cross-feature acceptance matrix, freshness/capacity monitoring, failure runbooks, dependency cadence, and workflow ownership.

### Phase 12 — support/legal/release readiness

Audit Support, Contact, Terms, Privacy, refund policy, commercial disclosure, footer links, Stripe registration, Payment Link, and mobile support flow.

### Phase 13 — external launch

Publish incrementally and classify feedback. P0/P1 may interrupt; feature requests do not automatically change the roadmap.

### Phase 14 — next-feature audit

Audit one candidate at a time for source parity, collector requirements, D1 growth, rollups, Cloudflare limits, honesty, value, and maintenance cost.

### Phase 15 — separately approved feature

No branch may be created until Phase 14 approves one candidate and the user explicitly authorizes it.

## 9. Current stop rule

P7A is the only active branch. After its merge report, stop. Do not create P8A until the user explicitly instructs continuation.
