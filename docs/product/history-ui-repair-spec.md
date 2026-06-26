# ViewLoom History UI repair specification

Status: approved active repair specification
Version: 1.1
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Accepted baseline specification: `history-and-trends-spec.md`
Completed baseline implementation: `history-layout-rebuild-plan.md`
Active implementation plan: `history-ui-repair-plan.md`

## 1. Purpose

This document defines the approved repair target for the public Twitch and Kick History experience. The 2026-06-23 production acceptance remains the retained-data baseline but does not override later verified public-quality defects.

## 2. Approved P1 defects

- Viewer-minutes and Peak viewers do not update every metric-dependent surface.
- production and deterministic keyboard-entry evidence do not agree.
- desktop, tablet, and mobile do not present one coherent task-first analysis flow.

The repair must also permanently protect chart scale/date/unit/detail, useful Selected day analysis, compact degraded states, and explicit controller/module ownership.

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
- separate D1 bindings remain unchanged;
- task switching never changes provider;
- copy, share, and download never fetch the other provider;
- honest loading, real, partial, stale, empty, missing, demo, error, and in-progress states remain visible.

## 4. Supported primary metrics

```text
viewer_minutes
peak_viewers
```

This repair does not authorize another primary metric. Supporting facts may use already supplied or safely derived values but do not become primary metric controls.

## 5. Metric execution contract

Changing the metric must update:

- URL state;
- request or loaded-payload selection;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- Summary labels and values;
- Selected day primary fact;
- previous-period comparison;
- Ranking context and default sort where relevant;
- supported Daily, Peak, and Battle archive values;
- Report, Share, and Export context.

A repair is not accepted when only styling, button text, or `aria-pressed` changes. Permanent gates must prove rendered metric meaning changes for fixtures where the metrics differ.

## 6. Chart contract

The main daily trend chart must expose readable UTC date ticks, numeric scale/ticks, selected metric and unit, meaningful baseline, compact values with exact detail, visible selected day, pointer/keyboard/touch inspection, honest complete/partial/in-progress/missing distinctions, non-color-only legend, and accessible title/description.

A chart without readable scale, unit, date context, or day detail fails acceptance.

## 7. Summary and Selected day

The top Summary uses supported high-value facts such as selected metric aggregate, valid daily average, period peak/day, top streamer, strongest supported rise, comparison, observed/requested days, missing/partial counts, and concise coverage state.

Metric-dependent labels and values change with the metric. Unavailable values are not invented as zero.

Selected day includes UTC date, selected metric value/unit, peak viewers, top streamer, observed streams/minutes, coverage state/warnings, and provider-safe Day Flow/Battle Lines actions when supported. It must not remain a large placeholder when a valid day exists.

## 8. Information architecture

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

Only one task and one archive subview are visible at a time.

Overview order:

1. provider, period, metric, state, and observed scope;
2. controls;
3. task navigation;
4. metric-aware Summary;
5. chart and Selected day;
6. compact comparison;
7. calendar;
8. rankings and supported changes;
9. concise coverage/methodology links.

Archives switching reuses loaded History data. Report & Export retains provider, period, metric, scope, source, state, and limitation language.

## 9. Degraded states

Large unexplained empty containers are not acceptable. Empty, partial, missing, stale, demo, in-progress, and error states use compact explicit panels that state what remains usable and the next useful action. Missing is never shown as observed zero. Demo is visibly distinct from real data.

## 10. URL and request behavior

Supported periods remain Last 7 days, Last 30 days, and supported custom range. URL state preserves provider, period, metric, valid dates, task, archive, selected day, sort, and limit where relevant.

Back/Forward and direct links restore supported state. Task/archive changes do not trigger another History request. Metric/period requests use one response per uncached provider/period/metric state and reuse page memory where supported. Per-day and per-streamer request loops are forbidden.

## 11. Responsive and accessibility contract

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
- chart scale, ticks, units, and Selected day remain readable;
- mobile is reorganized rather than merely scaled down;
- pointer, keyboard, and touch users can inspect days;
- period, metric, task, archive, and day selection are keyboard accessible;
- visible focus remains;
- general targets are at least 44px and important publishing/management targets at least 48px;
- long text/URLs wrap;
- reduced motion, increased contrast, and forced colors remain usable;
- state and selection do not rely on color alone.

The P8B production body-focus observation and P9H0 local first-link result remain a discrepancy until P9H5/final production acceptance resolves it.

## 12. Architecture ownership contract

The repair must move toward one documented authoritative controller/state owner for provider, period, metric, selected day, task, archive, sort, and limit, with explicit request/cache/render boundaries.

P9H0 owner evidence is in:

```text
docs/audits/history-ui-h0-owner-map.json
docs/audits/history-ui-h0-source-map.md
docs/audits/history-ui-h0-findings.md
```

Requirements:

- no new global `window.fetch` replacement for History coordination;
- no new document-wide `MutationObserver` as primary state management;
- redundant compatibility/hotfix layers retire where equivalence gates pass;
- retained legacy layers have purpose, owner, and removal condition;
- no broad rewrite weakens URL, Back/Forward, provider, request-count, output, or degraded-state contracts.

## 13. Localization boundary

Phase 9 does not implement localization. New ViewLoom-authored copy should remain grouped behind clear render/helper boundaries. Provider-origin names, IDs, titles, and categories remain separate. UTC, metric, unit, state, and limitation meaning stays explicit.

The future localization authority is `localization-spec.md`.

## 14. Non-goals

No new primary metric, archive type, API, D1 schema, collector, cron, retention, binding, exact session, category/stream-language trend, cross-provider comparison, account, alert, AI interpretation, report mode, or localization runtime is authorized.

## 15. Acceptance

The repair is accepted only when metric meaning changes across dependent surfaces; chart scale/date/unit/day detail is tested; Summary and Selected day are useful; task hierarchy follows the approved order; sparse areas are compact and explicit; all states remain honest; direct links and Back/Forward work; task/archive switching does not refetch; providers remain separate; all required widths/accessibility pass; controller/layer ownership is documented; redundant layers are safely retired or explicitly retained; all History/output/Status/Channel/build/policy/readiness regressions pass; deliberate Preview with real provider data passes; exact production identity and public acceptance pass; and the temporary working note is deleted.