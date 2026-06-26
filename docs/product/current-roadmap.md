# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-26

## 1. Current position

```text
Phase 7 P7A   complete PR #426
Phase 8 P8A   complete PR #427
Phase 8 P8B   complete PR #428
Phase 9 P9H0  complete PR #430
P9H0 closeout complete PR #432
Final-state correction complete PR #433
Phase 9 P9H1  complete PR #434
Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
```

P9H2 has not been created.

## 2. Verified state

- Local Watchlist v1 is complete through PR #425.
- The source-of-truth reset is complete through PR #426.
- Public-surface inventory is complete through PR #427.
- Public browser audit is complete through PR #428.
- The deterministic History P9H0 baseline is complete through PR #430.
- P9H0 documentation/program closeout is complete through PR #432.
- Post-closeout canonical state is corrected through PR #433.
- History metric synchronization is complete through PR #434 at merge `31b81d3ed3a56369055ba09eb4de871dfc59d315`.
- Twitch and Kick remain separate across routes, APIs, storage, bindings, rankings, exports, and coverage claims.

P9H1 accepted evidence:

```text
Head: 9c4e3278b609e3f8d41fa3df71ba69f5ebc00618
Workflow run: 28232602651
Artifact: history-ui-h1-metric / 7903212809
Digest: sha256:783283fd1c913e7ccb99d04bb607ed5801db1c74ab3d341c81a40c440835e82c
```

P9H1 converted these failures to passing assertions:

```text
history-metric-ranking-context-stale
history-metric-summary-stale
history-selected-day-context-stale
```

The remaining deterministic History defect is:

```text
history-mobile-task-flow-too-long
```

It remains owned by P9H3/P9H5. The earlier P8B production body-focus observation remains a production/local discrepancy for P9H5 and final acceptance.

## 3. Authority map

```text
Product priority:
  docs/product/current-roadmap.md

Exact current state and branch:
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

P9H1 evidence:
  apps/web/scripts/history-ui-h1-browser.mjs
  scripts/verify-history-ui-h1-metric.mjs
  .github/workflows/history-ui-h1-metric.yml

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
Phase 9   History P1 repair                                   P9H1 complete; P9H2 next
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
P9H1 work-history-ui-h1-metric     complete PR #434
P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created
P9H3 work-history-ui-h3-overview   queued
P9H4 work-history-ui-h4-tasks      queued
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H1 synchronizes Viewer-minutes / Peak viewers across URL, provider request, selected control, chart, Summary, Selected day, comparison, Ranking context, supported Archives, Report, Share, and Exports. It also excludes missing daily rows from metric-day selection. It added no metric, API, D1 schema, collector, binding, cron, retention rule, provider combination, or output schema.

## 6. Later phases

P9H2 repairs chart interpretation. P9H3 repairs Overview hierarchy. P9H4 repairs Archives and publishing hierarchy. P9H5 repairs responsive/accessibility behavior and the production/local keyboard discrepancy. P9H6–P9H7 perform candidate and production acceptance.

Phase 10 repairs reproduced cross-site defects and consolidates shared shell, chart grammar, responsive/accessibility behavior, route readiness, and safe architecture cleanup.

Phase 11 locks one all-public acceptance matrix, CI consolidation, staged strict-null-checking, monitoring, runbooks, and maintenance cadence.

Phase 12 completes the English source versions of Contact, Terms, Privacy, Refund Policy, Commercial Disclosure, Support, Stripe flow, limitations, FAQ, and release assets.

Phase 13 introduces the localization runtime and completes English/Japanese acceptance. Phase 14 adds Spanish and Brazilian Portuguese and then performs staged launch. Arabic/RTL requires separate approval after usage evidence.

UI localization is distinct from collecting or analyzing stream language. Provider-origin names, IDs, titles, and categories are not translated by the initial program.

## 7. Stop rule

P9H1 is complete through PR #434. There is no active implementation branch. Do not create `work-history-ui-h2-chart` until explicit continuation.