# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.3
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Completed window: Phase 8 P8A through PR #427
Current window: Phase 8 P8B
Current branch: `work-public-browser-audit`
Exact next branch after P8B: `work-history-ui-h0-baseline`
Permanent specification: `history-and-trends-spec.md`
Active repair specification: `history-ui-repair-spec.md`
Program authority: `post-watchlist-program-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`
P8A inventory: `../audits/public-surface-inventory.json`
P8B scope: `../audits/P8B_SCOPE.md`

## 1. Objective

Repair the public Twitch and Kick History experience so existing retained-data capabilities are understandable, visibly responsive to controls, and usable on desktop, tablet, and mobile.

This is defect and information-architecture repair, not feature expansion.

Approved P1 defects:

- Viewer-minutes and Peak viewers do not produce a sufficiently observable and trustworthy change;
- the chart does not yet permanently prove required scale, ticks, units, and interaction cues;
- selected-day and supporting information are too thin or disconnected;
- lower-page regions are sparse, poorly prioritized, duplicated, or unclear;
- desktop, tablet, and mobile do not prove one coherent task-oriented workflow.

## 2. Preserved architecture boundary

The repair preserves:

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- 7-day, 30-day, and supported custom periods;
- primary metrics `viewer_minutes` and `peak_viewers` only;
- selected day, previous-period comparison, calendar, ranking, archives, report, share, PNG, CSV, and JSON contracts;
- loading, real, partial, stale, empty, missing, demo, error, and in-progress distinctions;
- bounded non-provider-wide coverage language;
- loaded-payload reuse for task switching and outputs.

Not authorized:

- another metric or archive type;
- new History API, D1 schema, collector, cron, retention, or binding changes;
- exact sessions or cross-provider totals/rankings;
- login, cloud preferences, alerts, or AI summaries;
- silent output-schema changes.

## 3. Metric execution contract

Changing Viewer-minutes or Peak viewers must update:

- URL and request/payload state;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- summary labels and values;
- selected-day metric fact;
- previous-period comparison;
- ranking meaning and default sort where relevant;
- supported archive values;
- Report & Export context and generated text.

Checking only `aria-pressed`, selected styling, or button text is insufficient. Permanent gates must prove rendered values or units and dependent context change when metrics differ.

## 4. Chart and selected-day contract

The main chart must expose:

- readable UTC date ticks;
- readable numeric scale;
- selected metric and unit;
- meaningful baseline;
- exact detail with compact formatting;
- pointer, keyboard, and touch day inspection;
- visible selected day;
- complete, partial, in-progress, and missing distinctions;
- non-color-only legend;
- accessible title or description.

Selected-day analysis includes supported date, selected metric value and unit, peak viewers, top streamer, observed streams/minutes, coverage, warnings, and provider-safe Day Flow/Battle Lines actions.

## 5. Information architecture

Top-level tasks remain:

```text
Overview
Archives
Report & Export
```

Archives remain:

```text
Daily
Peaks
Battles
```

Only one task and one archive subview are visible at a time. Overview order remains provider/period/metric/state/scope, controls, task tabs, summary, chart and selected day, comparison, calendar, rankings, and concise coverage.

Large empty containers are not acceptable. Empty, partial, missing, stale, demo, and error states use compact explicit panels.

## 6. URL, request, responsive, and accessibility contracts

- Back and Forward restore supported state.
- Direct links restore task and archive.
- Task/archive switching does not trigger another History request.
- One response is used per uncached provider/period/metric state.
- No per-day or per-streamer request loop.
- Required widths: 1440, 820, 390, and 360px.
- No page-level horizontal overflow.
- Controls wrap semantically.
- Day inspection works without hover dependency.
- Keyboard access and visible focus remain.
- General targets are at least 44px; important mobile publishing/management targets are at least 48px.
- Long text wraps; reduced motion, increased contrast, and forced colors remain usable.

## 7. Phase and branch state

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           active
P9H0 work-history-ui-h0-baseline         exact next after P8B unless P0 interrupts
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 8. Active P8B audit

P8B must capture:

```text
1440px Twitch real Overview
390px Kick real Overview
820px partial evidence
360px stale, in-progress, and loading evidence
empty, missing, demo, and API error evidence
Viewer-minutes before and after
Peak viewers before and after
Overview / Archives / Report & Export
Daily / Peaks / Battles
Back / Forward and direct links
no-refetch task switching
```

For every defect P8B records:

- route and provider;
- viewport and state;
- exact reproduction;
- owner module and affected file;
- existing workflow coverage;
- missing assertion;
- P0, P1, P2, or P3 classification.

Known History defects remain P1. P8B does not re-approve them or repair them.

## 9. P9H0 — exact baseline and failing gates

- reproduce Twitch and Kick failures with real and deterministic data;
- trace metric state through URL, query, payload, chart, summary, selected day, comparison, rankings, archives, report, share, and exports;
- identify authoritative owner modules and compatibility layers;
- add failing assertions before repair;
- freeze required viewport and state artifacts;
- avoid broad styling changes.

## 10. P9H1 — metric execution

- repair both metrics end to end;
- preserve request and loaded-data reuse contracts;
- prove visible values, units, and dependent context change.

## 11. P9H2 — chart interpretation

- implement readable axes, scale, ticks, metric, unit, and exact day detail;
- support pointer, keyboard, and touch;
- preserve selected-day synchronization and honest state distinctions;
- add permanent accessibility and regression gates.

## 12. P9H3 — Overview hierarchy

- build metric-aware summary and useful selected-day analysis;
- place comparison, calendar, rankings, and coverage in approved order;
- remove duplicate and placeholder facts.

## 13. P9H4 — task and lower-page repair

- repair Daily, Peaks, Battles, and Report & Export hierarchy;
- connect outputs to current provider, period, metric, scope, source, state, and limitations;
- replace oversized sparse regions with compact explicit states;
- preserve schemas unless separately approved.

## 14. P9H5 — responsive and accessibility

- reconcile all four widths;
- keep controls, axes, units, chart, and selected-day flow readable;
- verify touch, keyboard, focus, target sizes, wrapping, motion, contrast, forced colors, and overflow.

## 15. P9H6 — complete local candidate

- run all History and shared-web workflows on latest head;
- verify metrics, periods, direct links, Back/Forward, tasks, archives, selected day, comparison, calendar, rankings, report, share, PNG, CSV, and JSON;
- verify provider separation and required states;
- create desktop/tablet/mobile artifacts;
- permanently reject visual-only metric switching and chart-without-scale regressions.

## 16. P9H7 — hosted and production acceptance

- one deliberate `preview-*` branch from P9H6;
- verify Pages Functions, bindings, real data, metrics, responsive behavior, and outputs;
- merge only the accepted candidate;
- verify exact production SHA through `/deployment.json`;
- complete public Twitch/Kick acceptance;
- transfer permanent evidence and delete the working note.

## 17. Acceptance matrix

History repair remains incomplete until all metric, chart, day-detail, task, archive, report/export, state, URL, request, provider-separation, responsive, accessibility, Preview, production, and documentation gates pass.

## 18. Stop and scope-change rules

After each PR merge:

1. issue the full merge report;
2. update roadmap, schedule, program plan, this plan, and the working note;
3. name the exact next branch;
4. stop;
5. wait for explicit continuation.

Stop and update the permanent specification before any capability outside the existing retained History response is added.
