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
Active implementation branch: none
Exact next implementation branch: work-quality-u10b-shell
U10B branch created: no
```

Permanent U10A evidence:

```text
docs/audits/cross-site-quality-u10a-baseline.json
docs/audits/cross-site-quality-u10a-owner-map.json
```

The U10A temporary working note is absent after closeout. Permanent History evidence remains `docs/operations/history-production-acceptance-2026-06-28.md`.

## Standard workflow

```text
canonical documents
  -> compare repository state
  -> confirm branch and entry condition
  -> work branch
  -> targeted checks
  -> evidence review
  -> optional preview validation
  -> merge to main
  -> update permanent documents
  -> full report and stop
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Keep Twitch and Kick separated. Start U10B only after explicit continuation.
