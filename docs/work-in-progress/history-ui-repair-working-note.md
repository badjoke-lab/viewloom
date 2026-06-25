# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 7–9 — source reset, public audit, and P0/P1 repair
Completed predecessor: P8A through PR #427
Current window: P8B — public browser defect audit
Current branch: `work-public-browser-audit`
Exact next branch after P8B: `work-history-ui-h0-baseline`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation subplan: `../product/history-ui-repair-plan.md`
P8A inventory: `../audits/public-surface-inventory.json`
P8B scope: `../audits/P8B_SCOPE.md`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved P1 defects

```text
Metric controls do not produce a sufficiently observable and trustworthy change.
The chart does not yet permanently prove scale, ticks, units, and complete interaction cues.
Selected-day and supporting information are too thin or disconnected.
Lower-page regions are sparse, weakly prioritized, duplicated, or unclear.
Desktop, tablet, and mobile do not prove one coherent analysis product.
```

These defects do not require another approval gate or additional screenshots before reproduction and repair.

## 2. Completed predecessors

### P7A — PR #426

- corrected stale source-of-truth documents;
- approved History repair as P1 work;
- added repair specification, plan, and this note;
- removed the screenshot blocker.

### P8A — PR #427

- inventoried 21 repository-owned public surfaces;
- recorded route owners, controls, states, gates, and provider bindings;
- recorded separate History routes and APIs;
- recorded existing browser, Preview, and production evidence;
- recorded missing policy/disclosure routes and acceptance gaps;
- made no runtime repair.

## 3. Active P8B package

```text
docs/audits/P8B_SCOPE.md
apps/web/scripts/public-browser-audit.mjs
.github/workflows/public-browser-audit.yml
scripts/verify-public-browser-audit.mjs
```

Required completion records:

```text
docs/audits/public-browser-defects.json
docs/audits/public-browser-audit.md
GitHub Actions artifact: public-browser-audit-p8b
```

P8B audits all 21 owned routes at 1440, 820, 390, and 360px, probes five missing surfaces, and generates deterministic History state/interaction evidence.

## 4. Static History ownership findings

```text
/twitch/history/ -> /api/history -> DB_TWITCH_HOT
/kick/history/   -> /api/kick-history -> DB_KICK_HOT
```

Key owners:

```text
apps/web/src/live/history-current-shell-entry.ts
apps/web/src/live/history-usability-pass.ts
apps/web/src/live/history-view-shell.ts
apps/web/src/live/history-overview.ts
History archive, comparison, report, share, and export modules
```

Current source observations to verify in browser:

- metric controls update URL, request metric, selected control, and ranking sort;
- `renderSummary()` currently emits Viewer-minutes labels and values regardless of selected primary metric;
- selected-day rendering shows both metrics rather than one selected-metric interpretation;
- chart source includes numeric Y labels, date labels, day controls, and an aria label, but browser evidence must prove readability and complete interaction;
- task and archive shell uses pushState/popstate and should preserve provider/data without refetch;
- broad legacy workflows do not prove current public usability.

These observations are hypotheses until the P8B artifact confirms exact behavior.

## 5. P8B required History evidence

```text
Twitch real Overview at 1440
Kick real Overview at 390
partial at 820
stale at 360
empty
missing
demo
in progress
API error
loading
Viewer-minutes before and after
Peak viewers before and after
Overview / Archives / Report & Export
Daily / Peaks / Battles
Back / Forward
task switching without refetch
```

For each P0/P1 record:

- route and provider;
- viewport and data state;
- exact reproduction;
- owner module and affected file;
- current workflow coverage;
- missing assertion;
- ordered repair destination.

## 6. Cross-site findings under audit

- both Watchlist routes are absent from Public Readiness configuration;
- About, Support, Changelog, Channel, and Watchlist are absent from general Production Smoke routes;
- no single permanent browser matrix covers all owned routes and required widths/states;
- Contact, Terms, Privacy, Refund Policy, and Commercial Disclosure routes are absent;
- provider separation and bounded-coverage wording must remain exact;
- keyboard focus, target sizes, long text, reduced motion, and overflow require cross-site evidence.

These inventory findings are not automatically P0/P1. P8B classifies them from evidence.

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
P8B performs no product repair unless a P0 requires isolation.
```

## 8. Current sequence

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

## 9. Questions P9H0 must answer

- Which module owns final metric URL and request state?
- Which metric-dependent values remain mislabeled or stale?
- Which modules own summary, chart, selected day, comparison, ranking, archives, report, share, and exports?
- Which compatibility layers duplicate or move sections?
- Which permanent workflows fail to reject the exact P8B P1 defects?
- Which sparse regions come from missing data, hidden task content, fixed height, or placeholders?

## 10. Repository comparison checklist

Before merge:

```text
[ ] latest-head CI passes
[ ] 84 owned-route browser scenarios exist
[ ] five missing-surface probes exist
[ ] ten History scenarios exist
[ ] every P0/P1 has exact ownership and missing-gate evidence
[ ] provider separation passes
[ ] defect ledger and human report are committed
[ ] canonical documents show P8B complete and P9H0 next
[ ] no product repair is mixed into P8B
```

## 11. Working-note rule

Update this note when P8B evidence confirms or rejects a source hypothesis, changes defect classification, identifies an owner, or changes the ordered repair queue.

Transfer stable decisions to permanent documentation and delete this note in P9H7.
