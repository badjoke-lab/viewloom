# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 2.8
Created: 2026-06-25
Last updated: 2026-06-27
Current phase: Phase 9 — P9H4A Overview balance
Current implementation branch: `work-history-ui-h4a-overview-balance`
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed metric synchronization: PR #434
Completed chart interpretation: PR #436
Completed P9H2 canonical closeout: PR #437
Completed Overview hierarchy: PR #439
Completed P9H3 canonical closeout: PR #440
Exact next implementation branch after merge and explicit continuation: `work-history-ui-h4b-tasks`

P9H4 was split after production screenshots exposed a section-crossing sticky card, oversized desktop Calendar, compressed ranking table, and remaining mobile density problems. P9H4A repairs Overview balance first. P9H4B then repairs Archives and Report & Export.

Historical gate strings, not current state:

```text
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
P9H4A     active
P9H4B–P9H7 queued
Phase 10–15 queued
Phase 16 not approved
```

## P9H3 evidence

```text
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

P9H3 keeps the complete desktop Overview, shortens the mobile default path, and exposes comparison, calendar, rankings/changes, and detailed coverage through explicit controls. It preserves the accepted metric, request, provider, state, and output contracts.

## Phase 9 sequence

```text
P9H0  work-history-ui-h0-baseline          complete PR #430
P9H1  work-history-ui-h1-metric            complete PR #434
P9H2  work-history-ui-h2-chart             complete PR #436
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H5  work-history-ui-h5-responsive        queued
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

## P9H4A contract

P9H4A must:

- make `Key changes` a normal-flow card and prove it never intersects later sections;
- reduce the desktop Calendar from square-cell dominance to bounded low cells while retaining UTC, intensity, state symbols, keyboard, pointer, and touch selection;
- keep ranking controls compact and protect the table as the primary ranking surface;
- use four primary Summary cards and move coverage quality/counts into the coverage status band;
- reduce partial/unavailable comparison to a concise result-first explanation;
- improve mobile chart height, Selected day density, and More analysis descriptions;
- add permanent browser geometry gates at 1440, 1280, 1024, 820, 390, and 360 where appropriate;
- make no API, D1, collector, cron, retention, binding, provider, or output-schema change.

P9H4B repairs Archives and publishing hierarchy. P9H5 repairs required widths and accessibility. P9H6–P9H7 perform candidate and production acceptance.

Phase 16 begins only after one candidate is separately approved with its own specification and branch sequence.

P9H4A is active. Do not create `work-history-ui-h4b-tasks` before P9H4A merges, canonical closeout is complete, and explicit continuation is received.