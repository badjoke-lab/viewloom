# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 1.5
Last updated: 2026-06-26
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed closeout: PR #432
Current implementation branch: none
Exact next branch: `work-history-ui-h1-metric`
Permanent specification: `history-and-trends-spec.md`
Active repair specification: `history-ui-repair-spec.md`
Program authority: `post-watchlist-program-plan.md`
Active working note: `../work-in-progress/history-ui-repair-working-note.md`
P9H0 evidence: `../audits/history-ui-h0-findings.md`

## Objective

Repair the Twitch and Kick History experience so existing retained-data capabilities are understandable, metric controls update all dependent surfaces, desktop/mobile tasks are coherent, accessibility is reliable, and controller ownership is maintainable.

This is defect and architecture repair, not feature expansion or localization implementation.

## Preserved boundaries

- Twitch and Kick remain separate.
- Primary metrics remain `viewer_minutes` and `peak_viewers`.
- Existing periods, selected day, comparison, calendar, rankings, Archives, Report, Share, PNG, CSV, and JSON contracts remain.
- Honest loading, real, partial, stale, empty, missing, demo, error, and in-progress states remain.
- Task switching reuses loaded data.
- No new API, D1 schema, collector, cron, retention, binding, provider total, exact session, account, alert, AI summary, output schema, or localization runtime is authorized.

## P9H0 evidence

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local first-Tab run reached the ViewLoom home link. The P8B production body-focus observation remains a discrepancy for P9H5 and final acceptance.

## Phase sequence

```text
P9H0 complete PR #430
P9H1 work-history-ui-h1-metric     exact next; not created
P9H2 work-history-ui-h2-chart      queued
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

## P9H1

Changing Viewer-minutes or Peak viewers must update URL and request/payload state, selected control and accessible name, chart values/scale/ticks/unit/description, Summary, Selected day, comparison, Ranking context, supported archive values, Report, Share, and Export context.

P9H1 replaces metric-related expected failures with passing assertions. It preserves one request per uncached provider/period/metric state, task/archive no-refetch, Back/Forward, provider separation, degraded states, and output schemas. It must not add another global fetch wrapper or document-wide observer.

## P9H2–P9H5

P9H2 repairs chart interpretation and pointer/keyboard/touch day interaction. P9H3 repairs Overview hierarchy. P9H4 repairs Archives and Report & Export. P9H5 repairs responsive/accessibility behavior and resolves the keyboard evidence discrepancy at 1440, 820, 390, and 360px.

## P9H6–P9H7

P9H6 runs the complete local candidate and all permanent gates. P9H7 uses one deliberate Preview candidate, verifies real provider data and exact production identity, publishes acceptance, and deletes the working note.

## Architecture acceptance

By P9H6 there is one documented authoritative History state/controller owner. No new global fetch replacement or document-wide observer coordinates state. Redundant layers are removed where equivalence is proven; retained layers have an owner and removal condition. URL, Back/Forward, provider, request-count, output, and degraded-state contracts remain protected.

## Stop rule

There is no active implementation branch. Do not create `work-history-ui-h1-metric` until explicit continuation.