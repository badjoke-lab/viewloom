# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-06-28

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
Phase 9 P9H7 active
Active implementation branch: work-history-ui-h7-acceptance
Attempted Preview branch: preview-history-ui-h7-acceptance
Preview branch: preview-history-ui-h7-acceptance
Preview deployment: unavailable; exact-SHA 404 before tests
```

Local Watchlist v1 is complete through PR #425.

P9H7 adds no product feature or data-path change. The requested Cloudflare Preview branch did not produce a deployment and returned 404 before any provider or browser scenario ran. The governed substitute is a complete exact-base-SHA production baseline on PR #451, followed by the same exact-merge-SHA production acceptance after squash merge. Phase 10 remains blocked until P9H7 evidence transfer and temporary-note deletion are complete.

## Historical gate strings

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

## P9H6 evidence

```text
Head: c7d54e530053b29091b84e651b78b679f55f3a8a
Workflow run: 28308389704
Artifact: history-ui-h6-candidate / 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Merge: d46e2f3d04c9528e6493d9aa3d436000e340272a
Manifest: viewloom-history-ui-h6-candidate-v1
```

## Active P9H7 sequence

```text
work-history-ui-h7-acceptance
  -> repository/type/build gates
  -> exact current-main production baseline
  -> close preview trigger PR #452 without merge
  -> squash merge PR #451 to main
  -> exact-merge-SHA production acceptance
  -> permanent record and temporary-note deletion
```

The failed Preview attempts and artifacts remain part of the permanent operational record. They do not count as product acceptance because the Preview origin never reached deployment identity.

## Ordered roadmap

```text
Phase 9 History P1 repair P9H7 active
Phase 10 cross-site repair blocked until P9H7 closure
Phase 11 acceptance and operations queued
Phase 12 release readiness queued
Phase 13–14 localization approved and queued
Phase 15 capability audit queued
Phase 16 major feature not approved
```

No Phase 16 feature is approved.
