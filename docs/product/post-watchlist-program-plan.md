# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 3.1
Created: 2026-06-25
Last updated: 2026-06-27
Current phase: Phase 9 — P9H5 complete; P9H6 next
Current implementation branch: none
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed metric synchronization: PR #434
Completed chart interpretation: PR #436
Completed P9H2 canonical closeout: PR #437
Completed Overview hierarchy: PR #439
Completed P9H3 canonical closeout: PR #440
Completed Overview balance: PR #441
Completed P9H4A canonical closeout: PR #442
Completed Archives and publishing hierarchy: PR #443
Completed P9H4B canonical closeout: PR #444
Completed responsive and accessibility repair: PR #447
Completed P9H5 canonical closeout: PR #448
Exact next implementation branch after explicit continuation: `work-history-ui-h6-candidate`

P9H5 completed required-width responsive and accessibility repair. P9H6 creates the local candidate; P9H7 performs production acceptance.

Historical gate strings, not current state:

```text
Version: 3.0
Current phase: Phase 9 — P9H4B complete; P9H5 next
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h5-responsive`
P9H5 work-history-ui-h5-responsive        exact next after explicit continuation; not created

P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`

Version: 2.9
Current phase: Phase 9 — P9H4A complete; P9H4B next
Current implementation branch: none
Exact next implementation branch after explicit continuation: `work-history-ui-h4b-tasks`
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created

P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`

Version: 2.8
Current phase: Phase 9 — P9H4A Overview balance
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
Current phase: Phase 9 — P9H3 Overview hierarchy
Current implementation branch: `work-history-ui-h3-overview`
| 9 | P9H3 | active
P9H3 work-history-ui-h3-overview   active
P9H4 work-history-ui-h4-tasks      exact next after P9H3 merge and explicit continuation; not created

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

This document owns the complete approved execution program after Local Watchlist v1. Before each branch, compare the schedule with actual branches and PRs, confirm explicit continuation, read affected authorities, and record missing work. After each merge, update canonical state, issue the full report, name the next branch, and stop.

## Program status

```text
Phase 7   complete PR #426
Phase 8   complete PR #428
P9H0      complete PR #430
closeout  complete PR #432
final     complete PR #433
P9H1      complete PR #434
P9H2      complete PR #436
P9H2 closeout complete PR #437
P9H3      complete PR #439
P9H3 closeout complete PR #440
P9H4A     complete PR #441
P9H4A closeout complete PR #442
P9H4B     complete PR #443
P9H4B closeout complete PR #444
P9H5      complete PR #447
P9H5 closeout complete PR #448
P9H6–P9H7 queued
Phase 10–15 queued
Phase 16 not approved
```

## P9H5 evidence

```text
Final head: 2dd3926cd3e02ded472ef20ab1090b86d13675d4
Merge: d7d20a4874fb44afc2abe6cf2384951d26bd4804
Workflow: 28293856405
Artifact: history-ui-h5-responsive / 7925847144
Digest: sha256:5d6f0d7a38dd58f19b270b9ab9ea0de331f3f0aaaa3bb66ef6d4caae4211d854
```

P9H5 establishes deterministic skip-link entry, stable chart keyboard inspection, pointer/touch day selection, required-width wrapping, 44px general and 48px archive/publishing targets, reduced motion, increased contrast, and forced-colors acceptance. It adds no History request seam and preserves provider, API, storage, archive, and output contracts.

## Phase 9 sequence

```text
P9H0  work-history-ui-h0-baseline          complete PR #430
P9H1  work-history-ui-h1-metric            complete PR #434
P9H2  work-history-ui-h2-chart             complete PR #436
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        complete PR #447
P9H6  work-history-ui-h6-candidate         exact next after explicit continuation; not created
P9H7  work-history-ui-h7-acceptance        queued
```

Phase 16 begins only after one candidate is separately approved with its own specification and branch sequence.

P9H5 is complete and canonically closed through PR #448. Do not create `work-history-ui-h6-candidate` before explicit continuation is received.