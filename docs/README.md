# ViewLoom documentation index

Status: source-of-truth map

This file defines which repository documents govern current ViewLoom work. Older design notes, screenshots, imported plans, and completed working notes do not override the documents listed here.

## Required reading order

Before changing ViewLoom, read:

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/development-policy-addendum.md`](operations/development-policy-addendum.md)
3. [`operations/documentation-governance.md`](operations/documentation-governance.md)
4. [`product/current-roadmap.md`](product/current-roadmap.md)
5. [`product/current-schedule.md`](product/current-schedule.md)
6. the affected permanent product specification
7. the affected implementation plan or completed implementation record
8. any active temporary note under `work-in-progress/`

## Current canonical product documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — current product state and ordered roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — current execution position and next work
- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — accepted History product specification
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — completed History rebuild record
- [`product/channel-and-streamer-spec.md`](product/channel-and-streamer-spec.md) — accepted Channel / Streamer v1 specification
- [`product/channel-v1-implementation-plan.md`](product/channel-v1-implementation-plan.md) — completed Channel v1 implementation record
- [`product/report-export-consolidation-plan.md`](product/report-export-consolidation-plan.md) — completed Phase 4 consolidation record
- [`product/next-feature-data-capability-audit.md`](product/next-feature-data-capability-audit.md) — completed Phase 5 audit and Watchlist approval boundary
- [`product/local-watchlist-spec.md`](product/local-watchlist-spec.md) — active permanent Local Watchlist v1 contract
- [`product/watchlist-v1-implementation-plan.md`](product/watchlist-v1-implementation-plan.md) — active W0–W5 implementation and acceptance plan
- [`../apps/web/docs/watchlist-latest-w2a-contract.md`](../apps/web/docs/watchlist-latest-w2a-contract.md) — accepted W2A latest-observation and request contract
- [`../apps/web/docs/watchlist-history-w2b-contract.md`](../apps/web/docs/watchlist-history-w2b-contract.md) — active W2B retained-History and combined-evidence contract

## Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md)
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md)
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md)
- [`operations/channel-production-acceptance-2026-06-23.md`](operations/channel-production-acceptance-2026-06-23.md)
- [`operations/report-export-consolidation-acceptance-2026-06-24.md`](operations/report-export-consolidation-acceptance-2026-06-24.md)

## Active temporary working note

- [`work-in-progress/watchlist-v1-working-note.md`](work-in-progress/watchlist-v1-working-note.md) — active Local Watchlist implementation ledger; retain through W5 production closure

There is no active History rebuild, Channel v1, Report & Export consolidation, or Phase 5 capability-audit working note.

The pending History UI appearance revision has no working note because screenshots and detailed instructions remain unavailable. Begin that work later with a new audit and note rather than reviving an old completed note.

Local Watchlist W0 is complete through PR #415, W1 through PR #416, and W2A through PR #417. W2B History/combined foundation is the completion candidate in PR #418. W3A provider routes are next only after the PR #418 merge report.

## Temporary-note lifecycle

When associated work completes:

1. transfer stable behavior and acceptance evidence into permanent documentation;
2. update roadmap and schedule;
3. delete the temporary note in the completion PR;
4. remove its link from this index.

A completed temporary note must not remain as a second source of truth.

## Document precedence

1. development and deployment policy
2. later verified policy addendum
3. documentation governance and this index
4. current roadmap
5. current schedule
6. permanent feature specification
7. current implementation plan or completed record
8. active working note
9. older or historical documents

## Documentation-first execution rule

Implementation must not begin from chat memory, screenshots, or an old PR alone.

Before each work branch:

- identify governing documents from this index;
- confirm that roadmap and schedule still place the work next;
- update the specification or active note when required behavior changed;
- reference governing files in the PR description;
- update or retire documents when implementation completes.
