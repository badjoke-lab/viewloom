# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## 1. Current position

```text
Phase 7 P7A   complete PR #426
Phase 8 P8A   complete PR #427
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
P9H0 closeout active on work-p9h0-closeout
Phase 9 P9H1  exact next after closeout merge report and explicit continuation
```

Exact next implementation branch:

```text
work-history-ui-h1-metric
```

P9H1 has not been created.

## 2. Verified state

- Local Watchlist v1 is complete through PR #425.
- The source-of-truth reset is complete through PR #426.
- Public-surface inventory is complete through PR #427.
- Public browser audit is complete through PR #428.
- The deterministic History P9H0 baseline is complete through PR #430.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

P8B result:

```text
P0 0
P1 3
P2 5
P3 0
```

P9H0 locked these deterministic failures:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-mobile-task-flow-too-long
history-selected-day-context-stale
```

The local first-Tab scenarios moved focus to the ViewLoom home link. The earlier P8B production body-focus observation remains a production/local discrepancy for P9H5 and final acceptance.

## 3. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact active state and next branch:
  docs/product/current-schedule.md

Complete Phase 7–16 program:
  docs/product/post-watchlist-program-plan.md

History repair:
  docs/product/history-ui-repair-spec.md
  docs/product/history-ui-repair-plan.md
  docs/work-in-progress/history-ui-repair-working-note.md

P9H0 evidence:
  docs/audits/history-ui-h0-baseline.md
  docs/audits/history-ui-h0-owner-map.json
  docs/audits/history-ui-h0-source-map.md
  docs/audits/history-ui-h0-findings.md

Cross-site quality:
  docs/product/cross-site-quality-remediation-spec.md
  docs/product/cross-site-quality-remediation-plan.md

Localization:
  docs/product/localization-spec.md
  docs/product/localization-implementation-plan.md
```

## 4. Ordered roadmap

```text
Phase 7   source-of-truth reset                              complete PR #426
Phase 8   inventory and browser defect audit                 complete PR #428
Phase 9   History P1 repair                                   P9H0 complete; P9H1 next
Phase 10  cross-site defect/UI/architecture repair           queued
Phase 11  acceptance, CI, type safety, monitoring            queued
Phase 12  English legal, Support, Stripe, release readiness  queued
Phase 13  localization foundation plus English/Japanese      approved and queued
Phase 14  Spanish/pt-BR localization and staged launch       approved and queued
Phase 15  next-feature data-capability audit                  queued
Phase 16  one separately approved major feature              not approved
```

No Phase 16 feature is approved.

## 5. Phase 9 sequence

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

P9H1 repairs Viewer-minutes / Peak viewers execution across URL, provider request, selected control, chart, Summary, Selected day, Ranking context, supported Archives, Report, Share, and Exports. It does not add a metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## 6. Later phases

Phase 10 repairs reproduced cross-site defects and consolidates shared shell, chart grammar, responsive/accessibility behavior, route readiness, and safe architecture cleanup.

Phase 11 locks one all-public acceptance matrix, CI consolidation, staged strict-null-checking, monitoring, runbooks, and maintenance cadence.

Phase 12 completes the English source versions of Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, Support, Stripe flow, limitations, FAQ, and release assets.

Phase 13 introduces the localization runtime and completes English/Japanese acceptance. Phase 14 adds Spanish and Brazilian Portuguese and then performs staged launch. Arabic/RTL requires separate approval after usage evidence.

UI localization is distinct from collecting or analyzing stream language. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## 7. Work not approved before P9H1 authorization

- another History metric or archive type;
- exact session reconstruction;
- category or stream-language collection;
- combined provider totals or rankings;
- login, cloud accounts, alerts, or AI interpretation;
- new D1 schema, collector, cron, retention, binding, or API route;
- output-schema changes;
- localization runtime before Phase 13;
- parallel major feature expansion.

## 8. Stop rule

After this closeout branch merges, issue the full merge report, name `work-history-ui-h1-metric` as the exact next branch, and stop. Do not create P9H1 until explicit continuation.