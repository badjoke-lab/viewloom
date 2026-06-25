# ViewLoom documentation index

Status: source-of-truth map

This file defines which repository documents govern current ViewLoom work. Older design notes, screenshots, imported plans, completed milestone records, and chat memory do not override the documents listed here.

## Required reading order

Before changing ViewLoom, read:

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/development-policy-addendum.md`](operations/development-policy-addendum.md)
3. [`operations/documentation-governance.md`](operations/documentation-governance.md)
4. [`product/current-roadmap.md`](product/current-roadmap.md)
5. [`product/current-schedule.md`](product/current-schedule.md)
6. [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md)
7. the affected permanent baseline specification
8. any active repair or feature specification
9. the affected implementation or repair plan
10. any active temporary note under `work-in-progress/`
11. the active audit scope under `audits/` when the branch is an audit branch

## Current canonical program and product documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — product priority and ordered roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — exact active window, branch order, entry criteria, and completion criteria
- [`product/post-watchlist-program-plan.md`](product/post-watchlist-program-plan.md) — complete approved Phase 7–15 execution program and repository-comparison rule
- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — accepted History production baseline specification
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — completed H1–H7 History baseline implementation record
- [`product/history-ui-repair-spec.md`](product/history-ui-repair-spec.md) — approved active History UI repair target
- [`product/history-ui-repair-plan.md`](product/history-ui-repair-plan.md) — active Phase 7–9 History repair subplan
- [`product/channel-and-streamer-spec.md`](product/channel-and-streamer-spec.md) — accepted Channel / Streamer v1 specification
- [`product/channel-v1-implementation-plan.md`](product/channel-v1-implementation-plan.md) — completed Channel v1 implementation record
- [`product/report-export-consolidation-plan.md`](product/report-export-consolidation-plan.md) — completed Phase 4 consolidation record
- [`product/next-feature-data-capability-audit.md`](product/next-feature-data-capability-audit.md) — completed Phase 5 audit; not an implementation authorization for deferred features
- [`product/local-watchlist-spec.md`](product/local-watchlist-spec.md) — accepted permanent Local Watchlist v1 contract
- [`product/watchlist-v1-implementation-plan.md`](product/watchlist-v1-implementation-plan.md) — completed W0–W5 implementation record
- [`../apps/web/docs/watchlist-latest-w2a-contract.md`](../apps/web/docs/watchlist-latest-w2a-contract.md) — accepted latest-observation contract
- [`../apps/web/docs/watchlist-history-w2b-contract.md`](../apps/web/docs/watchlist-history-w2b-contract.md) — accepted retained-History contract

## Active audit documents

- [`audits/P8A_SCOPE.md`](audits/P8A_SCOPE.md) — P8A scope and no-repair boundary
- [`audits/README.md`](audits/README.md) — active public-surface inventory package
- [`audits/public-surface-inventory.json`](audits/public-surface-inventory.json) — canonical machine-readable inventory manifest
- [`audits/public-surface-inventory.md`](audits/public-surface-inventory.md) — human-readable inventory and P8B handoff
- [`audits/public-surface-gaps.json`](audits/public-surface-gaps.json) — missing surfaces and acceptance gaps

## Active temporary working note

- [`work-in-progress/history-ui-repair-working-note.md`](work-in-progress/history-ui-repair-working-note.md) — active defect, ownership, branch-progress, and visual-QA memory for the History repair program

This note must be updated when an audit or repair branch discovers or resolves a material History decision. It is deleted in P9H7 after stable decisions and evidence move into permanent documentation.

There is no active Local Watchlist, old History rebuild, Channel v1, Report & Export consolidation, or Phase 5 capability-audit working note.

## Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md)
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md)
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md) — accepted History baseline, not completion of the active repair
- [`operations/channel-production-acceptance-2026-06-23.md`](operations/channel-production-acceptance-2026-06-23.md)
- [`operations/report-export-consolidation-acceptance-2026-06-24.md`](operations/report-export-consolidation-acceptance-2026-06-24.md)
- [`operations/watchlist-production-acceptance-2026-06-25.md`](operations/watchlist-production-acceptance-2026-06-25.md)

## Current execution state

```text
Phase 6  Local Watchlist v1                               complete through PR #425
Phase 7  source-of-truth reset and repair-program lock    complete through PR #426
Phase 8  public surface inventory and browser audit       active
P8A      work-public-surface-inventory                     active
P8B      work-public-browser-audit                         exact next branch
Phase 9  P0/P1 repair; History UI central track           approved and queued
Phase 10 cross-site UI consolidation                      queued
Phase 11 operations and maintenance lock                  queued
Phase 12 Support/legal/Stripe/release readiness           queued
Phase 13 external launch                                  queued
Phase 14 next-feature capability audit                    queued
Phase 15 next major feature                               not approved
```

Exact next branch after P8A merge reporting:

```text
work-public-browser-audit
```

Do not create it before the P8A merge report and explicit continuation instruction.

## Approved History repair classification

The following are P1 defects:

- metric controls do not produce a sufficiently observable, trustworthy page-wide change;
- the main chart lacks readable scale, ticks, units, and interaction cues;
- chart-side information is too thin or placeholder-like;
- lower-page regions are sparse or unclear in purpose;
- desktop and mobile do not yet form one coherent analysis workflow.

Additional screenshots may refine styling but are not required before functional and information-architecture repair begins.

## Repository-comparison rule

Before a branch changes code or public behavior:

- compare `current-schedule.md` with the branch and PR that actually exist;
- compare the active plan's required deliverables with repository files and workflows;
- record missing work before implementation;
- update the schedule first when the repository has advanced beyond its documented state;
- keep the exact next branch visible in the schedule, program plan, affected plan, and working note.

## Temporary-note lifecycle

When associated work completes:

1. transfer stable behavior and decisions into permanent specifications or operations records;
2. update roadmap, schedule, and the program plan;
3. resolve or explicitly defer remaining questions;
4. delete the temporary note in the completion PR;
5. remove its link from this index.

A completed temporary note must not remain as a competing source of truth.

## Document precedence

1. development and deployment policy
2. later verified policy addendum
3. this documentation index and documentation governance
4. current roadmap
5. current schedule
6. post-Watchlist program plan
7. active permanent repair specification
8. accepted baseline feature specification
9. affected implementation or repair plan
10. active temporary note
11. active audit records
12. completed milestone records and older files

A lower-level document may add detail but may not contradict a higher-level authority.

## Documentation-first execution rule

Implementation must not begin from chat memory, screenshots, or an old PR alone.

Before each work branch:

- read the current authorities in the required order;
- confirm the roadmap and schedule still place the work next;
- confirm the active branch name and completion criteria;
- compare planned deliverables with repository state;
- update the active note when findings or decisions change;
- reference the governing files in the PR description;
- update or retire documents when implementation completes.
