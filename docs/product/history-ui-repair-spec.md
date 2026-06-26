# ViewLoom History UI repair specification

Status: approved active repair specification
Version: 1.1
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Accepted baseline specification: `history-and-trends-spec.md`
Completed baseline implementation: `history-layout-rebuild-plan.md`
Active implementation plan: `history-ui-repair-plan.md`

## 1. Authority and purpose

This document defines the approved repair target for the public Twitch and Kick History experience.

The 2026-06-23 History production acceptance remains the baseline record for retained-data behavior. It does not override subsequently verified public-quality defects. This repair turns the current History surface into an understandable, accessible, maintainable analysis product. It is not cosmetic polish alone.

## 2. Approved P1 defects

1. Viewer-minutes and Peak viewers controls do not produce a sufficiently observable, trustworthy page-wide change.
2. The first keyboard Tab does not reliably enter a visible actionable control.
3. Desktop, tablet, and mobile do not present one coherent task-oriented analysis flow.

The repair must also permanently protect readable chart scale/date/unit/detail, useful selected-day interpretation, compact explicit unavailable states, and safe controller/module ownership.

## 3. Provider and data invariants

History remains provider-specific:

```text
/twitch/history/
/kick/history/
```

Mandatory invariants:

- no combined Twitch/Kick totals or rankings;
- no cross-provider API or D1 query;
- provider-specific labels, accents, links, filenames, report text, and exports;
- bounded observation is never described as provider-wide coverage;
- existing separate D1 bindings remain unchanged;
- existing data-state honesty remains visible;
- task switching never changes provider;
- copy, share, and download never fetch the other provider.

## 4. Supported primary metrics

```text
viewer_minutes
peak_viewers
```

This repair does not authorize another primary metric.

Average viewers, observed streams, and observed minutes may appear as supporting facts when already supplied or safely derived under the existing response contract. They do not become additional primary metric controls.

## 5. Metric execution contract

Changing the selected metric must update every metric-dependent surface consistently:

- URL state;
- API query or loaded-payload selection under the accepted request architecture;
- selected control and accessible name;
- chart values, scale, ticks, unit, and accessible description;
- period summary labels and values;
- selected-day primary metric fact;
- previous-period comparison;
- Top streamers ranking meaning and default sort where relevant;
- supported Daily, Peak, and Battle archive values;
- Report & Export context and ViewLoom-authored generated text.

A repair is not accepted when only selected styling, button text, or `aria-pressed` changes. Permanent gates must prove rendered metric meaning changes for fixtures where the two metrics differ.

## 6. Chart contract

The main daily trend chart is the dominant Overview visual. It must expose:

- readable UTC date ticks;
- readable numeric scale and tick labels;
- selected metric name and unit;
- meaningful baseline;
- compact large-number formatting with exact detail;
- visible selected day;
- pointer, keyboard, and touch day detail/selection;
- complete, partial, in-progress, and missing distinctions;
- non-color-only data-quality legend;
- accessible title and description.

A chart containing bars or lines without a readable scale, unit, date context, or day detail fails acceptance.

## 7. Period summary contract

The top summary uses high-value supported facts, such as:

- selected metric total/aggregate;
- valid daily average;
- period peak value and day;
- top streamer;
- strongest supported rise;
- previous-period change when comparable;
- observed/requested days;
- partial/missing day counts;
- concise coverage state.

Metric-dependent labels and values change with the selected metric. Unavailable values are not rendered as invented zeroes.

## 8. Selected-day contract

The selected-day area must interpret the chart selection. When supported, it includes:

- UTC date;
- selected metric value and unit;
- peak viewers;
- top streamer;
- observed stream count and minutes;
- coverage state and partial/in-progress/missing warning;
- provider-safe Day Flow and Battle Lines actions.

Desktop may place it beside the chart. Tablet/mobile place it immediately after the chart in reading order. It must not remain a large placeholder when a valid day exists.

## 9. Information architecture

Top-level tasks remain:

```text
Overview
Archives
Report & Export
```

Archives remains:

```text
Daily
Peaks
Battles
```

Only one top-level task and one archive subview are visible at a time.

Overview order:

1. provider, period, metric, state, and observed scope;
2. period/metric controls;
3. task navigation;
4. metric-aware summary;
5. chart and selected-day analysis;
6. compact previous-period comparison;
7. calendar heat;
8. Top streamers and supported changes;
9. concise coverage/methodology/status links.

Archives switching reuses the loaded History response. Report & Export retains provider, period, metric, selected scope, source, state, and limitation language.

## 10. Sparse and degraded states

A large empty container with no clear task or explanation is not acceptable.

For unavailable content:

- use a compact explicit state panel;
- identify empty, partial, missing, stale, demo, in-progress, or error;
- state what evidence remains usable;
- offer the next useful action when one exists;
- do not reserve excessive blank height.

Missing is never shown as observed zero. Demo is visibly distinct from real data.

## 11. URL and request behavior

Supported periods remain Last 7 days, Last 30 days, and supported custom range.

URL state preserves provider, period, metric, valid custom dates, task, archive, selected day, sort, and limit where relevant.

Back/Forward and direct links restore supported state. Task/archive changes do not trigger another History request. Metric/period requests follow one response per uncached provider/period/metric state and reuse page-memory state where supported. No per-day or per-streamer request loop is allowed.

## 12. Responsive and accessibility contract

Required widths:

```text
1440px
820px
390px
360px
```

Requirements:

- no page-level horizontal overflow;
- first keyboard entry reaches a visible actionable control;
- controls wrap in semantic order;
- chart scale, ticks, units, and selected day remain readable;
- mobile is reorganized rather than merely scaled down;
- pointer, keyboard, and touch users can inspect days;
- period, metric, task, archive, and day selection are keyboard accessible;
- visible focus is retained;
- general touch targets are at least 44px;
- important management/publishing targets are at least 48px;
- long text/URLs wrap;
- reduced motion, increased contrast, and forced colors remain usable;
- state and selection do not rely on color alone.

## 13. Architecture ownership contract

The accepted repair must make History ownership explicit.

Requirements:

- one documented authoritative controller/state owner for provider, period, metric, selected day, task, archive, sort, and limit;
- explicit request/cache and render boundaries;
- an inventory of all active shell, overview, usability, compatibility, hotfix, archive, report, responsive, focus, and output layers;
- no new global `window.fetch` replacement used for feature coordination;
- no new document-wide `MutationObserver` used as primary History state management;
- redundant compatibility/hotfix layers are retired where browser and contract gates prove equivalence;
- any retained legacy layer has a named purpose, owner, and removal condition;
- no broad rewrite may weaken URL, Back/Forward, provider, request-count, output, or degraded-state contracts.

P9H0 records ownership and failing gates. P9H1–P9H5 perform bounded repair. P9H6 proves the final architecture and behavior together.

## 14. Localization boundary

Phase 9 does not implement localization. It must avoid making later localization harder:

- new ViewLoom-authored strings should be grouped behind clear rendering/helper boundaries rather than scattered across unrelated patches;
- provider-origin names, IDs, titles, and categories remain separate from UI copy;
- UTC, metric, unit, state, and limitation meaning stays explicit;
- no locale routing, catalog, automatic translation, or stream-language analytics is added.

The later authoritative localization contract is `localization-spec.md`.

## 15. Visual hierarchy

Priority:

1. provider, period, metric, state, and observed scope;
2. metric-aware period summary;
3. main chart;
4. selected-day analysis;
5. comparison, calendar, and rankings;
6. archive exploration;
7. report/export;
8. detailed methodology.

Twitch uses disciplined purple accents and Kick disciplined green accents. Partial uses amber semantics, error red semantics, and missing neutral/non-color distinctions where practical.

## 16. Non-goals

This repair does not add:

- new primary metrics or archive types;
- a new History API, D1 schema, collector, cron, retention, or binding;
- exact sessions;
- category or stream-language trends;
- cross-platform comparison;
- login/cloud preferences, alerts, or AI interpretation;
- additional report modes;
- localization runtime;
- density-increasing sections without a defined task.

## 17. Acceptance contract

The repair is accepted only when:

- both metrics change rendered meaning, not only styling;
- chart scale, date ticks, metric, unit, and day details are present/tested;
- summary and selected day show useful supported facts;
- Overview follows the approved order;
- Archives and Report & Export are complete separate tasks;
- sparse areas have a defined task or compact state;
- real, partial, stale, empty, missing, demo, in-progress, and error states remain honest;
- direct links and Back/Forward restore state;
- task/archive switching does not refetch;
- Twitch and Kick remain separated;
- 1440/820/390/360 browser gates pass;
- keyboard entry, focus, touch, motion, contrast, wrapping, targets, and overflow pass;
- authoritative controller/layer ownership is documented and redundant layers are safely retired or explicitly retained;
- History, output, Status, Channel, build, policy, naming, readiness, and provider regressions pass;
- deliberate Preview with real provider data and exact production acceptance pass;
- permanent evidence is recorded and the temporary working note is deleted.