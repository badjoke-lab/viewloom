# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-25
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Current branch: `work-history-ui-repair-governance`
Current window: P7A — source-of-truth reset and repair-program lock
Permanent specification: `../product/history-and-trends-spec.md`
Implementation plan: `../product/history-ui-repair-plan.md`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved defect classification

The following are approved P1 defects and are not waiting for another product decision:

```text
Metric controls do not produce a sufficiently observable and trustworthy change.
The main chart does not expose a readable scale, ticks, units, or complete interaction cues.
The chart-side information is too thin to support analysis.
Lower-page regions are sparse, weakly prioritized, or unclear in purpose.
The desktop and mobile information flow does not yet read as one coherent analysis product.
```

Additional reference screenshots may refine styling later. They are not required before functional, chart-interpretability, information-architecture, responsive, or accessibility repair begins.

## 2. Current repository findings

Canonical documents before P7A still contained stale or conflicting statements:

- the root README described the old History rebuild and Channel as future work;
- the current schedule still described merged PR #425 as a completion candidate;
- roadmap and schedule said History repair remained blocked on screenshots and detailed instructions;
- the History specification described the desired chart-first product but did not explicitly reject control-only metric switching or a chart without visible scale and units;
- the completed H1–H7 implementation record correctly allowed verified defect repair but did not point to an active repair milestone.

P7A must resolve all of these conflicts before runtime changes begin.

## 3. Current public implementation observations

The current Twitch History HTML exposes:

```text
Viewer-minutes button
Peak viewers button
Daily trend card
coverage legend
Selected day aside
summary cards
Top streamers
Daily archive
coverage detail
```

The page also loads several compatibility and enhancement layers in sequence. P9H0 must trace the actual owner of period state, metric state, API query, chart rendering, summary rendering, selected-day rendering, archives, and outputs before changing implementation.

Do not assume that a passing old acceptance workflow proves current public usability. Existing gates must be inspected for whether they verify visible values, axes, units, and interaction behavior rather than only DOM presence or selected-state attributes.

## 4. Required Phase 8 evidence

P8A route inventory must record, for Twitch and Kick History:

- public route and metadata;
- API path and supported query state;
- task views and archive subviews;
- period and metric controls;
- chart ownership;
- selected-day ownership;
- previous-period comparison;
- calendar heat;
- rankings;
- coverage;
- report, share, CSV, and JSON;
- existing contract, browser, Preview, and production gates.

P8B browser evidence must include:

```text
1440px Twitch Overview
1440px Kick Overview
820px task and control wrapping
390px Overview and selected-day flow
360px narrow control and chart behavior
Viewer-minutes before/after state
Peak viewers before/after state
partial data
empty data
stale data
API error
Archives Daily / Peaks / Battles
Report & Export
Back / Forward and direct links
```

## 5. Questions P9H0 must answer

- Which module is authoritative for metric URL state?
- Does changing metric fetch a new payload, reuse a payload containing both metrics, or combine both behaviors?
- Which visible values currently change when metric changes?
- Which values remain mislabeled or stale?
- Which module renders the chart scale and day columns?
- What accessible representation exists for chart values?
- Which sections are physically moved by the view shell and which remain duplicated or hidden?
- Which old CSS/compatibility layers can be retired safely?
- Which current workflows assert real metric differences, axes, units, selected-day synchronization, and touch behavior?
- Which sparse areas are caused by missing data, hidden task content, fixed min-height, or empty placeholders?

## 6. Fixed boundaries

```text
Providers remain separate.
Primary metrics remain Viewer-minutes and Peak viewers.
No new D1 schema.
No collector, cron, retention, or binding change.
No new History API route.
No exact sessions.
No cross-platform total or ranking.
No login, cloud preference, alert, or AI summary.
No silent output-schema change.
```

## 7. Current sequence

```text
P7A  work-history-ui-repair-governance   active
P8A  work-public-surface-inventory       next after P7A merge report
P8B  work-public-browser-audit           queued
P9H0 work-history-ui-h0-baseline         queued
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 8. Working-note rule

Update this note whenever a branch discovers or resolves a material defect, ownership decision, visual hierarchy decision, acceptance requirement, or scope boundary. Transfer stable decisions into permanent documentation and delete this note in P9H7.
