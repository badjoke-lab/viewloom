# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-26

This file defines which repository documents govern current ViewLoom work. Chat memory, screenshots, old PRs, imported plans, and completed milestone notes do not override this index.

## Required reading order

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/development-policy-addendum.md`](operations/development-policy-addendum.md)
3. [`operations/documentation-governance.md`](operations/documentation-governance.md)
4. [`product/current-roadmap.md`](product/current-roadmap.md)
5. [`product/current-schedule.md`](product/current-schedule.md)
6. [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md)
7. affected permanent baseline specification
8. active repair or feature specification
9. affected implementation plan
10. active note under `work-in-progress/`
11. relevant audit records under `audits/`

## Canonical program and product documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — product priority and ordered roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — exact active window, branch, completion criteria, and next branch
- [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md) — complete Phase 7–15 program
- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — accepted History baseline
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — completed H1–H7 baseline record
- [`product/history-ui-repair-spec.md`](product/history-ui-repair-spec.md) — approved active repair target
- [`product/history-ui-repair-plan.md`](product/history-ui-repair-plan.md) — active Phase 7–9 subplan
- [`product/channel-and-streamer-spec.md`](product/channel-and-streamer-spec.md) — accepted Channel v1 contract
- [`product/channel-v1-implementation-plan.md`](product/channel-v1-implementation-plan.md) — completed Channel v1 record
- [`product/report-export-consolidation-plan.md`](product/report-export-consolidation-plan.md) — completed shared-output record
- [`product/next-feature-data-capability-audit.md`](product/next-feature-data-capability-audit.md) — completed Phase 5 audit, not feature authorization
- [`product/local-watchlist-spec.md`](product/local-watchlist-spec.md) — accepted Watchlist v1 contract
- [`product/watchlist-v1-implementation-plan.md`](product/watchlist-v1-implementation-plan.md) — completed W0–W5 record
- [`../apps/web/docs/watchlist-latest-w2a-contract.md`](../apps/web/docs/watchlist-latest-w2a-contract.md)
- [`../apps/web/docs/watchlist-history-w2b-contract.md`](../apps/web/docs/watchlist-history-w2b-contract.md)

## Phase 8 audit records

Completed P8A baseline:

- [`audits/P8A_SCOPE.md`](audits/P8A_SCOPE.md)
- [`audits/public-surface-inventory.json`](audits/public-surface-inventory.json)
- [`audits/public-surface-inventory.md`](audits/public-surface-inventory.md)
- [`audits/public-surface-gaps.json`](audits/public-surface-gaps.json)
- `audits/public-surface-routes-*.json`
- `audits/public-surface-profiles-*.json`

Active P8B package:

- [`audits/P8B_SCOPE.md`](audits/P8B_SCOPE.md) — active browser-audit boundary and completion criteria
- [`../apps/web/scripts/public-browser-audit.mjs`](../apps/web/scripts/public-browser-audit.mjs) — browser evidence generator
- [`../scripts/verify-public-browser-audit.mjs`](../scripts/verify-public-browser-audit.mjs) — repository verifier
- [`../.github/workflows/public-browser-audit.yml`](../.github/workflows/public-browser-audit.yml) — latest-head browser workflow

Required before P8B completion:

```text
audits/public-browser-defects.json
audits/public-browser-audit.md
GitHub Actions artifact public-browser-audit-p8b
```

P8B adds browser evidence and defect classifications. It may not silently rewrite the P8A inventory or mix product repair into the audit.

## Active temporary note

- [`work-in-progress/history-ui-repair-working-note.md`](work-in-progress/history-ui-repair-working-note.md) — active History defects, source hypotheses, ownership, evidence, and branch progress

Delete this note in P9H7 after stable decisions and evidence move into permanent documentation.

There is no active Local Watchlist, old History rebuild, Channel v1, Report & Export, or Phase 5 working note.

## Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md)
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md)
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md) — accepted baseline, not active repair completion
- [`operations/channel-production-acceptance-2026-06-23.md`](operations/channel-production-acceptance-2026-06-23.md)
- [`operations/report-export-consolidation-acceptance-2026-06-24.md`](operations/report-export-consolidation-acceptance-2026-06-24.md)
- [`operations/watchlist-production-acceptance-2026-06-25.md`](operations/watchlist-production-acceptance-2026-06-25.md)

## Current execution state

```text
Phase 6  Local Watchlist v1                               complete through PR #425
Phase 7  source-of-truth reset                            complete through PR #426
Phase 8  public inventory and browser audit               active
P8A      work-public-surface-inventory                     complete PR #427
P8B      work-public-browser-audit                         active
P9H0     work-history-ui-h0-baseline                       exact next after P8B
Phase 9  P0/P1 repair; History central track              queued
Phase 10 cross-site UI consolidation                      queued
Phase 11 operations and maintenance lock                  queued
Phase 12 Support/legal/Stripe/release readiness           queued
Phase 13 external launch                                  queued
Phase 14 next-feature capability audit                    queued
Phase 15 next major feature                               not approved
```

P8B exact next branch after completion:

```text
work-history-ui-h0-baseline
```

A newly proven P0 may interrupt. Do not create P9H0 before the P8B merge report and explicit continuation.

## P8B scope summary

```text
21 owned routes
4 required widths: 1440 / 820 / 390 / 360
84 production route scenarios
5 missing-surface probes
10 deterministic History scenarios
```

Known History defects remain P1. P8B captures exact reproduction, ownership, existing gates, and missing assertions; it does not repair them.

## Repository-comparison rule

Before a branch changes code or public behavior:

- compare `current-schedule.md` with actual branches and PRs;
- compare plan deliverables with files, workflows, artifacts, and production identity;
- record missing work before implementation;
- update documents first when state has advanced;
- keep the exact next branch visible in schedule, program plan, affected plan, and working note.

## Temporary-note lifecycle

At milestone completion:

1. transfer stable behavior and decisions into permanent documents;
2. update roadmap, schedule, and program plan;
3. resolve or defer remaining questions;
4. delete completed temporary notes;
5. unlink them from this index.

## Document precedence

1. development/deployment policy and later verified addendum
2. this index and documentation governance
3. current roadmap
4. current schedule
5. post-Watchlist program plan
6. active repair specification
7. accepted baseline specification
8. affected implementation plan
9. active working note
10. active audit records
11. completed milestone records

## Documentation-first execution

Implementation must not begin from chat memory, screenshots, or an old PR alone. Every work branch confirms the scheduled branch, completion criteria, repository gaps, governing documents, and scope boundaries before changing code.
