# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-27

## Current position

```text
Phase 7 source reset                     complete PR #426
Phase 8 inventory/browser audit          complete PR #428
P9H0 History baseline                    complete PR #430
P9H0 documentation closeout              complete PR #432
Final-state correction                   complete PR #433
P9H1 History metric synchronization      complete PR #434
P9H2 History chart interpretation        complete PR #436
P9H2 canonical closeout                  complete PR #437
P9H3 History Overview hierarchy          complete PR #439
P9H3 canonical closeout                  complete PR #440
P9H4A Overview balance                   active
Active implementation branch             work-history-ui-h4a-overview-balance
Exact next branch                        work-history-ui-h4b-tasks
P9H4B branch created                     no
Phase 10 cross-site quality              queued
Phase 11 engineering/operations lock     queued
Phase 12 English release readiness       queued
Phase 13 English/Japanese localization   queued
Phase 14 Spanish/pt-BR and launch        queued
Phase 15 next-feature audit              queued
Phase 16 major feature                   not approved
```

P9H4A was inserted after production screenshots confirmed that the desktop `Key changes` sticky card crossed section boundaries, the desktop calendar dominated the page, ranking width was compressed, and mobile chart/secondary-analysis density still needed repair. P9H4B retains the previously approved Archives and Report & Export scope.

## Historical execution snapshots

These exact strings are retained for permanent gates and are not current state.

```text
Active implementation branch             none
Exact next branch                        work-history-ui-h4-tasks
P9H4 branch created                      no

P9H3 History Overview hierarchy          active
Active implementation branch             work-history-ui-h3-overview
Exact next branch                        work-history-ui-h4-tasks
P9H4 branch created                      no

Active implementation branch             none
Exact next branch                        work-history-ui-h3-overview
P9H3 branch created                      no

P9H2 History chart interpretation        active
Active implementation branch             work-history-ui-h2-chart
Exact next branch                        work-history-ui-h3-overview
P9H3 branch created                      no

P9H1 History metric synchronization      complete PR #434
Active implementation branch             none
Exact next branch                        work-history-ui-h2-chart
P9H2 branch created                      no
```

## Accepted evidence

```text
PR: #434
Workflow run: 28232602651
Artifact ID: 7903212809

PR: #436
Final head: ccba4d4c29dd1442a684e35bafba23d392410365
Merge commit: 4afba32749bb5098cc99fbabe897543791ec72fa
Workflow run: 28278497196
Artifact ID: 7921020539

PR: #439
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge commit: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow run: 28280486736
Artifact: history-ui-h3-overview
Artifact ID: 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

P9H3 keeps full desktop analysis and shortens the mobile default path to Summary, coverage status, chart, and Selected day. Compare periods, Calendar, Rankings & changes, and detailed Coverage remain available through explicit secondary controls without another History request.

## Immediate sequence

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

## P9H4A acceptance scope

- remove sticky/fixed behavior from `Key changes` and prevent overlap with later sections;
- cap the desktop calendar height and remove square-cell dominance;
- protect ranking-table width and stack `Key changes` below the table at narrower desktop widths;
- reduce Summary to four primary metric cards and move coverage quality into the coverage status band;
- compact partial/unavailable comparison presentation;
- improve mobile chart height, Selected day density, and explanatory secondary-analysis controls;
- preserve metric synchronization, no-refetch secondary switching, URL state, outputs, provider separation, APIs, D1, collectors, cron, retention, and bindings.

## Stop rule

P9H4A is active on `work-history-ui-h4a-overview-balance`. Do not create `work-history-ui-h4b-tasks` before P9H4A merges, its canonical closeout is complete, and explicit continuation is received.