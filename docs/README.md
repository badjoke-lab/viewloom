# ViewLoom documentation index

Status: source-of-truth map

This file defines which repository documents govern current ViewLoom work. Older design notes, imported plans, PR descriptions, screenshots, and completed working notes may remain useful as history, but they do not override the documents listed here.

## Required reading order

Before changing ViewLoom, read these documents in order:

1. [`operations/development-and-deployment-policy.md`](operations/development-and-deployment-policy.md)
2. [`operations/documentation-governance.md`](operations/documentation-governance.md)
3. [`product/current-roadmap.md`](product/current-roadmap.md)
4. [`product/current-schedule.md`](product/current-schedule.md)
5. the affected feature specification under `product/`
6. the affected implementation plan under `product/`
7. any active note under `work-in-progress/`

## Current canonical product documents

- [`product/current-roadmap.md`](product/current-roadmap.md) — current product state and ordered roadmap
- [`product/current-schedule.md`](product/current-schedule.md) — execution windows, entry criteria, and completion criteria
- [`product/history-and-trends-spec.md`](product/history-and-trends-spec.md) — permanent History & Trends product specification
- [`product/history-layout-rebuild-plan.md`](product/history-layout-rebuild-plan.md) — current History layout implementation plan

## Active temporary working notes

- [`work-in-progress/history-layout-rebuild-working-note.md`](work-in-progress/history-layout-rebuild-working-note.md)

A file in `work-in-progress/` is deliberately temporary. It may contain screenshots, defects, unresolved decisions, PR slicing notes, and implementation reminders that do not belong in a permanent specification.

When the associated work is complete:

1. transfer stable behavior, acceptance criteria, and architectural decisions into the permanent specification or operating documentation;
2. update the roadmap and schedule to reflect the completed state;
3. delete the temporary working note in the completion PR;
4. remove its link from this index.

A completed temporary note must not remain as a second source of truth.

## Document precedence

When documents conflict, use this order:

1. development and deployment policy;
2. documentation governance and this index;
3. current roadmap;
4. current schedule;
5. permanent feature specification;
6. current implementation plan;
7. active working note;
8. older or historical documents.

The lower document may add detail, but it may not silently contradict the higher document.

## Documentation-first execution rule

Implementation must not begin from chat memory, screenshots, or an old PR alone. Before each work branch:

- identify the governing documents from this index;
- confirm that the roadmap and schedule still place the work next;
- update the specification or active working note when the required behavior changed;
- reference the governing files in the PR description;
- update or retire the documents when the implementation completes.
