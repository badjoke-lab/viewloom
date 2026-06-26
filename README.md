# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data.

## Core roles

- Heatmap = Now
- Day Flow = Today / selected UTC day
- Battle Lines = Rivalry
- History = Trends across retained days
- Channel = One retained channel footprint
- Local Watchlist = Browser-local saved channel evidence

Twitch and Kick remain separate across routes, APIs, storage, D1 bindings, rankings, exports, and coverage claims. ViewLoom does not publish combined provider totals.

## Current state

```text
Phase 7 source reset                complete PR #426
Phase 8 public browser audit        complete PR #428
P9H0 History baseline               complete PR #430
P9H0 documentation closeout         complete PR #432
Active implementation branch        none
Exact next branch                   work-history-ui-h1-metric
P9H1 branch created                 no
```

P9H0 locked:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local keyboard run reached the ViewLoom home link. The P8B production body-focus observation remains a P9H5/final-acceptance discrepancy.

P9H1 repairs Viewer-minutes and Peak viewers across URL, request, control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports. It does not add a metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## Later program

```text
Phase 10 cross-site defect/UI/architecture repair
Phase 11 acceptance, CI, type safety, monitoring, maintenance
Phase 12 English legal, Support, Stripe, release readiness
Phase 13 English/Japanese localization
Phase 14 Spanish/pt-BR localization and staged launch
Phase 15 next-feature data-capability audit
Phase 16 not approved
```

Initial localization targets are `en`, `ja`, `es`, and `pt-BR`. UI localization is not stream-language analytics. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## Canonical documentation

Read in order:

- `docs/operations/development-and-deployment-policy.md`
- `docs/operations/development-policy-addendum.md`
- `docs/operations/documentation-governance.md`
- `docs/README.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/product/post-watchlist-program-plan.md`
- `docs/product/history-ui-repair-spec.md`
- `docs/product/history-ui-repair-plan.md`
- `docs/work-in-progress/history-ui-repair-working-note.md`

Future authorities:

- `docs/product/cross-site-quality-remediation-spec.md`
- `docs/product/cross-site-quality-remediation-plan.md`
- `docs/product/localization-spec.md`
- `docs/product/localization-implementation-plan.md`

Ordinary development uses `work-*`; deliberate Cloudflare candidate validation uses `preview-*`. Only latest-head evidence counts. After every merge, issue the full report and stop.

There is no active implementation branch. P9H1 starts only after explicit continuation.