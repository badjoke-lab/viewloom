# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data.

## Core roles

- Heatmap = Now
- Day Flow = Today / selected UTC day
- Battle Lines = Rivalry
- History = Trends across retained days
- Channel = One retained channel footprint
- Local Watchlist = Browser-local saved channel evidence

Twitch and Kick remain separated across routes, APIs, storage, D1 bindings, rankings, exports, and coverage claims. ViewLoom does not publish combined provider totals.

## Current execution state

```text
Phase 7  source-of-truth reset                       complete PR #426
Phase 8  public inventory and browser defect audit   complete PR #428
Phase 9  History P1 repair                            P9H0 complete PR #430
Closeout branch                                      work-p9h0-closeout
Exact next implementation branch                     work-history-ui-h1-metric
```

P9H1 has not been created.

P9H0 verified these deterministic failures:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

Metric URL, request, selected control, chart caption, and chart accessible name change, while Summary, Selected day, and Ranking context remain stale. The local keyboard run moved focus to the ViewLoom home link; the earlier P8B production body-focus observation remains a P9H5/final-acceptance discrepancy.

## Current priority

The repository is in documentation closeout after PR #430. The closeout aligns all source-of-truth documents, registers the Phase 10–11 quality program, and registers the Phase 13–14 localization program before P9H1 begins.

P9H1 is limited to Viewer-minutes / Peak viewers execution across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports. It does not add a metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## Approved later program

```text
Phase 10  reproduced cross-site defect/UI/architecture repair
Phase 11  all-public acceptance, CI, type safety, monitoring, maintenance
Phase 12  English legal, Support, Stripe, and release readiness
Phase 13  localization foundation plus English/Japanese
Phase 14  Spanish/pt-BR localization and staged launch
Phase 15  next-feature data-capability audit
Phase 16  at most one separately approved major feature
```

No Phase 16 feature is approved.

UI localization is distinct from stream-language collection. Initial approved locales are `en`, `ja`, `es`, and `pt-BR`. Existing English URLs remain canonical; non-English routes use locale prefixes. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## Canonical documentation

Read in order:

- `docs/operations/development-and-deployment-policy.md`
- `docs/operations/development-policy-addendum.md`
- `docs/operations/documentation-governance.md`
- `docs/README.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/product/post-watchlist-program-plan.md`

Active History authorities:

- `docs/product/history-and-trends-spec.md`
- `docs/product/history-ui-repair-spec.md`
- `docs/product/history-ui-repair-plan.md`
- `docs/work-in-progress/history-ui-repair-working-note.md`

Approved future authorities:

- `docs/product/cross-site-quality-remediation-spec.md`
- `docs/product/cross-site-quality-remediation-plan.md`
- `docs/product/localization-spec.md`
- `docs/product/localization-implementation-plan.md`

Implementation does not begin from chat memory, an old PR, or screenshots alone. Every branch rereads the current authorities and confirms the scheduled branch before changing code.

## Development operations

- normal work uses `work-*` branches;
- `preview-*` is reserved for deliberate Cloudflare runtime validation of a completed candidate;
- only latest-head evidence counts;
- merge status is not production status;
- provider separation and bounded coverage are mandatory;
- after each merge, issue the full merge report and stop before creating the next branch.

## Repository structure

- `docs/` — product, program, operations, audit, and temporary documents
- `apps/web/` — public pages, shared UI, Functions, and browser/contract checks
- `workers/` — provider collectors and retention operations
- `packages/` — shared contracts and helpers

After the closeout PR merges, stop before creating `work-history-ui-h1-metric` until explicit continuation.