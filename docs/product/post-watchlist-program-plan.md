# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 3.3
Created: 2026-06-25
Last updated: 2026-06-28
Current phase: Phase 9 — P9H7 hosted and production acceptance
Current implementation branch: `work-history-ui-h7-acceptance`
Current Preview branch: `preview-history-ui-h7-acceptance`
Completed metric synchronization: PR #434
Completed chart interpretation: PR #436
Completed Overview hierarchy: PR #439
Completed Overview balance: PR #441
Completed P9H4A canonical closeout: PR #442
Completed Archives and publishing hierarchy: PR #443
Completed P9H4B canonical closeout: PR #444
Completed responsive and accessibility repair: PR #447
Completed P9H5 canonical closeout: PR #448
Completed local candidate: PR #449
Completed P9H6 canonical closeout: PR #450

## Historical gate strings

```text
Version: 3.2
Current phase: Phase 9 — P9H6 complete; P9H7 next
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h7-acceptance`
P9H7 work-history-ui-h7-acceptance exact next after explicit continuation; not created
Version: 3.1
Current phase: Phase 9 — P9H5 complete; P9H6 next
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h6-candidate`
P9H6  work-history-ui-h6-candidate         exact next after explicit continuation; not created
P9H6 active
Current implementation branch: `work-history-ui-h6-candidate`
P9H6 canonical closeout active
Current implementation branch: `work-history-ui-h6-closeout`
Version: 3.0
Current phase: Phase 9 — P9H4B complete; P9H5 next
Exact next implementation branch after explicit continuation: `work-history-ui-h5-responsive`
P9H5 work-history-ui-h5-responsive        exact next after explicit continuation; not created
P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`
Version: 2.9
Current phase: Phase 9 — P9H4A complete; P9H4B next
Exact next implementation branch after explicit continuation: `work-history-ui-h4b-tasks`
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created
P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`
Version: 2.8
Current implementation branch: `work-history-ui-h4a-overview-balance`
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H4A canonical closeout active
Current implementation branch: `work-history-ui-h4a-closeout`
Version: 2.7
Current phase: Phase 9 — P9H3 complete; P9H4 next
Current implementation branch: none
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created
| 8 | P8B | complete PR #428
Version: 2.6
Current implementation branch: `work-history-ui-h3-overview`
| 9 | P9H3 | active
P9H3 work-history-ui-h3-overview   active
Version: 2.5
Current implementation branch: none
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created
Version: 2.4
Current phase: Phase 9 — P9H2 chart interpretation
Current implementation branch: `work-history-ui-h2-chart`
| 9 | P9H2 | active
P9H2 work-history-ui-h2-chart      active
Version: 2.3
Current implementation branch: none
Completed metric synchronization: PR #434
| 9 | P9H1 | complete PR #434
Exact next implementation branch after explicit continuation: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created
```

This document owns the approved execution program after Local Watchlist v1. Before each branch, compare the schedule with actual branches and PRs, confirm explicit continuation, read affected authorities, and record missing work. After each merge, update canonical state, issue the full report, name the next branch, and stop.

## P9H6 evidence

```text
Final head: c7d54e530053b29091b84e651b78b679f55f3a8a
Merge: d46e2f3d04c9528e6493d9aa3d436000e340272a
Workflow: 28308389704
Artifact: history-ui-h6-candidate / 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Manifest: viewloom-history-ui-h6-candidate-v1
Phases: 6
Scenarios: 21
```

## P9H7 acceptance program

```text
P9H7 work-history-ui-h7-acceptance active
Preview preview-history-ui-h7-acceptance exact final work HEAD only
Production main exact squash-merge SHA only
Permanent record required
Temporary History repair notes deleted only after acceptance
Phase 10 blocked until P9H7 closure
```

P9H7 uses `apps/web/scripts/history-ui-h7-hosted-acceptance.mjs` and `.github/workflows/history-ui-h7-acceptance.yml` to prove real provider data, exact deployment identity, public browser behavior, provider separation, and accessibility at 1440, 820, 390, and 360 pixels.

```text
P9H0 complete PR #430
P9H1 complete PR #434
P9H2 complete PR #436
P9H3 complete PR #439
P9H4A complete PR #441
P9H4B complete PR #443
P9H5 complete PR #447
P9H6 complete PR #449
P9H6 closeout complete PR #450
P9H7 work-history-ui-h7-acceptance active
Phase 10–15 queued
Phase 16 not approved
```

Phase 16 begins only after one candidate is separately approved with its own specification and branch sequence.
