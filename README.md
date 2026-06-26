# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data.

## Core roles

- Heatmap = Now
- Day Flow = Today / selected UTC day
- Battle Lines = Rivalry
- History = Trends across retained days
- Channel = One retained channel footprint
- Local Watchlist = Browser-local saved channel evidence

Twitch and Kick remain separated across routes, APIs, storage, D1 bindings, rankings, exports, locales, and coverage claims. ViewLoom does not publish combined provider totals.

## Current execution state

```text
Phase 7 source reset                complete PR #426
Phase 8 public audit                complete PR #428
Phase 9 P9H0 baseline               complete PR #430
P9H0 documentation closeout         complete PR #432
Active implementation branch        none
Exact next implementation branch    work-history-ui-h1-metric
P9H1 branch created                 no
```

P9H0 verified:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local keyboard run reached the ViewLoom home link. The P8B production body-focus observation remains a P9H5/final-acceptance discrepancy.

## Current priority

P9H1 will repair Viewer-minutes and Peak viewers across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports. It will not add a metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## Approved later program

```text
Phase 10  cross-site defect/UI/architecture repair
Phase 11  all-public acceptance, CI, type safety, monitoring, maintenance
Phase 12  English legal, Support, Stripe, release readiness
Phase 13  English/Japanese localization
Phase 14  Spanish/pt-BR localization and staged launch
Phase 15  next-feature data-capability audit
Phase 16  separately approved feature only
```

No Phase 16 feature is approved. UI localization is distinct from stream-language analytics. Initial locales are `en`, `ja`, `es`, and `pt-BR`. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## Canonical documentation

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
- `docs/product/cross-site-quality-remediation-spec.md`
- `docs/product/cross-site-quality-remediation-plan.md`
- `docs/product/localization-spec.md`
- `docs/product/localization-implementation-plan.md`

Every branch rereads current authorities and compares them with actual repository state before changing code.

## Development operations

- ordinary development uses `work-*`;
- deliberate Cloudflare candidate validation uses `preview-*`;
- only latest-head evidence counts;
- merge status is not production status;
- provider separation and bounded coverage are mandatory;
- after each merge, issue the full report and stop before creating the next branch.

There is no active implementation branch. P9H1 resumes only after explicit continuation.