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
P9H4A complete through PR #441
P9H4A canonical closeout complete through PR #442
P9H4B complete through PR #443
P9H4B canonical closeout complete through PR #444
P9H5 complete through PR #447
P9H5 canonical closeout complete through PR #448
P9H6 complete through PR #449
P9H6 canonical closeout complete through PR #450
P9H7 active on work-history-ui-h7-acceptance
Active implementation branch: work-history-ui-h7-acceptance
Preview branch: preview-history-ui-h7-acceptance
```

Historical gate evidence, not current state:

```text
Active implementation branch: none
Exact next implementation branch: work-history-ui-h7-acceptance
P9H7 branch created: no
P9H6 active on work-history-ui-h6-candidate
Active implementation branch: work-history-ui-h6-candidate
P9H6 canonical closeout active
Active implementation branch: work-history-ui-h6-closeout
P9H5 active on work-history-ui-h5-responsive
Active implementation branch: work-history-ui-h5-responsive
Exact next implementation branch: work-history-ui-h6-candidate
P9H6 branch created: no
P9H4B active on work-history-ui-h4b-tasks
Active implementation branch: work-history-ui-h4b-tasks
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
P9H4A active on work-history-ui-h4a-overview-balance
Active implementation branch: work-history-ui-h4a-overview-balance
Exact next implementation branch: work-history-ui-h4b-tasks
P9H4B branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
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

P9H7 is acceptance-only. Do not start Phase 10 before exact Preview and production evidence are complete and permanent documentation has replaced temporary notes.

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
