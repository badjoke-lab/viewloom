# ViewLoom documentation governance

Status: source of truth for planning and specification maintenance

This document defines how roadmap, schedule, specifications, implementation plans, and temporary working notes are used during ViewLoom development.

## Required reading order

Before starting a branch, read:

1. `development-and-deployment-policy.md`;
2. `docs/README.md`;
3. `docs/product/current-roadmap.md`;
4. `docs/product/current-schedule.md`;
5. the affected permanent feature specification;
6. the affected implementation plan;
7. any active note under `docs/work-in-progress/`.

Implementation must not begin from chat memory, screenshots, old pull requests, or imported plans alone.

## Document roles

### Roadmap

Defines current product state, phase order, and what must not be started yet.

Update when:

- a phase begins or completes;
- priority changes;
- a blocker changes the next executable work;
- a future feature is approved or deferred.

### Schedule

Defines planning windows, entry criteria, deliverables, and completion criteria.

Update when:

- a window moves materially;
- a phase is blocked or shortened;
- completion criteria change;
- production acceptance changes the next start date.

### Permanent feature specification

Defines stable product behavior, states, information architecture, data honesty, responsive requirements, and acceptance criteria.

It must not contain temporary debugging details or PR-by-PR status.

### Implementation plan

Defines implementation boundaries, PR sequence, verification gates, and cleanup sequence for the active milestone.

### Temporary working note

Stores active execution memory that is too unstable or detailed for a permanent specification, including:

- screenshot findings;
- current defect inventory;
- open questions;
- provisional layout decisions;
- PR progress;
- visual QA reminders.

Temporary notes live under `docs/work-in-progress/`.

## Temporary-note lifecycle

When an active milestone completes, its completion PR must:

1. transfer stable behavior and decisions into permanent specifications or operations docs;
2. update roadmap and schedule state;
3. resolve or explicitly defer remaining questions;
4. delete the temporary note;
5. remove the note from `docs/README.md`.

A completed temporary note must not remain as a competing source of truth.

## Pull request requirements

Every implementation PR must identify:

```text
Roadmap phase:
Schedule window:
Permanent specification:
Implementation plan:
Active working note, if any:
```

The PR must update the working note when it resolves, changes, or discovers a material decision.

## Conflict handling

Document precedence is:

1. development/deployment policy;
2. documentation index and this governance document;
3. current roadmap;
4. current schedule;
5. permanent feature specification;
6. implementation plan;
7. active temporary note;
8. older or historical files.

A lower-level document may add detail but may not silently contradict a higher-level document.

## Completion language

Do not describe a milestone as complete until:

- implementation is merged;
- required CI/browser gates pass on the final candidate;
- required Preview and production verification pass;
- permanent docs reflect final behavior;
- temporary notes are deleted when their lifecycle ends.
