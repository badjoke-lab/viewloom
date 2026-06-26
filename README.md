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
Final-state correction              complete PR #433
P9H1 metric synchronization         complete PR #434
Active implementation branch        none
Exact next branch                   work-history-ui-h2-chart
P9H2 branch created                 no
```

P9H1 converted these deterministic metric-context failures to passing acceptance:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-selected-day-context-stale
```

`history-mobile-task-flow-too-long` remains for P9H3/P9H5. The P8B production/local keyboard discrepancy remains for P9H5 and final acceptance.

P9H1 synchronizes Viewer-minutes and Peak viewers across URL, request, control, chart, Summary, Selected day, comparison, Ranking context, supported Archives, Report, Share, and Exports. It also excludes missing daily rows from report metric-day selection. No metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema was added.

Latest accepted P9H1 evidence:

```text
Head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
Merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
```

## Later program

```text
P9H2 chart interpretation
P9H3 Overview hierarchy
P9H4 Archives and Report & Export
P9H5 responsive and accessibility
P9H6 local candidate
P9H7 production acceptance
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

P9H1 is complete through PR #434. Do not create `work-history-ui-h2-chart` until explicit continuation.