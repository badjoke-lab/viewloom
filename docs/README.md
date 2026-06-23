# ViewLoom documentation index

Status: source-of-truth map

This file defines which repository documents govern current ViewLoom work. Older design notes, screenshots, imported plans, and completed working notes may remain useful as history, but they do not override the documents listed here.

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

## Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md) — Cloudflare production and Preview configuration verification
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md) — permanent production smoke contract
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md) — completed Twitch/Kick History acceptance
- [`operations/channel-production-acceptance-2026-06-23.md`](operations/channel-production-acceptance-2026-06-23.md) — completed Twitch/Kick Channel acceptance

## Active temporary working notes

There is no active History rebuild or Channel v1 working note.

History H1–H7 and Channel C0–C5B completed production acceptance on 2026-06-23. Their temporary notes were retired after stable behavior, architecture, and evidence moved into permanent documentation.

The pending History UI appearance revision does not yet have a working note because screenshots and detailed instructions are not available. When those inputs arrive, begin with a new audit and a dedicated temporary note rather than reviving an old completed note.

A future Phase 4 Report & Export audit may create a temporary note only when unresolved implementation decisions require one.

## Temporary-note lifecycle

A file under `work-in-progress/` may contain defects, screenshots, unresolved decisions, PR slicing, and implementation reminders that do not belong in a permanent specification.

When associated work completes:

1. transfer stable behavior, acceptance criteria, and architectural decisions into permanent documentation;
2. update the roadmap and schedule;
3. delete the temporary note in the completion PR;
4. remove its link from this index.

A completed temporary note must not remain as a second source of truth.

## Document precedence

When documents conflict, use this order:

1. development and deployment policy;
2. later verified policy addendum;
3. documentation governance and this index;
4. current roadmap;
5. current schedule;
6. permanent feature specification;
7. current implementation plan or completed implementation record;
8. active working note;
9. older or historical documents.

## Documentation-first execution rule

Implementation must not begin from chat memory, screenshots, or an old PR alone.

Before each work branch:

- identify governing documents from this index;
- confirm that roadmap and schedule still place the work next;
- update the specification or active note when required behavior changed;
- reference governing files in the PR description;
- update or retire documents when implementation completes.
