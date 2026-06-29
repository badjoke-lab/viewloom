# Contributing to ViewLoom

## Required reading

Before changing the repository, read the development/deployment policy, documentation governance, documentation index, current roadmap, current schedule, complete program plan, affected specifications, implementation plan, working note, and acceptance records.

Do not begin from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs before implementation.

## Current state

```text
Local Watchlist v1 complete through PR #425
Phase 8 complete through PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete through PR #451
P9H7 canonical closeout complete through PR #453
Phase 10 U10A quality baseline active
Active implementation branch: work-quality-u10a-baseline
Exact next implementation branch after U10A: work-quality-u10b-shell
U10B branch created: no
```

U10A uses `docs/work-in-progress/u10a-quality-baseline.md`, `docs/audits/cross-site-quality-u10a-baseline.json`, and `docs/audits/cross-site-quality-u10a-owner-map.json` as its temporary evidence authorities.

U10A is baseline-only. It reproduces and classifies known non-History defects, identifies current and compatibility owners, and adds static or browser fixtures. Product repair is outside U10A except proven P0 isolation.

Permanent History evidence is owned by `docs/operations/history-production-acceptance-2026-06-28.md`.

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

`work-*` is ordinary development, `preview-*` is deliberate runtime validation, and `main` is production. Connector-created multi-commit work should be squash merged where the connector permits it. Twitch and Kick must remain separated. Do not start U10B or later phases in parallel.