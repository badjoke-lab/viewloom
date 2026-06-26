# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.4
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed predecessor: Phase 8 P8B through PR #428
Current window: P9H0
Current branch: `work-history-ui-h0-baseline`
Exact next branch after P9H0: `work-history-ui-h1-metric`
Permanent specification: `history-and-trends-spec.md`
Active repair specification: `history-ui-repair-spec.md`
Program authority: `post-watchlist-program-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`
Audit baseline: `../audits/public-browser-defects.json`

## 1. Objective

Repair the public Twitch and Kick History experience so existing retained-data capabilities are understandable, visibly responsive to controls, coherent on desktop/tablet/mobile, and owned by an explicit maintainable controller structure.

This is defect, information-architecture, accessibility, and safe architecture repair. It is not feature expansion or localization implementation.

## 2. Approved P1 defects

- Viewer-minutes and Peak viewers do not produce a coherent page-wide change.
- the first Tab does not reliably enter a visible actionable control.
- desktop and mobile do not present one coherent task-first hierarchy.

Related accepted repair requirements include readable chart scale/units/date context, useful selected-day analysis, compact explicit degraded states, and safe retirement of redundant compatibility/hotfix layers where gates prove equivalence.

## 3. Preserved boundaries

- separate Twitch and Kick routes, APIs, D1 bindings, outputs, and claims;
- 7-day, 30-day, and supported custom periods;
- primary metrics `viewer_minutes` and `peak_viewers` only;
- selected day, comparison, calendar, ranking, archives, report, share, PNG, CSV, and JSON contracts;
- honest loading, real, partial, stale, empty, missing, demo, error, and in-progress distinctions;
- bounded non-provider-wide coverage language;
- loaded-payload reuse for task switching and outputs.

Not authorized:

- another metric or archive type;
- new History API, D1 schema, collector, cron, retention, or binding changes;
- exact sessions or cross-provider totals/rankings;
- login, alerts, cloud preferences, AI summaries, or localization runtime;
- silent output-schema changes.

## 4. Required execution sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       complete PR #427
P8B  work-public-browser-audit           complete PR #428
P9H0 work-history-ui-h0-baseline         active
P9H1 work-history-ui-h1-metric           exact next after P9H0
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 5. P9H0 — documentation alignment and exact baseline

The first batch must update roadmap, schedule, program plan, documentation index, this plan, repair specification, working note, contributor instructions, PR template, audit status, and policy verification before runtime repair.

Technical deliverables:

- reproduce all three P8B History P1 defects for both providers using deterministic fixtures and safe real-data evidence;
- trace metric state through URL, request/cache, chart, summary, selected day, comparison, ranking, archives, report, share, and exports;
- identify every module that owns or mutates History state/DOM;
- identify global `window.fetch` replacement, MutationObserver, compatibility, hotfix, usability, shell, overview, archives, and responsive layers;
- determine the authoritative controller and the safe retirement order;
- add failing permanent assertions before repair without leaving required CI permanently red;
- freeze 1440, 820, 390, and 360px baseline artifacts and required data states;
- record exact owner files, current gates, and missing assertions in the working note;
- avoid broad visual or product repair.

P9H0 exit:

- revised authorities are internally consistent;
- stale P8B-active wording fails policy verification;
- exact P1 reproduction and failing-gate baseline exists;
- controller/compatibility ownership is recorded;
- all non-intentionally-failing latest-head checks pass;
- no UI repair, Preview, API, D1, binding, collector, cron, retention, output, or localization change is mixed in.

## 6. P9H1 — metric execution

Changing Viewer-minutes or Peak viewers must update:

- URL and request/payload state;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- summary labels and values;
- selected-day primary fact;
- comparison and ranking meaning;
- supported archive values;
- Report & Export context and ViewLoom-authored generated text.

Checking only `aria-pressed`, selected styling, or button text is insufficient. Gates must prove rendered values/units and dependent context change.

## 7. P9H2 — chart interpretation and day interaction

- readable UTC date ticks and numeric scale;
- visible selected metric and unit;
- exact detail with compact formatting;
- pointer, keyboard, and touch day inspection;
- selected-day synchronization;
- complete/partial/in-progress/missing distinctions;
- non-color-only legend;
- accessible title/description;
- no chart-without-scale regression.

## 8. P9H3 — Overview hierarchy

- metric-aware high-value summary;
- useful selected-day analysis;
- coherent comparison, calendar, ranking, and coverage order;
- no duplicated/placeholder facts;
- compact explicit unavailable states;
- desktop/tablet/mobile task-first flow.

## 9. P9H4 — Archives and Report & Export

- repair Daily, Peaks, Battles, and publishing hierarchy;
- keep one task/subview visible at a time;
- preserve direct links, Back/Forward, and no-refetch switching;
- preserve current provider, period, metric, scope, source, state, limitation language, and output schemas;
- remove oversized sparse regions.

## 10. P9H5 — responsive and accessibility

Required widths:

```text
1440
820
390
360
```

Repair first keyboard entry, focus order/visibility, touch/keyboard day inspection, target sizes, wrapping, mobile density, reduced motion, contrast, forced colors, and overflow.

## 11. P9H6 — complete local candidate

Run all History and shared-web gates on the latest head. Verify metrics, periods, custom ranges, tasks, archives, selected day, comparison, calendar, rankings, report, share, PNG, CSV, JSON, provider separation, request reuse, all required states, and required viewports. Review screenshot artifacts.

## 12. P9H7 — hosted and production acceptance

- create one deliberate `preview-*` branch from the accepted P9H6 head;
- verify Pages Functions, bindings, real retained data, both metrics, responsive behavior, and outputs;
- merge only the accepted candidate;
- verify exact production SHA through `/deployment.json`;
- complete public Twitch/Kick acceptance;
- transfer permanent evidence and delete the working note.

## 13. Architecture acceptance

By P9H6:

- one explicit authoritative History controller/state owner is documented;
- new coordination does not use another global `window.fetch` replacement or document-wide MutationObserver as primary state management;
- redundant layers are removed where equivalent behavior is proven;
- any retained compatibility layer has a named owner, purpose, and removal condition;
- URL, Back/Forward, provider, request-count, output, and degraded-state contracts remain protected.

## 14. Stop rule

After each PR merge:

1. issue the full merge report;
2. update roadmap, schedule, program plan, this plan, and working note;
3. name the exact next branch;
4. stop;
5. wait for explicit continuation.