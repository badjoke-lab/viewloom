# Contributing to ViewLoom

## Required reading

Before changing the repository, read the development/deployment policy, documentation governance, documentation index, current roadmap, current schedule, complete program plan, affected specifications, implementation plan, working note, and acceptance records.

Do not begin from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs before implementation.

## Current state

```text
P9H0 complete through PR #430
P9H0 documentation closeout complete through PR #432
Final-state correction complete through PR #433
P9H1 complete through PR #434
P9H2 complete through PR #436
P9H2 canonical closeout complete through PR #437
P9H3 complete through PR #439
P9H3 canonical closeout complete through PR #440
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
```

Historical gate evidence, not current state:

```text
P9H3 active on work-history-ui-h3-overview
Active implementation branch: work-history-ui-h3-overview
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no

Active implementation branch: none
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no

P9H2 active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no

Active implementation branch: none
P9H2 branch created: no
```

P9H4 must not be created before explicit continuation is received.

## Standard workflow

```text
canonical documents
  -> compare repository state
  -> confirm branch and entry condition
  -> work-* branch
  -> targeted checks
  -> update working note
  -> final evidence review
  -> optional preview-* validation
  -> merge to main
  -> update permanent documents
  -> full report and stop
```

`work-*` is ordinary development, `preview-*` is deliberate runtime validation, and `main` is production. Connector-created multi-commit work must be squash merged.
