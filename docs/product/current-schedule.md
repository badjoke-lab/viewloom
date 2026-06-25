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
- After every merge, issue the full merge report, update this schedule, identify the exact next branch, stop, and wait for explicit continuation.
- Every branch must read the roadmap, this schedule, `post-watchlist-program-plan.md`, the affected specification/plan, the active working note, and any active audit scope before changing code.
- When repository state and documentation disagree, update documentation first and do not proceed from chat memory.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  production core; Phase 8 audit active
Day Flow                                 production core; Phase 8 audit active
Battle Lines                             production core; Phase 8 audit active
History baseline H1-H7                   production accepted
History public-quality repair            approved P1 program
Channel C0-C5B                           production accepted
Report/export R0-R4                      complete through PR #413
Local Watchlist W0-W5B                   complete through PR #425
Phase 7 source reset                     complete through PR #426
Phase 8 public audit                     active
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
Phase: Phase 8 — all-public-surface inventory and browser defect audit
Window: P8A — public surface inventory
Branch: work-public-surface-inventory
State: active
Predecessor: PR #426 merged
Runtime change: none allowed
Exact next branch: work-public-browser-audit
```

Governing files:

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
docs/audits/P8A_SCOPE.md
docs/audits/README.md
```

P8A repository package:

```text
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

## 4. Immediate sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       active
P8B  work-public-browser-audit           exact next after P8A merge report
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

## 5. P8A — public surface inventory

Purpose:

Create one validated inventory of public routes, providers, metadata, APIs, controls, states, entry points, owners, existing gates, and missing acceptance coverage.

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
- chart, selected day, comparison, calendar, rankings, and coverage;
- report, short post, share card, PNG, CSV, and JSON;
- existing local, Preview, and production gates.

P8A completion criteria:

- every public route has an explicit owner and acceptance status;
- metadata, API, control, state, entry-point, and provider dependencies are recorded;
- shared profiles are separated from route records without hiding route-specific differences;
- missing surfaces and missing browser/state coverage are explicit;
- inventory JSON and human-readable report agree;
- `node scripts/verify-public-surface-inventory.mjs` passes;
- CI passes on the latest branch head;
- no UI repair, API, D1, collector, cron, retention, binding, or Preview change is mixed into P8A;
- P8B is named as the exact next branch.

## 6. P8B — public browser defect audit

Branch:

```text
work-public-browser-audit
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
```

Required interaction checks:

- period and metric changes;
- Back, Forward, and direct links;
- chart scale, units, ticks, tooltip/day detail, and selected-day synchronization;
- filters, sorting, task and archive navigation;
- keyboard, focus, touch targets, reduced motion, contrast, long text, and overflow;
- provider separation;
- copy, share, PNG, CSV, JSON, and deep-link actions;
- Home, Channel, Watchlist, Status, support, policy, and error entry points.

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
- affected routes, states, owners, files, and workflows are identified;
- defects are ordered without beginning a new feature;
- P9H0 is the next branch unless a newly discovered P0 interrupts.

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

### P9H4 — Archives and Report & Export

```text
branch: work-history-ui-h4-tasks
```

- one visible top-level task and one archive subview;
- repaired Daily, Peaks, and Battles hierarchy;
- output surfaces connected to current provider, period, metric, selected scope, source, state, and limitations;
- oversized sparse regions removed or replaced by compact explicit states;
- existing output schemas preserved unless separately approved.

### P9H5 — responsive and accessibility

```text
branch: work-history-ui-h5-responsive
```

- reconcile 1440, 820, 390, and 360px layouts;
- readable controls, axes, units, chart, and selected-day flow;
- touch day inspection;
- keyboard order and visible focus;
- 44px general targets and 48px important mobile targets;
- wrapping, reduced motion, contrast, forced colors, and no page overflow.

### P9H6 — complete local candidate QA

```text
branch: work-history-ui-h6-candidate
```

- all History and shared-web workflows on the latest candidate;
- both metrics, periods, Back/Forward, direct links, tasks, archives, selected day, comparison, calendar, ranking, report, share, PNG, CSV, and JSON;
- Twitch/Kick separation;
- real, partial, stale, empty, missing, demo, and error states;
- desktop/tablet/mobile artifacts;
- permanent rejection of visual-only metric switching and chart-without-scale regressions.

### P9H7 — Preview, production acceptance, and closure

```text
work branch: work-history-ui-h7-acceptance
hosted branch: chosen later; must use preview-*
```

- one deliberate Preview from P9H6 candidate;
- Pages Functions and binding verification;
- real retained-data verification for both metrics;
- responsive and output verification;
- merge only accepted candidate;
- exact production SHA through `/deployment.json`;
- public Twitch and Kick acceptance;
- permanent acceptance record;
- stable document transfer;
- deletion of `history-ui-repair-working-note.md`.

## 8. Other Phase 9 repairs

P8B may identify non-History P0/P1 defects in Portal, Heatmap, Day Flow, Battle Lines, Channel, Watchlist, Status, or support surfaces.

Rules:

- P0 may interrupt immediately;
- P1 receives a narrow branch and exact gate;
- P2 waits for Phase 10 unless it blocks repaired P1 acceptance;
- no new feature may enter Phase 9;
- History remains the central scheduled repair track.

## 9. Later phase windows

The complete later-phase sequence, branch groups, deliverables, and exit criteria live in `post-watchlist-program-plan.md`.

```text
Phase 10  U10A–U10E  cross-site UI and interaction consolidation
Phase 11  O11A–O11D  operations and maintenance lock
Phase 12  R12A–R12C  Support/legal/Stripe/release readiness
Phase 13  L13A–L13C  external launch and feedback classification
Phase 14  N14A–N14B  next-feature capability audit and one decision
Phase 15  no branch   separately approved major feature only
```

## 10. Repository comparison checklist

Before each branch:

```text
[ ] predecessor PR is merged
[ ] full merge report was issued
[ ] explicit continuation exists
[ ] current branch matches this schedule
[ ] roadmap, program plan, affected plan, and working note agree
[ ] required repository files/workflows are present
[ ] missing deliverables are listed
[ ] scope boundaries are still valid
```

Before each merge:

```text
[ ] latest-head CI passes
[ ] required browser/state evidence exists
[ ] provider separation passes
[ ] deliberate Preview used only if required
[ ] exact production identity recorded when public completion is claimed
[ ] permanent documents updated
[ ] temporary notes updated or retired
[ ] exact next branch recorded
```

## 11. Current stop rule

P8A is the only active branch. After its merge report, stop. Do not create P8B until the user explicitly instructs continuation.
