# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.2
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Completed window: Phase 8 P8A through PR #427
Exact next window: Phase 8 P8B
Exact next branch: `work-public-browser-audit`
Permanent specification: `history-and-trends-spec.md`
Active repair specification: `history-ui-repair-spec.md`
Program authority: `post-watchlist-program-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`
P8A inventory: `../audits/public-surface-inventory.json`

## 1. Objective

Repair the public Twitch and Kick History experience so its existing retained-data capabilities are understandable, visibly responsive to controls, and usable on desktop, tablet, and mobile.

This is defect and information-architecture repair, not a new History feature expansion.

Approved P1 defects:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable and trustworthy change;
- the main chart lacks visible scale, ticks, units, and interaction cues;
- chart-side information is too thin to support analysis;
- lower-page regions are sparse, poorly prioritized, duplicated, or unclear;
- desktop, tablet, and mobile do not form one coherent task-oriented workflow.

Additional screenshots may refine styling later. They are not an entry criterion for functional, chart, information-architecture, responsive, or accessibility repair.

## 2. Preserved data and architecture boundary

The repair preserves:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- existing 7-day, 30-day, and supported custom-period behavior;
- the two supported primary metrics: `viewer_minutes` and `peak_viewers`;
- selected-day, previous-period, calendar, ranking, archive, report, share-card, CSV, and JSON contracts;
- loading, real, partial, stale, empty, missing, demo, error, and in-progress distinctions;
- bounded, non-provider-wide coverage language;
- provider-safe Day Flow, Battle Lines, and Channel links;
- loaded-payload reuse for task switching and outputs.

The repair does not authorize:

- another primary metric;
- a new History API route;
- D1 schema, collector, cron, retention, or binding changes;
- exact session reconstruction;
- cross-provider totals or rankings;
- login, cloud preferences, alerts, or AI summaries;
- silent output-schema changes.

Average viewers, observed streams, and observed minutes may remain supporting facts when already present. They are not primary metric buttons.

## 3. Metric execution contract

Changing Viewer-minutes or Peak viewers must update every metric-dependent surface consistently:

- URL state;
- API query or loaded-payload selection;
- selected control and accessible name;
- chart values, scale, ticks, unit, and accessible description;
- summary labels and values;
- selected-day metric facts;
- previous-period comparison;
- Top streamers ranking meaning and default sort where relevant;
- supported archive values;
- Report & Export context and generated text.

Checking only `aria-pressed`, selected styling, or button text is insufficient. Browser gates must prove rendered values or units and dependent summary context change when fixture or real data differs.

## 4. Chart contract

The main daily trend chart is the dominant Overview visual.

It must expose:

- readable UTC date ticks;
- readable numeric scale or equivalent Y-axis;
- selected metric name and unit;
- meaningful baseline;
- compact large-number formatting with exact details;
- visible selected day;
- pointer, keyboard, and touch day detail;
- complete, partial, in-progress, and missing distinctions;
- non-color-only data-quality legend;
- accessible title, description, or equivalent structured text.

A chart containing bars or lines without readable scale, unit, date context, or day detail fails acceptance.

## 5. Summary and selected-day contract

Metric-aware period summary may include:

- selected metric total or valid period aggregate;
- daily average where mathematically valid;
- peak value and peak day;
- top streamer;
- previous-period change when comparable;
- observed days / requested days;
- partial and missing counts;
- concise state and coverage.

Unavailable values are not rendered as invented zeroes.

Selected-day analysis includes when supported:

- UTC date;
- selected metric value and unit;
- peak viewers;
- top streamer;
- observed stream count;
- observed minutes;
- coverage state;
- partial, in-progress, or missing warning;
- provider-safe Day Flow and Battle Lines actions.

Desktop may place chart and selected-day analysis side by side. Tablet and mobile place selected-day analysis after the chart in reading order.

## 6. Information architecture

Top-level tasks remain:

```text
Overview
Archives
Report & Export
```

Archive subviews remain:

```text
Daily
Peaks
Battles
```

Only one top-level task and one archive subview are visible at a time.

Overview order:

1. provider, period, metric, state, and observed scope;
2. period and metric controls;
3. task navigation;
4. metric-aware summary;
5. chart and selected-day analysis;
6. previous-period comparison;
7. calendar heat;
8. Top streamers and supported changes;
9. concise coverage explanation and methodology/status links.

Large empty containers are not acceptable. Empty, partial, missing, stale, demo, and error cases use compact explicit state panels with the next useful action when one exists.

## 7. Period, URL, and request behavior

Supported periods remain Last 7 days, Last 30 days, and supported custom range.

URL state preserves provider, period, metric, valid custom dates, task, archive, selected day, sort, and limit where relevant.

Back and Forward restore intended state. Direct links restore task and archive. Task and archive switching reuse loaded data and do not trigger unnecessary History requests.

Metric and period behavior follows one provider response per uncached provider/period/metric state and page-memory reuse where supported. No per-day or per-streamer request loop is allowed.

## 8. Responsive and accessibility contract

Required widths:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- semantic control wrapping;
- readable chart scale, ticks, units, and selected day;
- mobile layout is not a scaled-down desktop;
- touch day inspection without hover dependency;
- keyboard access to period, metric, task, archive, and selected day;
- visible focus;
- 44px general touch targets;
- 48px important mobile management/publishing targets;
- safe long-text and URL wrapping;
- reduced-motion, increased-contrast, and forced-color support;
- state and comparison do not rely on color alone.

## 9. Phase and branch state

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           exact next after explicit continuation
P9H0 work-history-ui-h0-baseline         queued
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

No later branch may be created before the preceding merge report and explicit continuation.

## 10. P7A — completed governance reset

PR #426 completed:

- post-Watchlist source-of-truth correction;
- P1 defect approval;
- removal of screenshot blocker;
- repair specification, plan, and working note;
- policy verification updates;
- P8A next-branch lock.

No runtime UI, API, D1, collector, cron, retention, binding, or output-schema change occurred.

## 11. P8A — completed public surface inventory

PR #427 completed:

- both History routes and their API/binding owners;
- period, custom range, metric, task, archive, selected-day, sort, and limit controls;
- Overview, Archives, Report & Export, Daily, Peaks, and Battles;
- chart, selected day, comparison, calendar, rankings, coverage, report, short post, share, PNG, CSV, and JSON ownership;
- contract, browser, Preview, and production evidence;
- explicit missing assertions and continued P1 assessment.

P8A confirmed that repository presence and legacy workflows do not prove current public usability. It made no runtime repair.

## 12. P8B — browser defect audit

Exact next branch:

```text
work-public-browser-audit
```

P8B captures:

```text
1440px Twitch Overview
1440px Kick Overview
820px task and control wrapping
390px Overview and selected-day flow
360px narrow chart and control behavior
Viewer-minutes before and after
Peak viewers before and after
partial data
empty data
stale data
missing data
demo data
API error
loading state
Archives Daily / Peaks / Battles
Report & Export
Back / Forward and direct links
```

P8B must record for each defect:

- route and provider;
- viewport and data state;
- exact reproduction;
- owner module and affected file;
- current workflow coverage;
- missing assertion;
- P0, P1, P2, or P3 classification.

Known History defects remain P1. P8B does not re-approve them.

## 13. P9H0 — exact baseline and failing gates

- reproduce Twitch and Kick failures with real and deterministic data;
- trace metric state through URL, query, payload, chart, summary, inspector, comparison, rankings, archives, report, share, and exports;
- identify authoritative owner modules and compatibility layers;
- add failing assertions before product repair;
- freeze desktop, tablet, mobile, partial, empty, stale, demo, and error artifacts;
- do not begin broad styling repair.

## 14. P9H1 — metric execution

- repair both metrics end to end;
- synchronize URL, request/cache, chart, summary, selected day, comparison, ranking meaning, archives, report, share, and exports;
- preserve one provider request per uncached period/metric state;
- preserve task/archive no-refetch behavior;
- prove visible values or units change.

## 15. P9H2 — chart interpretability

- implement readable date and numeric axes;
- expose scale, ticks, metric, and unit;
- provide pointer, keyboard, and touch day details;
- preserve selected-day synchronization;
- distinguish complete, partial, in-progress, and missing states;
- add chart accessibility text and permanent gates.

## 16. P9H3 — Overview information architecture

- rebuild summary into high-value metric-aware facts;
- make selected-day analysis useful;
- place comparison, calendar, rankings, and coverage in approved order;
- remove duplicate and placeholder facts;
- retain chart dominance and connected supporting analysis.

## 17. P9H4 — tasks and lower-page repair

- one visible top-level task and one archive subview;
- repaired Daily, Peaks, and Battles hierarchy;
- Report & Export connected to provider, period, metric, selected scope, source, state, and limitations;
- oversized sparse regions removed or replaced with compact explicit states;
- output schemas preserved unless separately approved.

## 18. P9H5 — responsive and accessibility

- reconcile 1440, 820, 390, and 360px layouts;
- keep controls, axes, units, chart, and selected-day flow readable;
- implement touch day inspection;
- verify keyboard order, focus, target sizes, wrapping, reduced motion, contrast, and forced colors.

## 19. P9H6 — complete local candidate QA

- run all affected History and shared-web workflows on latest candidate;
- verify both metrics, periods, Back/Forward, direct links, tasks, archives, selected day, comparison, calendar, ranking, report, share, PNG, CSV, and JSON;
- verify provider separation and all data states;
- generate full-page desktop/tablet/mobile artifacts;
- permanently reject visual-only metric switching and chart-without-scale regressions.

## 20. P9H7 — hosted and production acceptance

- create one deliberate `preview-*` branch from P9H6 candidate;
- verify Pages Functions, bindings, real data, both metrics, responsive behavior, and outputs;
- merge only accepted candidate;
- verify exact production SHA through `/deployment.json`;
- run public Twitch and Kick History acceptance;
- transfer stable evidence to permanent documentation;
- delete the working note.

## 21. Acceptance matrix

History UI repair is incomplete until all pass:

- both metrics visibly and semantically produce different rendered states when data differs;
- chart metric, unit, scale, ticks, selected day, and quality meaning are visible;
- day detail works with pointer, keyboard, and touch;
- summary and selected-day analysis contain supported useful facts;
- Overview follows approved order;
- Archives and Report & Export are separate complete tasks;
- sparse regions have a task or compact explicit state;
- URL state survives direct links and Back/Forward;
- task/archive switching does not refetch History;
- provider separation and bounded wording remain exact;
- 1440, 820, 390, and 360px checks pass;
- History, Status, Channel, shared-output, build, policy, naming, and readiness regressions pass;
- deliberate Preview and exact production acceptance pass;
- permanent records are updated and the working note is deleted.

## 22. Stop and scope-change rules

After each PR merge:

1. issue the full merge report;
2. update roadmap, schedule, program plan, this plan, and the working note;
3. name the exact next branch;
4. stop;
5. do not create the next branch until explicit continuation.

Stop and update the permanent specification before adding another metric, archive type, API route, output schema, D1/collector change, session reconstruction, cross-provider comparison, login, alerts, AI interpretation, or any capability outside the existing retained History response.
