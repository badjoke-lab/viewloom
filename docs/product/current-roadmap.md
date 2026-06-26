# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## 1. Current priority

```text
Phase 7 P7A   complete PR #426
Phase 8 P8A   complete PR #427
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
Phase 9 P9H1  exact next after explicit continuation
```

Exact next branch:

```text
work-history-ui-h1-metric
```

P9H1 repairs the existing Viewer-minutes / Peak viewers execution contract across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, Archives, Report, Share, and Exports. It does not add a new metric, API, D1 schema, collector, binding, cron, retention policy, provider combination, or output schema.

## 2. Verified product state

- Local Watchlist v1 is accepted through PR #425.
- Source-of-truth reset is complete through PR #426.
- Public-surface inventory is complete through PR #427.
- Public browser audit is complete through PR #428.
- P9H0 deterministic History baseline is complete through PR #430.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

P8B result remains:

```text
P0 0
P1 3
P2 5
P3 0
```

P9H0 locked these deterministic acceptance failures:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local first-Tab scenarios moved focus to the ViewLoom home link. The earlier P8B production body-focus observation remains an explicit production/local discrepancy for P9H5 and final acceptance.

## 3. Phase 9 sequence

```text
P9H0 work-history-ui-h0-baseline   complete PR #430
P9H1 work-history-ui-h1-metric     exact next
P9H2 work-history-ui-h2-chart      queued
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## 4. Known History defects remain P1

- Viewer-minutes and Peak viewers do not update every metric-dependent surface.
- Production and deterministic keyboard-entry evidence do not yet agree.
- Desktop and mobile do not yet present one coherent task-first analysis flow.

The broader repair contract still requires readable scale, ticks, units, selected-day interaction, honest degraded states, responsive density, visible focus, and accessible descriptions.

## 5. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact active window and next branch:
  docs/product/current-schedule.md

Complete Phase 7–15 program:
  docs/product/post-watchlist-program-plan.md

History repair:
  docs/product/history-ui-repair-spec.md
  docs/product/history-ui-repair-plan.md
  docs/work-in-progress/history-ui-repair-working-note.md

P8B baseline:
  docs/audits/public-browser-defects.json
  docs/audits/public-browser-audit.md

P9H0 baseline:
  docs/audits/history-ui-h0-baseline.md
  docs/audits/history-ui-h0-owner-map.json
  docs/audits/history-ui-h0-source-map.md
  docs/audits/history-ui-h0-findings.md
```

## 6. Historical verifier snapshots

The exact strings below are retained only for completed P8A/P8B and Watchlist verifier compatibility. They are not current roadmap state.

```text
Local Watchlist v1 | W0–W5B complete through PR #425; P8A inventoried
P8A: complete through PR #427
Exact next branch: work-public-browser-audit
both Watchlist routes are missing from Public Readiness configuration
P8B: active
Current branch: work-public-browser-audit
Exact next branch: work-history-ui-h0-baseline
Phase 8   P8A inventory complete PR #427; P8B browser audit active
21 owned routes × 4 required viewports
```

## 7. Ordered program

```text
Phase 7   complete PR #426
Phase 8   complete PR #428
Phase 9   P9H0 complete; P9H1 exact next
Phase 10  queued
Phase 11  queued
Phase 12  queued
Phase 13  queued
Phase 14  queued
Phase 15  not approved
```

No Phase 15 feature is approved by this roadmap.

## 8. Work not approved before P9H1 authorization

- a new History metric or archive type;
- exact session reconstruction;
- category or language collection;
- cross-platform totals or rankings;
- login, cloud accounts, alerts, or AI interpretation;
- new D1 schema, collector, cron, retention, binding, or API route;
- output-schema changes.

After every merge, issue the full merge report, update canonical state, name the exact next branch, and stop until explicit continuation.
