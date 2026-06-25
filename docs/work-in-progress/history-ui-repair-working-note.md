# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-25
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Current branch: `work-public-surface-inventory`
Current window: P8A — public surface inventory
Completed predecessor: P7A through PR #426
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation subplan: `../product/history-ui-repair-plan.md`
Active audit scope: `../audits/P8A_SCOPE.md`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved defect classification

The following are approved P1 defects and are not waiting for another product decision:

```text
Metric controls do not produce a sufficiently observable and trustworthy change.
The main chart does not expose a readable scale, ticks, units, or complete interaction cues.
The chart-side information is too thin to support analysis.
Lower-page regions are sparse, weakly prioritized, or unclear in purpose.
Desktop and mobile do not read as one coherent analysis product.
```

Additional reference screenshots may refine styling later. They are not required before functional, chart-interpretability, information-architecture, responsive, or accessibility repair begins.

## 2. P7A closure

PR #426 completed the source-of-truth reset:

- stale post-Watchlist root and canonical documents were corrected;
- History UI repair was approved as P1 work;
- the screenshot blocker was removed;
- permanent repair specification and implementation plan were added;
- this working note was established;
- policy verification was updated;
- P8A was named as the exact next branch.

No runtime History, API, D1, collector, cron, retention, binding, or output-schema change was included.

## 3. Current P8A repository package

Current branch:

```text
work-public-surface-inventory
```

Current audit files:

```text
docs/audits/P8A_SCOPE.md
docs/audits/README.md
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

P8A is inventory only. It must not repair UI, change APIs, alter D1, modify collectors, change retention, or deploy a Preview.

## 4. Required History inventory evidence

P8A must record for both Twitch and Kick History:

- public route and metadata;
- API path and supported query state;
- Overview, Archives, and Report & Export;
- Daily, Peaks, and Battles;
- period and metric controls;
- chart owner and accepted/rejected interaction evidence;
- selected-day owner;
- previous-period comparison;
- calendar heat;
- rankings;
- coverage;
- report, short post, share card, PNG, CSV, and JSON;
- existing contract, browser, Preview, and production gates;
- explicit missing browser/state coverage.

The inventory must distinguish repository presence from proven usability. A page, script, or old workflow existing does not prove the current public interaction is accepted.

## 5. Required P8B browser evidence

P8B must include:

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

P8B classifies exact defects and owners. It does not re-approve the known History P1 defects.

## 6. Questions P9H0 must answer

- Which module is authoritative for metric URL state?
- Does changing metric fetch a new payload, reuse a payload containing both metrics, or combine both behaviors?
- Which visible values change when metric changes?
- Which values remain mislabeled or stale?
- Which module renders chart scale and day columns?
- What accessible representation exists for chart values?
- Which sections are physically moved by the view shell and which remain duplicated or hidden?
- Which compatibility layers can be retired safely?
- Which workflows assert real metric differences, axes, units, selected-day synchronization, and touch behavior?
- Which sparse areas are caused by missing data, hidden task content, fixed min-height, or empty placeholders?

## 7. Fixed boundaries

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

## 8. Current sequence

```text
P7A  work-history-ui-repair-governance   complete PR #426
P8A  work-public-surface-inventory       active
P8B  work-public-browser-audit           exact next after P8A merge report
P9H0 work-history-ui-h0-baseline         queued
P9H1 work-history-ui-h1-metric           queued
P9H2 work-history-ui-h2-chart            queued
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 9. Repository-comparison checklist

Before each branch:

```text
[ ] predecessor PR merged
[ ] full merge report issued
[ ] explicit continuation exists
[ ] current branch matches current-schedule.md
[ ] roadmap, program plan, subplan, and working note agree
[ ] required files and workflows exist
[ ] missing deliverables are listed
[ ] scope boundaries remain valid
```

Before merge:

```text
[ ] latest-head CI passes
[ ] required evidence exists
[ ] provider separation passes
[ ] current documents show completed and next state
[ ] exact next branch is named
```

## 10. Working-note rule

Update this note whenever an audit or repair branch discovers or resolves a material defect, owner, visual hierarchy decision, acceptance requirement, or scope boundary.

Transfer stable decisions into permanent documentation and delete this note in P9H7.
