# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed predecessor: P9H0 through PR #430
Completed closeout: PR #432
Completed final-state correction: PR #433
Current implementation branch: `work-history-ui-h1-metric`
Exact next branch after P9H1 merge and explicit continuation: `work-history-ui-h2-chart`
Accepted baseline specification: `../product/history-and-trends-spec.md`
Active repair specification: `../product/history-ui-repair-spec.md`
Program plan: `../product/post-watchlist-program-plan.md`
Implementation plan: `../product/history-ui-repair-plan.md`
P8B baseline: `../audits/public-browser-defects.json`
P9H0 findings: `../audits/history-ui-h0-findings.md`
P9H0 owner map: `../audits/history-ui-h0-owner-map.json`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

## 1. Approved P1 defects

```text
Metric switching does not update every metric-dependent surface.
Production and deterministic keyboard-entry evidence disagree.
Desktop/tablet/mobile do not present one coherent compact task-first analysis flow.
```

## 2. Completed predecessors

```text
P7A   PR #426  source-of-truth reset
P8A   PR #427  21-surface inventory
P8B   PR #428  all-public browser audit
P9H0  PR #430  deterministic History baseline and owner trace
C9H0  PR #432  documentation and program closeout
C9H0F PR #433  final canonical state correction
```

## 3. P9H0 evidence

```text
Final head: e3a1f64e7225a652de95a37ea755b192565d7798
Merge commit: 716b8e2fb59a6783a647cb62274c82a521c0e535
Workflow run: 28217951126
Artifact: history-ui-h0-baseline
Artifact ID: 7897373665
Digest: sha256:366d5aeeb896b62201cc842f79ba9426807ae81e997a3cc5d53360cfa43b104a
```

Deterministic failure set:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

Metric URL, request, selected control, chart caption, and chart accessible name change. Summary, Selected day, and Ranking context remain unchanged.

At 390px, the Kick fixture measured 15,058px in an 844px viewport, about 17.84 viewport heights, with seven major Overview sections.

The local first Tab moved to the ViewLoom home link at 820px and 360px. The earlier P8B production body-focus observation remains a production/local discrepancy for P9H5 and final production acceptance. Do not manufacture a local failure.

## 4. Current owners

```text
history-current-shell-entry.ts      URL, request, base Summary, chart, Selected day, ranking, Daily archive, coverage
history-usability-pass.ts           compatibility import order
history-view-shell.ts               task URL state, Back/Forward, section rehoming
history-overview.ts                 Overview augmentation and payload capture
history-report-text.ts              report, share, export rendering
history-report-text-state.ts        report payload and metric context
history-focus-fallback.css          focus presentation
history-visual-responsive.css       responsive layout
```

P9H1 begins from `history-ui-h0-owner-map.json` and `history-ui-h0-source-map.md`, not from chat memory.

## 5. P9H1 exact scope

P9H1 repairs Viewer-minutes and Peak viewers across:

- URL and provider request;
- selected control and accessible name;
- chart values, scale, ticks, unit, and description;
- Summary labels/values;
- Selected day primary fact;
- comparison and Ranking context;
- supported Archives;
- Report, Share, and Exports.

The three metric-context expected failures must become passing assertions. `history-mobile-task-flow-too-long` remains expected until P9H3/P9H5.

## 6. P9H1 preserved contracts

```text
Twitch/Kick separation
one response per uncached provider/period/metric state
task/archive switching without History refetch
Back/Forward and direct-link restoration
real/partial/stale/empty/missing/demo/error/in-progress honesty
report/share/PNG/CSV/JSON schemas
```

P9H1 must not add another global `window.fetch` wrapper or document-wide MutationObserver. Broad chart/task/layout work remains P9H2–P9H5.

## 7. Current sequence

```text
P9H0 complete PR #430
C9H0 work-p9h0-closeout                  complete PR #432
C9H0F work-p9h0-final-state              complete PR #433
P9H1 work-history-ui-h1-metric           active
P9H2 work-history-ui-h2-chart            exact next after P9H1 merge and explicit continuation
P9H3 work-history-ui-h3-overview         queued
P9H4 work-history-ui-h4-tasks            queued
P9H5 work-history-ui-h5-responsive       queued
P9H6 work-history-ui-h6-candidate        queued
P9H7 work-history-ui-h7-acceptance       queued
```

## 8. Fixed boundaries

No new metric, API, D1 schema, collector, binding, cron, retention, exact session, provider total/ranking, login, alert, AI summary, output schema, or localization runtime is allowed in Phase 9.

## 9. Working-note rule

Update this note when ownership changes, an expected failure is replaced, a compatibility layer is retired/retained, a permanent gate is added, the keyboard discrepancy changes, or the ordered sequence changes.

Complete P9H1 on the active branch, merge it, then stop before P9H2 until explicit continuation.