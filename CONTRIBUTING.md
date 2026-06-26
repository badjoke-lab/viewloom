# Contributing to ViewLoom

## Required reading

Before changing the repository, read the development/deployment policy and addendum, documentation governance, `docs/README.md`, the current roadmap/schedule/program plan, the affected specifications and implementation plan, the active working note, and relevant audit/acceptance records.

Do not begin from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual repository state and update governing documents first when state, scope, order, or acceptance criteria changed.

## Current state

```text
P9H0 complete through PR #430
P9H0 documentation closeout complete through PR #432
Active implementation branch: none
Exact next implementation branch: work-history-ui-h1-metric
P9H1 branch created: no
```

## Workflow

```text
read current authorities
  -> compare actual repository state
  -> confirm predecessor report and explicit continuation
  -> create the scheduled work-* branch
  -> run targeted checks
  -> update the working note
  -> run final latest-head CI/browser/artifact checks
  -> use preview-* only when deliberate runtime validation is required
  -> merge
  -> verify production where applicable
  -> update permanent documentation
  -> issue the full report and stop
```

Keep Twitch and Kick routes, APIs, storage, rankings, exports, locales, and coverage claims separate. Group related changes logically. Connector-forced multi-commit PRs use `[CF-Pages-Skip]` where appropriate and squash merge.

A merged PR is not automatically deployed or visually accepted. Completion uses the applicable CI, browser artifacts, Preview, exact production identity, smoke, manual visual/localization acceptance, permanent documentation, and temporary-note cleanup.

P9H1 resumes only after explicit continuation.