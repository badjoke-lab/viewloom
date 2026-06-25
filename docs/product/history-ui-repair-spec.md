# ViewLoom History UI repair specification

Status: approved active repair specification
Version: 1.0
Created: 2026-06-25
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Accepted baseline specification: `history-and-trends-spec.md`
Completed baseline implementation: `history-layout-rebuild-plan.md`
Active implementation plan: `history-ui-repair-plan.md`

## 1. Authority and purpose

This document defines the approved repair target for the public Twitch and Kick History experience.

The 2026-06-23 History production acceptance remains the baseline record for existing retained-data behavior. It does not override subsequently verified public-quality defects. This repair specification has authority for the active History UI repair milestone while preserving the baseline data and provider contracts.

The repair turns the current History surface into an understandable analysis product. It is not a request for cosmetic polish alone.

## 2. Approved P1 defects

The following are approved defects:

1. Viewer-minutes and Peak viewers controls do not produce a sufficiently observable, trustworthy change across the page.
2. The main chart lacks the readable numeric scale, date ticks, metric unit, and interaction cues needed to interpret it.
3. The chart-side summary or selected-day area is too thin, placeholder-like, or disconnected from the chart.
4. Lower-page regions are sparse, weakly prioritized, duplicated, or unclear in purpose.
5. Desktop, tablet, and mobile do not yet present one coherent task-oriented analysis flow.

These defects may be reproduced and repaired without additional reference screenshots. Additional reference screenshots may refine styling later but are not an entry criterion for this milestone.

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

The primary metric controls remain:

```text
viewer_minutes
peak_viewers
```

This repair does not authorize another primary metric.

Average viewers, observed streams, and observed minutes may appear as supporting facts when already supplied or safely derived under the existing response contract. They do not become additional primary metric buttons.

## 5. Metric switching contract

Changing the selected metric must update every metric-dependent surface consistently.

Required dependent surfaces:

- URL state;
- API query or loaded-payload selection, according to the existing architecture;
- selected button state and accessible name;
- chart values;
- chart scale, ticks, unit, and accessible description;
- period summary labels and values;
- selected-day metric fact;
- previous-period comparison;
- Top streamers ranking meaning and default sort where relevant;
- metric values in Daily, Peak, or Battle archive surfaces where the selected metric is supported;
- Report & Export context and generated text.

A repair is not accepted when only the button appearance or `aria-pressed` state changes.

Permanent browser gates must prove that, for a fixture or real response where the metrics differ, at least the chart values or unit and the dependent summary context change.

## 6. Chart contract

The main daily trend chart is the dominant Overview visual.

It must expose:

- a readable X-axis with UTC date ticks;
- a readable Y-axis or equivalent numeric scale;
- numeric tick labels;
- the selected metric name;
- the selected metric unit;
- compact formatting for large values with exact values available in detail text or tooltip;
- a meaningful baseline;
- a visible selected day;
- pointer-accessible day detail;
- keyboard-accessible day detail and selection;
- touch-accessible day detail and selection;
- visible complete, partial, in-progress, and missing distinctions;
- a data-quality legend that does not rely on color alone;
- an accessible chart title, description, or equivalent structured text.

A chart containing bars or lines without a readable scale, unit, date context, or day detail fails acceptance.

## 7. Period summary contract

The summary near the top must use high-value period facts rather than repeated labels or placeholders.

Supported facts may include:

- selected metric total or period aggregate;
- daily average for the selected metric where valid;
- period peak value;
- peak day;
- top streamer;
- strongest supported rise;
- previous-period change when comparable;
- observed days / requested days;
- partial and missing day counts;
- concise coverage state.

Labels and values must change with the selected metric where the fact is metric-dependent. Unavailable values are not rendered as invented zeroes.

## 8. Selected-day analysis contract

The selected-day area must be a useful interpretation of the chart selection.

When supported, it includes:

- UTC date;
- selected metric value and unit;
- peak viewers;
- top streamer;
- observed stream count;
- observed minutes;
- coverage state;
- in-progress, partial, or missing warning;
- provider-safe Open Day Flow and Open Battle Lines actions.

The panel must not remain a large placeholder when a valid day is selected.

Desktop may place this panel beside the chart. Tablet and mobile place it after the chart in reading order.

## 9. Information architecture

The fixed top-level tasks remain:

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

### 9.1 Overview order

1. provider, period, metric, state, and observed scope;
2. period and metric controls;
3. top-level task navigation;
4. metric-aware summary;
5. chart and selected-day analysis;
6. compact previous-period comparison;
7. calendar heat;
8. Top streamers and supported changes;
9. concise coverage explanation and methodology/status links.

### 9.2 Archives

Daily, Peaks, and Battles remain distinct bounded exploration tasks. Archive switching reuses the loaded History response and does not trigger an unnecessary provider request.

### 9.3 Report & Export

Report & Export remains one secondary workspace with Full report, Short post, Copy, share-card preview, PNG, CSV, and JSON actions. It must visibly retain the current provider, period, metric, selected scope, source, state, and limitation language.

## 10. Sparse, empty, partial, and error states

A large empty container with no clear task or explanation is not acceptable.

When content is unavailable:

- use a compact state panel;
- identify whether the state is empty, partial, missing, stale, demo, or error;
- state what evidence is still usable;
- provide the next useful action when one exists;
- do not reserve excessive blank height for unavailable content.

Partial and missing are not equivalent. Missing is never shown as observed zero. Demo is visibly distinct from real data.

## 11. Period, URL, and request behavior

Supported periods remain:

```text
Last 7 days
Last 30 days
supported custom range
```

URL state preserves provider, period, metric, valid custom dates, task, archive, selected day, sort, and limit when relevant.

Back and Forward restore the intended History state. Direct links restore the intended task and archive.

Task and archive changes do not trigger another History request. Metric and period request behavior must follow one response per uncached provider/period/metric state and reuse page-memory state where supported. No per-day or per-streamer request loop is allowed.

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
- controls wrap in semantic order;
- chart scale, ticks, units, and selected day remain readable;
- the PC layout is not merely scaled down;
- touch users can inspect days without hover-only behavior;
- keyboard users can change period, metric, task, archive, and selected day;
- visible focus is retained;
- general touch targets are at least 44px;
- important mobile management and publishing targets are at least 48px;
- long text and URLs wrap inside their surfaces;
- reduced-motion preference is respected;
- increased-contrast and forced-color modes remain usable;
- state, selection, and comparison do not rely on color alone.

## 13. Visual hierarchy

Priority:

1. provider, period, metric, state, and observed scope;
2. metric-aware period summary;
3. main chart;
4. selected-day analysis;
5. comparison, calendar, and rankings;
6. archive exploration;
7. report/export;
8. detailed methodology.

Twitch uses disciplined purple accents and Kick uses disciplined green accents. Provider accent does not fill every surface. Partial uses amber semantics, error uses red semantics, and missing uses neutral/non-color distinctions where practical.

## 14. Non-goals and forbidden expansion

This repair does not add:

- new primary metrics;
- new archive types;
- a new History API;
- D1 schema changes;
- collector, cron, retention, or binding changes;
- exact sessions;
- category or language trends;
- cross-platform comparison;
- login or cloud-saved preferences;
- alerts;
- AI interpretation;
- additional report modes;
- density-increasing sections without a defined user task.

## 15. Acceptance contract

The repair is accepted only when:

- both metric controls change rendered metric meaning, not only selected styling;
- chart scale, date ticks, metric name, unit, and day details are present and tested;
- summary and selected-day analysis show supported useful facts;
- Overview follows the approved order;
- Archives and Report & Export are separate complete tasks;
- sparse areas have a defined task or compact explicit state;
- real, partial, stale, empty, missing, demo, and error states remain honest;
- direct links and Back/Forward restore supported state;
- task and archive switching do not refetch History;
- Twitch and Kick remain separated;
- 1440, 820, 390, and 360px browser gates pass;
- keyboard, focus, touch, reduced-motion, contrast, wrapping, and overflow gates pass;
- History shell, Overview, Archives, Peak, Battle, comparison, report, share, export, Status, Channel, build, policy, naming, and readiness regressions pass;
- deliberate Preview validation passes with real provider data and correct bindings;
- exact production deployment identity and public Twitch/Kick acceptance pass;
- permanent evidence is recorded and the temporary working note is deleted.
