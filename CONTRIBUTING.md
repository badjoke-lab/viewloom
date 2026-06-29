# Contributing to ViewLoom

## Required reading

Before changing the repository, read the development and deployment policy, documentation governance, documentation index, current roadmap, current schedule, program plan, affected specifications, implementation plans, active working notes, and permanent evidence.

Do not begin from chat memory, screenshots, an old pull request, or a stale document. Compare the schedule with actual branches and pull requests before implementation.

## Current state

```text
Local Watchlist v1 complete through PR #425
Phase 8 complete through PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete through PR #451
P9H7 canonical closeout complete through PR #453
Phase 10 U10A quality baseline complete through PR #454
U10A canonical closeout complete through PR #455
Phase 10 U10B shared shell active
Active implementation branch: work-quality-u10b-shell
Exact next implementation branch after closeout: work-quality-u10c-visualization
U10C branch created: no
```

The active working note is `docs/work-in-progress/u10b-shared-shell.md`. U10B is limited to the common shell and its acceptance gates.

## Standard workflow

```text
canonical documents
  -> compare repository state
  -> confirm branch and entry condition
  -> work branch
  -> targeted checks
  -> browser evidence
  -> optional preview validation
  -> merge to main
  -> canonical closeout
  -> full report and stop
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Keep Twitch and Kick separated. Do not create U10C before U10B closeout and explicit continuation.
