# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-26

This file defines which repository documents govern current ViewLoom work. Chat memory, screenshots, old PRs, imported plans, and completed milestone notes do not override this index.

## 1. Required reading order

Before any branch changes code or public behavior, read:

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/development-policy-addendum.md`](operations/development-policy-addendum.md)
3. [`operations/documentation-governance.md`](operations/documentation-governance.md)
4. this index
5. [`product/current-roadmap.md`](product/current-roadmap.md)
6. [`product/current-schedule.md`](product/current-schedule.md)
7. [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md)
8. the affected accepted baseline specification
9. the affected active/future permanent specification
10. the affected implementation plan
11. any active note under `work-in-progress/`
12. relevant audit and acceptance records

Implementation must not begin from chat memory, screenshots, or an old PR alone. When scope, order, behavior, or acceptance criteria change, update governing documents first.

## 2. Canonical program documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — product priority and ordered Phase 7–16 roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — exact active window, branch, entry/exit criteria, and next branch
- [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md) — complete approved Phase 7–16 execution program

## 3. Active History repair authorities

- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — accepted History baseline
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — completed H1–H7 baseline record
- [`product/history-ui-repair-spec.md`](product/history-ui-repair-spec.md) — approved active P1 repair target
- [`product/history-ui-repair-plan.md`](product/history-ui-repair-plan.md) — active P9H0–P9H7 subplan
- [`work-in-progress/history-ui-repair-working-note.md`](work-in-progress/history-ui-repair-working-note.md) — active execution memory; delete in P9H7

## 4. Approved future quality and localization authorities

### Phase 10–11

- [`product/cross-site-quality-remediation-spec.md`](product/cross-site-quality-remediation-spec.md) — accepted cross-site UI, responsive, accessibility, architecture, CI, type-safety, and operations target
- [`product/cross-site-quality-remediation-plan.md`](product/cross-site-quality-remediation-plan.md) — U10A–U10H and O11A–O11G branch sequence

### Phase 13–14

- [`product/localization-spec.md`](product/localization-spec.md) — accepted UI localization behavior, route, translation-boundary, SEO, accessibility, and provider/data invariants
- [`product/localization-implementation-plan.md`](product/localization-implementation-plan.md) — I13A–I13K and I14A–I14C branch sequence

These documents authorize future scheduled work only. They do not authorize early implementation before their entry conditions.

## 5. Other accepted product records

- [`product/channel-and-streamer-spec.md`](product/channel-and-streamer-spec.md)
- [`product/channel-v1-implementation-plan.md`](product/channel-v1-implementation-plan.md)
- [`product/report-export-consolidation-plan.md`](product/report-export-consolidation-plan.md)
- [`product/next-feature-data-capability-audit.md`](product/next-feature-data-capability-audit.md) — completed old Phase 5 audit, not current feature authorization
- [`product/local-watchlist-spec.md`](product/local-watchlist-spec.md)
- [`product/watchlist-v1-implementation-plan.md`](product/watchlist-v1-implementation-plan.md)
- [`../apps/web/docs/watchlist-latest-w2a-contract.md`](../apps/web/docs/watchlist-latest-w2a-contract.md)
- [`../apps/web/docs/watchlist-history-w2b-contract.md`](../apps/web/docs/watchlist-history-w2b-contract.md)

## 6. Completed Phase 8 audit records

### P8A

- [`audits/P8A_SCOPE.md`](audits/P8A_SCOPE.md)
- [`audits/public-surface-inventory.json`](audits/public-surface-inventory.json)
- [`audits/public-surface-inventory.md`](audits/public-surface-inventory.md)
- [`audits/public-surface-gaps.json`](audits/public-surface-gaps.json)
- `audits/public-surface-routes-*.json`
- `audits/public-surface-profiles-*.json`

### P8B

- [`audits/P8B_SCOPE.md`](audits/P8B_SCOPE.md)
- [`audits/public-browser-defects.json`](audits/public-browser-defects.json)
- [`audits/public-browser-audit.md`](audits/public-browser-audit.md)
- [`../apps/web/scripts/public-browser-audit.mjs`](../apps/web/scripts/public-browser-audit.mjs)
- [`../scripts/verify-public-browser-audit.mjs`](../scripts/verify-public-browser-audit.mjs)
- [`../.github/workflows/public-browser-audit.yml`](../.github/workflows/public-browser-audit.yml)
- GitHub Actions artifact `public-browser-audit-p8b`

P8B completed through PR #428. Its evidence remains the historical baseline for Phase 9–11 and must not be rewritten as active work.

## 7. Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md)
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md)
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md) — accepted baseline, not active repair completion
- [`operations/channel-production-acceptance-2026-06-23.md`](operations/channel-production-acceptance-2026-06-23.md)
- [`operations/report-export-consolidation-acceptance-2026-06-24.md`](operations/report-export-consolidation-acceptance-2026-06-24.md)
- [`operations/watchlist-production-acceptance-2026-06-25.md`](operations/watchlist-production-acceptance-2026-06-25.md)

## 8. Current execution state

```text
Phase 6  Local Watchlist v1                               complete through PR #425
Phase 7  source-of-truth reset                            complete through PR #426
Phase 8  public inventory and browser audit               complete through PR #428
P9H0     work-history-ui-h0-baseline                       active
P9H1     work-history-ui-h1-metric                         exact next after P9H0
Phase 9  History P1 repair                                 active
Phase 10 cross-site quality remediation                   queued
Phase 11 engineering and operations lock                  queued
Phase 12 English Support/legal/Stripe readiness           queued
Phase 13 English/Japanese localization                    queued
Phase 14 Spanish/pt-BR localization and staged launch     queued
Phase 15 next-feature capability audit                    queued
Phase 16 next major feature                               not approved
```

Current branch:

```text
work-history-ui-h0-baseline
```

Exact next branch after P9H0 merge report and explicit continuation:

```text
work-history-ui-h1-metric
```

## 9. P8B baseline summary

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production route scenarios
5 missing-surface probes
10 deterministic History scenarios
P0 0 / P1 3 / P2 5 / P3 0
```

Approved P1 work is History metric synchronization, first keyboard entry, and coherent desktop/mobile task hierarchy. P2 work is scheduled in Phase 10 or Phase 12 according to the program plan.

## 10. Repository-comparison rule

Before a branch changes code or public behavior:

- compare `current-schedule.md` with actual branches and PRs;
- compare plan deliverables with files, workflows, artifacts, and production identity;
- confirm predecessor merge report and explicit continuation;
- record missing work before implementation;
- update documents first when state, order, scope, or acceptance criteria changed;
- keep the exact current and next branch visible in schedule, program plan, affected plan, and active note;
- reread revised authorities at the start of every later branch rather than relying on remembered prior content.

## 11. Temporary-note lifecycle

At milestone completion:

1. transfer stable behavior and decisions into permanent documents;
2. update roadmap, schedule, program plan, and affected implementation plan;
3. resolve or explicitly defer remaining questions;
4. delete the completed temporary note;
5. unlink it from this index.

There is no active Watchlist, old History rebuild, Channel, Report & Export, or old Phase 5 working note.

## 12. Document precedence

1. development/deployment policy and later verified addendum
2. this index and documentation governance
3. current roadmap
4. current schedule
5. post-Watchlist program plan
6. active/future permanent feature or quality specification
7. accepted baseline specification
8. affected implementation plan
9. active working note
10. active audit/acceptance evidence
11. completed milestone records

A lower-level document may add detail but may not silently contradict a higher-level document.