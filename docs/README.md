# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-26

Chat memory, screenshots, old PRs, and completed milestone notes do not override this index.

## Required reading order

1. `operations/development-and-deployment-policy.md`
2. `operations/development-policy-addendum.md`
3. `operations/documentation-governance.md`
4. this index
5. `product/current-roadmap.md`
6. `product/current-schedule.md`
7. `product/post-watchlist-program-plan.md`
8. affected baseline specification
9. affected active/future specification
10. affected implementation plan
11. active note under `work-in-progress/`
12. relevant audit/acceptance records

When repository state and documentation disagree, update documentation before implementation. Every later branch rereads the current authorities.

## Canonical program documents

- `product/current-roadmap.md`
- `product/current-schedule.md`
- `product/post-watchlist-program-plan.md`

## Active History repair authorities

- `product/history-and-trends-spec.md`
- `product/history-layout-rebuild-plan.md`
- `product/history-ui-repair-spec.md`
- `product/history-ui-repair-plan.md`
- `work-in-progress/history-ui-repair-working-note.md`

## P9H0 permanent evidence

P9H0 completed through PR #430. Documentation/program closeout completed through PR #432. Final canonical correction completed through PR #433.

- `audits/history-ui-h0-baseline.md`
- `audits/history-ui-h0-owner-map.json`
- `audits/history-ui-h0-source-map.md`
- `audits/history-ui-h0-findings.md`
- `../apps/web/scripts/history-ui-h0-browser.mjs`
- `../scripts/verify-history-ui-h0-baseline.mjs`
- `../.github/workflows/history-ui-h0-baseline.yml`

The local keyboard run did not reproduce the P8B production body-focus result. This remains a P9H5/final-acceptance discrepancy.

## Active P9H1 evidence

- `../apps/web/scripts/history-ui-h1-browser.mjs`
- `../scripts/verify-history-ui-h1-metric.mjs`
- `../.github/workflows/history-ui-h1-metric.yml`

P9H1 must turn the Summary, Selected day, and Ranking metric-context failures into passing assertions while retaining the mobile task-flow defect for later phases.

## Approved future authorities

Phase 10–11:

- `product/cross-site-quality-remediation-spec.md`
- `product/cross-site-quality-remediation-plan.md`

Phase 13–14:

- `product/localization-spec.md`
- `product/localization-implementation-plan.md`

These documents do not authorize early implementation.

## Other accepted product records

- `product/channel-and-streamer-spec.md`
- `product/channel-v1-implementation-plan.md`
- `product/report-export-consolidation-plan.md`
- `product/next-feature-data-capability-audit.md`
- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `../apps/web/docs/watchlist-latest-w2a-contract.md`
- `../apps/web/docs/watchlist-history-w2b-contract.md`

## Completed Phase 8 records

P8A:

- `audits/P8A_SCOPE.md`
- `audits/public-surface-inventory.json`
- `audits/public-surface-inventory.md`
- `audits/public-surface-gaps.json`
- `audits/public-surface-routes-*.json`
- `audits/public-surface-profiles-*.json`

P8B:

- `audits/P8B_SCOPE.md`
- `audits/public-browser-defects.json`
- `audits/public-browser-audit.md`
- `../apps/web/scripts/public-browser-audit.mjs`
- `../scripts/verify-public-browser-audit.mjs`
- `../.github/workflows/public-browser-audit.yml`

## Permanent acceptance records

- `operations/cloudflare-verification-2026-06-21.md`
- `operations/production-smoke-runbook.md`
- `operations/history-production-acceptance-2026-06-23.md`
- `operations/channel-production-acceptance-2026-06-23.md`
- `operations/report-export-consolidation-acceptance-2026-06-24.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Current execution state

```text
Phase 6  Local Watchlist v1                               complete PR #425
Phase 7  source-of-truth reset                            complete PR #426
Phase 8  public inventory and browser audit               complete PR #428
P9H0     History deterministic baseline                    complete PR #430
C9H0     documentation and program closeout                complete PR #432
C9H0F    final canonical correction                        complete PR #433
Active implementation branch                              work-history-ui-h1-metric
P9H1     metric execution repair                           active
P9H2     work-history-ui-h2-chart                          exact next after merge; not created
Phase 10 cross-site quality remediation                   queued
Phase 11 engineering and operations lock                  queued
Phase 12 English legal/Support/Stripe readiness           queued
Phase 13 English/Japanese localization                    queued
Phase 14 Spanish/pt-BR localization and staged launch     queued
Phase 15 next-feature capability audit                    queued
Phase 16 next major feature                               not approved
```

## Repository comparison rule

Before changing code or public behavior, compare `current-schedule.md` with actual branches/PRs, confirm predecessor merge reporting and explicit continuation, compare plan deliverables with repository evidence, record missing work, and update documents first when state or scope changed.

## Temporary-note lifecycle

At milestone completion, transfer stable decisions, update roadmap/schedule/program, resolve or defer questions, delete the temporary note, and unlink it here.

## Document precedence

1. development/deployment policy
2. this index and documentation governance
3. roadmap
4. schedule
5. program plan
6. active/future specification
7. baseline specification
8. implementation plan
9. working note
10. audit/acceptance evidence
11. completed records

Complete P9H1 on the active branch, merge it, then stop before P9H2 until explicit continuation.