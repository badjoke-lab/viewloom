# Contributing to ViewLoom

## Required reading

Before changing the repository, read the development and deployment policy, documentation governance, documentation index, current roadmap, current schedule, program plan, affected specifications, implementation plans, and permanent evidence.

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
Phase 10 U10B shared shell complete through PR #456
U10B canonical closeout complete through PR #457
Phase 10 U10C visualization complete through PR #458
U10C canonical closeout complete through PR #459
Active implementation branch: none
Exact next implementation branch: work-quality-u10d-analysis-coherence
U10D branch created: no
```

The permanent U10C record is `docs/audits/cross-site-quality-u10c-visualization.json`.

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

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Keep Twitch and Kick separated. Do not create U10D before explicit continuation after the closeout report.

<!-- legacy-verifier transition marker only: U10C canonical closeout active through PR #459 -->
