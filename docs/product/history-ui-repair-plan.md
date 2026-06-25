# ViewLoom History UI repair implementation plan

Status: active implementation plan
Version: 1.0
Created: 2026-06-25
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Permanent specification: `history-and-trends-spec.md`
Completed baseline record: `history-layout-rebuild-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`

## 1. Objective

Repair the public Twitch and Kick History experience so that its existing retained-data capabilities are understandable, visibly responsive to user controls, and usable on desktop, tablet, and mobile.

This milestone is defect repair and information-architecture repair. It is not a new History feature expansion.

The user-reported problems are approved P1 defects:

- the Viewer-minutes and Peak viewers controls do not produce a sufficiently observable and trustworthy change;
- the main chart lacks the visible scale, ticks, units, and interaction cues required to interpret it;
- the chart-side information is too thin to support analysis;
- lower-page regions are sparse, poorly prioritized, or unclear in purpose;
- the page does not yet read as one coherent analysis workflow on desktop and mobile.

The previous requirement to wait for additional screenshots before beginning these repairs is retired. Additional reference images may refine styling later, but they are not a blocker for functional and information-architecture repair.

## 2. Preserved data and architecture boundary

The repair must preserve:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- existing 7-day, 30-day, and supported custom-period behavior;
- the two supported primary metrics: `viewer_minutes` and `peak_viewers`;
- existing selected-day, previous-period, calendar, ranking, archive, report, share-card, CSV, and JSON data contracts;
- loading, real, partial, stale, empty, missing, demo, and error distinctions;
- bounded, non-provider-wide coverage language;
- provider-safe Day Flow, Battle Lines, and Channel links;
- loaded-payload reuse for client-side task switching and outputs.

The repair does not authorize:

- a new metric;
- a new History API route;
- D1 schema, collector, cron, retention, or binding changes;
- exact session reconstruction;
- cross-provider totals or rankings;
- login, cloud preferences, alerts, or AI summaries;
- silent CSV, JSON, report, or share-card schema changes.

Average viewers, observed streams, and observed minutes may remain supporting facts when already present in the loaded response. They are not new primary metric buttons in this milestone.

## 3. Required repaired product behavior

### 3.1 Metric execution

Changing between Viewer-minutes and Peak viewers must update all metric-dependent surfaces consistently:

- URL state;
- requested API metric when a new response is required;
- selected control state;
- chart values and scale;
- chart unit and accessible description;
- summary KPI labels and values;
- selected-day facts;
- previous-period comparison;
- Top streamers ranking meaning and default sort where applicable;
- archive values where the selected metric is displayed;
- Report & Export context and generated text.

Acceptance must prove that the rendered metric values or units change. Checking only `aria-pressed` or button styling is insufficient.

### 3.2 Chart interpretability

The main daily trend chart must expose:

- an X-axis with readable UTC date ticks;
- a Y-axis or equivalent visible scale with numeric ticks;
- the selected metric name;
- the selected metric unit;
- a zero or clearly explained baseline where appropriate;
- readable formatting for large values;
- an accessible chart title or description;
- hover, keyboard, and touch-accessible day details;
- a distinct selected day;
- visible missing, partial, and in-progress distinctions;
- a legend that explains data quality and does not rely on color alone.

A chart with bars or lines but no readable scale, unit, or day interpretation fails acceptance.

### 3.3 Summary and selected-day analysis

The primary Overview must provide useful, non-placeholder analysis.

Metric-aware period summary may include:

- selected metric total or period aggregate;
- daily average for the selected metric where mathematically valid;
- peak value and peak day;
- top streamer;
- previous-period change when comparable;
- observed days / requested days;
- partial and missing counts;
- concise data state and coverage.

The chart-side selected-day panel must include, when supported:

- UTC date;
- selected metric value and unit;
- peak viewers;
- top streamer;
- observed stream count;
- observed minutes;
- coverage state;
- provider-safe Day Flow and Battle Lines actions.

On desktop, the chart and selected-day analysis may share a two-column area. On tablet and mobile, the selected-day analysis follows the chart in reading order.

### 3.4 Information architecture

The page remains task-oriented:

```text
Overview
Archives
  Daily
  Peaks
  Battles
Report & Export
```

Overview order:

1. provider, period, metric, state, and observed scope;
2. period and metric controls;
3. task navigation;
4. metric-aware summary KPIs;
5. main chart and selected-day analysis;
6. compact previous-period comparison;
7. calendar heat;
8. Top streamers and supported key changes;
9. concise coverage explanation.

Archives and Report & Export remain separate tasks rather than permanently expanded lower-page sections.

Large empty containers are not acceptable. When data or a task is unavailable, render a compact, explicit empty, partial, or error state with the next useful action.

### 3.5 Responsive and accessibility behavior

Required acceptance widths:

```text
desktop: 1440px
tablet: 820px
mobile: 390px
narrow mobile: 360px
```

Requirements:

- no page-level horizontal overflow;
- period, metric, task, and archive controls wrap in semantic order;
- chart labels and units remain readable;
- touch users can inspect a day without hover-only behavior;
- keyboard users can change metric, period, task, archive, and selected day;
- visible focus is retained;
- general touch targets are at least 44px;
- important mobile management and publishing targets are at least 48px;
- long names, URLs, report text, facts, and status messages wrap safely;
- reduced-motion, increased-contrast, and forced-color modes remain usable;
- state and comparison meaning do not depend on color alone.

## 4. Phase order

```text
Phase 7  source-of-truth reset and repair-program lock
Phase 8  all-public-surface inventory and browser defect audit
Phase 9  P0/P1 core repair, with History UI repair as the central approved track
Phase 10 cross-site visual and interaction-system consolidation
Phase 11 operations, monitoring, and maintenance lock
Phase 12 Support, legal, Stripe, and release-readiness audit
Phase 13 external launch and feedback classification
Phase 14 next-feature data-capability audit
Phase 15 one separately approved major feature, if any
```

Phase 8 audits the current public site before repair. It does not reclassify the listed History defects below P1 or defer them again.

## 5. Branch and PR sequence

Only the current branch exists. Later branches must not be created before the preceding merge report and explicit continuation instruction.

```text
P7A  work-history-ui-repair-governance   active; roadmap/spec/schedule reset

P8A  work-public-surface-inventory       next after P7A merge report
P8B  work-public-browser-audit           route/browser matrix and defect ledger

P9H0 work-history-ui-h0-baseline         exact reproduction, DOM/data-flow audit, fixture and acceptance matrix
P9H1 work-history-ui-h1-metric           metric state, request, renderer, labels, and dependent-surface repair
P9H2 work-history-ui-h2-chart            axes, ticks, units, tooltip/day inspection, quality legend
P9H3 work-history-ui-h3-overview         KPI hierarchy, selected-day panel, comparison, calendar, ranking flow
P9H4 work-history-ui-h4-tasks            Archives and Report & Export structure, sparse/empty-region repair
P9H5 work-history-ui-h5-responsive       desktop/tablet/mobile/accessibility repair
P9H6 work-history-ui-h6-candidate        complete local candidate QA and permanent regression gates
P9H7 work-history-ui-h7-acceptance       deliberate Preview, exact production acceptance, permanent record, note cleanup
```

Phase 8 may discover non-History P0/P1 defects. Those receive narrow repair branches inside Phase 9. History remains the central scheduled repair and must not be displaced by P2 polish or new features.

## 6. Detailed execution windows

### P7A — source reset and repair-program lock

Deliverables:

- correct stale post-Watchlist roadmap and schedule state;
- approve History UI repair as P1 work;
- update the permanent History target specification;
- create this implementation plan and the active working note;
- update documentation index, root README, and policy verification.

No runtime UI or API change is allowed.

### P8A — public surface inventory

Create a machine-readable inventory of public routes, providers, states, controls, APIs, existing browser gates, and missing acceptance coverage.

History inventory must include Overview, Archives, Report & Export, period controls, both metric controls, chart, selected-day inspector, comparison, calendar, rankings, coverage, and exports.

### P8B — public browser defect audit

Capture 1440, 820, 390, and 360px evidence for all major public pages. Classify defects as P0, P1, P2, or P3.

The known History issues in Section 1 are pre-approved P1 defects. P8B adds exact reproductions and affected-file evidence; it does not require another approval decision.

### P9H0 — exact History baseline

- reproduce Twitch and Kick failures with real and deterministic fixture data;
- trace metric controls through URL state, API query, loaded payload, renderer, summary, chart, selected day, ranking, archives, and outputs;
- inventory every visible section and remove ambiguity about its role;
- add failing acceptance assertions before changing product behavior;
- freeze desktop, tablet, mobile, partial, empty, stale, and error baseline artifacts.

### P9H1 — metric execution repair

- repair both metric controls end to end;
- keep one provider History request per uncached period/metric combination;
- ensure Back/Forward restores cached state where supported;
- synchronize chart, summary, selected day, comparison, ranking meaning, archive values, report, and export context;
- add tests proving rendered values or units change.

### P9H2 — chart interpretability repair

- implement readable date and numeric axes;
- expose scale, tick labels, selected metric, and unit;
- provide pointer, keyboard, and touch day details;
- preserve selected-day URL synchronization;
- distinguish complete, partial, in-progress, and missing data;
- add chart-specific accessibility text and regression gates.

### P9H3 — Overview information architecture repair

- rebuild the summary into high-value metric-aware facts;
- make the selected-day panel analytically useful;
- place comparison, calendar, rankings, and coverage in the accepted priority order;
- prevent duplicate facts and placeholder panels;
- keep the chart visually dominant without making supporting information thin or disconnected.

### P9H4 — task and lower-page repair

- ensure only one top-level task and one archive subview are visible;
- repair Daily, Peaks, and Battles hierarchy and bounded initial visibility;
- connect current provider, period, metric, selected day, coverage, and source to Report & Export;
- remove or replace oversized empty regions;
- preserve output schemas unless a separate contract change is approved.

### P9H5 — responsive and accessibility repair

- reconcile 1440, 820, 390, and 360px layouts;
- keep controls and chart readable without page overflow;
- implement touch-accessible day inspection;
- verify keyboard order, focus, target sizes, wrapping, reduced motion, contrast, and forced colors.

### P9H6 — complete local candidate QA

- run all affected History and shared-web workflows on the latest candidate head;
- verify Twitch and Kick separation;
- verify real, partial, stale, empty, missing, demo, and error states;
- verify both metrics, all periods, Back/Forward, direct links, archives, report, share, CSV, and JSON;
- generate full-page desktop/tablet/mobile artifacts;
- reject visual-only metric switching and chart-without-scale regressions permanently.

### P9H7 — hosted and production acceptance

- create one deliberate `preview-*` branch from the completed P9H6 candidate;
- verify Pages Functions, provider bindings, real retained data, both metrics, responsive behavior, and outputs;
- merge only the accepted candidate;
- verify exact production SHA through `/deployment.json`;
- run public Twitch and Kick History acceptance;
- transfer stable evidence to permanent documentation;
- delete the active temporary note.

## 7. Acceptance matrix

History UI repair is not complete until all of the following pass:

- Viewer-minutes and Peak viewers visibly and semantically produce different rendered states when the data differs;
- chart metric, unit, scale, tick labels, selected day, and data-quality meaning are visible;
- chart day details work with pointer, keyboard, and touch;
- summary and selected-day analysis contain supported, useful facts rather than placeholders;
- Overview follows the approved priority order;
- Archives and Report & Export are separate, complete tasks;
- large sparse regions have a defined task or a compact explicit empty state;
- period, metric, task, archive, selected-day, and supported custom-range URL state survives direct links and Back/Forward;
- no task or archive switch causes an unnecessary History refetch;
- provider separation and bounded-coverage language remain exact;
- 1440, 820, 390, and 360px checks pass;
- all History, Status, Channel, shared-output, build, policy, naming, and readiness regressions pass;
- deliberate Preview and exact production acceptance pass on the final candidate;
- permanent records are updated and the temporary note is deleted.

## 8. Stop and scope-change rules

After each PR merge:

1. issue the full merge report;
2. state the current phase and exact next branch;
3. stop;
4. do not create the next branch until the user explicitly instructs continuation.

Stop and update the permanent specification before adding a new metric, new archive type, changed output schema, new API route, D1 or collector change, session reconstruction, cross-provider comparison, login, alerts, AI interpretation, or any capability outside the existing retained History response.
