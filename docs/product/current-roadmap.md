# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-29

## Current position

```text
Phase 7 P7A complete PR #426
Phase 8 P8A complete PR #427
Phase 8 P8B complete PR #428
Phase 9 P9H0 complete PR #430
Phase 9 P9H1 complete PR #434
Phase 9 P9H2 complete PR #436
Phase 9 P9H3 complete PR #439
Phase 9 P9H4A complete PR #441
P9H4A canonical closeout complete PR #442
Phase 9 P9H4B complete PR #443
P9H4B canonical closeout complete PR #444
Phase 9 P9H5 complete PR #447
P9H5 canonical closeout complete PR #448
Phase 9 P9H6 complete PR #449
P9H6 canonical closeout complete PR #450
Phase 9 P9H7 production acceptance complete PR #451
P9H7 canonical closeout complete PR #453
Phase 9 History P1 repair complete
Active implementation branch: none
Exact next implementation branch: work-quality-u10a-baseline
U10A branch created: no
```

Local Watchlist v1 is complete through PR #425. History production acceptance is permanently recorded in `docs/operations/history-production-acceptance-2026-06-28.md` against production commit `233a35ebe219c6be42723eb749e2bcc84ae7fc09`.

Phase 10 U10A is the exact next work after explicit continuation. It is a defect and ownership baseline only: reproduce and classify known non-History defects, identify authoritative and legacy owners, add failing gates or explicit fixtures, and create the temporary Phase 10 working note. Do not perform product repair in U10A except proven P0 isolation.

## Historical gate strings

The following strings are retained only so permanent phase-specific verifiers can continue to prove earlier handoffs. They are not the current execution state.

```text
Active implementation branch: none
Exact next implementation branch: work-history-ui-h7-acceptance
P9H7 branch created: no
Phase 8 P8B   complete PR #428
Phase 9 P9H1  complete PR #434
Phase 9 P9H6 active
Active implementation branch: work-history-ui-h6-candidate
P9H6 canonical closeout active
Active implementation branch: work-history-ui-h6-closeout
Phase 9 P9H5 complete PR #447
P9H5 canonical closeout complete PR #448
Active implementation branch: none
Exact next implementation branch: work-history-ui-h6-candidate
P9H6 branch created: no
Phase 9 P9H4B complete PR #443
P9H4B canonical closeout complete PR #444
Active implementation branch: none
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
Phase 9 P9H4B active
Active implementation branch: work-history-ui-h4b-tasks
Phase 9 P9H4A active
Active implementation branch: work-history-ui-h4a-overview-balance
Exact next implementation branch: work-history-ui-h4b-tasks
P9H4B branch created: no
P9H4A canonical closeout active
Active implementation branch: work-history-ui-h4a-closeout
Phase 9 P9H3 active
Active implementation branch: work-history-ui-h3-overview
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
Phase 9 P9H2  active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
Phase 9 P9H1  complete PR #434
Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
P9H2 branch created: no
Workflow run: 28232602651
```

## Production acceptance

```text
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge workflow/artifact: 28325492470 / 7935573120
Post-merge workflow/artifact: 28325951638 / 7935706617
Providers: Twitch and Kick, separated
Hosted scenarios: 1440 / 820 / 390 / 360 / forced colors
Result: pass
```

## Ordered roadmap

```text
Phase 9 History P1 repair complete
Phase 10 cross-site quality remediation exact next
Phase 11 acceptance and operations queued
Phase 12 release readiness queued
Phase 13–14 localization approved and queued
Phase 15 capability audit queued
Phase 16 major feature not approved
```

Do not start Phase 11–16 in parallel. No Phase 16 feature is approved.