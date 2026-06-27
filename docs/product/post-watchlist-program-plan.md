# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.9
Created: 2026-06-25
Last updated: 2026-06-27
Current phase: Phase 9 — P9H4A complete; P9H4B next
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
Exact next implementation branch after explicit continuation: `work-history-ui-h4b-tasks`

P9H4 was split after production screenshots exposed a section-crossing sticky card, oversized desktop Calendar, compressed ranking table, and remaining mobile density problems. P9H4A repaired Overview balance. P9H4B repairs Archives and Report & Export.

Historical gate strings, not current state:

```text
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
P9H4B–P9H7 queued
Phase 10–15 queued
Phase 16 not approved
```

## P9H4A evidence

```text
Final head: 9cbaed979394232ceee5efc6c95954385eb230fa
Merge: 0201ff8464a568e5d6aebd1b3d179bcde93a17e7
Workflow: 28283570437
Artifact: history-ui-h4a-overview-balance / 7922730563
Digest: sha256:62bd0bd1c991cdc87286aa62d28668c961cac987eebaf606db5512469e968aac
```

P9H4A keeps `Key changes` in normal flow, bounds Calendar geometry, protects ranking width, separates four primary Summary facts from the coverage band, compacts withheld comparison, and improves mobile density. It adds no competing History observer or request seam and preserves provider, API, storage, and output contracts.

## Phase 9 sequence

```text
P9H0  work-history-ui-h0-baseline          complete PR #430
P9H1  work-history-ui-h1-metric            complete PR #434
P9H2  work-history-ui-h2-chart             complete PR #436
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created
P9H5  work-history-ui-h5-responsive        queued
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

P9H4B repairs Archives and publishing hierarchy. P9H5 repairs required widths and accessibility. P9H6–P9H7 perform candidate and production acceptance.

Phase 16 begins only after one candidate is separately approved with its own specification and branch sequence.

P9H4A is complete and canonically closed through PR #442. Do not create `work-history-ui-h4b-tasks` before explicit continuation is received.