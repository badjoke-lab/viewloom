# ViewLoom documentation index

Status: source-of-truth map

This file defines which repository documents govern current ViewLoom work. Older design notes, imported plans, PR descriptions, screenshots, and completed working notes may remain useful as history, but they do not override the documents listed here.

## Required reading order

Before changing ViewLoom, read these documents in order:

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/development-policy-addendum.md`](operations/development-policy-addendum.md)
3. [`operations/documentation-governance.md`](operations/documentation-governance.md)
4. [`product/current-roadmap.md`](product/current-roadmap.md)
5. [`product/current-schedule.md`](product/current-schedule.md)
6. the affected feature specification under `product/`
7. the affected implementation plan under `product/`
8. any active note under `work-in-progress/`

The addendum contains the later verified Cloudflare state and documentation-first rules until those changes are consolidated into the main policy.

## Current canonical product documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — current product state and ordered roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — execution windows, entry criteria, and completion criteria
- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — accepted History & Trends product specification
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — completed History rebuild implementation record
- [`product/channel-and-streamer-spec.md`](product/channel-and-streamer-spec.md) — permanent Channel / Streamer v1 product specification
- [`product/channel-v1-implementation-plan.md`](product/channel-v1-implementation-plan.md) — active PR-sliced Channel v1 implementation plan

## Permanent acceptance records

- [`operations/cloudflare-verification-2026-06-21.md`](operations/cloudflare-verification-2026-06-21.md) — Cloudflare production and Preview configuration verification
- [`operations/production-smoke-runbook.md`](operations/production-smoke-runbook.md) — permanent production smoke contract
- [`operations/history-production-acceptance-2026-06-23.md`](operations/history-production-acceptance-2026-06-23.md) — completed Twitch/Kick History Preview and production acceptance

## Active temporary working notes

- [`work-in-progress/channel-v1-audit.md`](work-in-progress/channel-v1-audit.md) — completed C0 evidence and active implementation note for Channel / Streamer v1

There is no active History rebuild working note. The History H1–H7 milestone completed production acceptance on 2026-06-23, and its temporary note was retired after stable decisions were transferred into permanent documentation.

The Channel audit note is temporary. C0 is complete, but the note remains active through C2–C5 because it contains the production baseline, unresolved implementation findings, and deletion checklist. It must be retired after Channel v1 production acceptance transfers final evidence into permanent Channel documentation.

A file in `work-in-progress/` may contain screenshots, defects, unresolved decisions, PR slicing notes, and implementation reminders that do not belong in a permanent specification.

When the associated work is complete:

1. transfer stable behavior, acceptance criteria, and architectural decisions into the permanent specification or operating documentation;
2. update the roadmap and schedule to reflect the completed state;
3. delete the temporary working note in the completion PR;
4. remove its link from this index.

A completed temporary note must not remain as a second source of truth.

## Document precedence

When documents conflict, use this order:

1. development and deployment policy;
2. later verified development-policy addendum;
3. documentation governance and this index;
4. current roadmap;
5. current schedule;
6. permanent feature specification;
7. current implementation plan;
8. active working note;
9. older or historical documents.

The lower document may add detail, but it may not silently contradict the higher document.

## Documentation-first execution rule

Implementation must not begin from chat memory, screenshots, or an old PR alone. Before each work branch:

- identify the governing documents from this index;
- confirm that the roadmap and schedule still place the work next;
- update the specification or active working note when the required behavior changed;
- reference the governing files in the PR description;
- update or retire the documents when the implementation completes.
