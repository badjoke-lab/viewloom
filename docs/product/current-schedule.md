# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-27

## Current position

```text
P9H0 History baseline                    complete PR #430
P9H1 History metric synchronization      complete PR #434
P9H2 History chart interpretation        complete PR #436
P9H2 canonical closeout                  complete PR #437
P9H3 History Overview hierarchy          complete PR #439
P9H3 canonical closeout                  complete PR #440
P9H4A Overview balance                   complete PR #441
P9H4A canonical closeout                 complete PR #442
P9H4B Archives and publishing hierarchy  active
Active implementation branch             work-history-ui-h4b-tasks
Exact next branch                        work-history-ui-h5-responsive
P9H5 branch created                      no
```

P9H4B repairs Archives and Report & Export hierarchy. It preserves Back/Forward, direct links, no-refetch task/archive switching, provider separation, and output formats.

## Historical gate strings

```text
Active implementation branch             none
Exact next branch                        work-history-ui-h4b-tasks
P9H4B branch created                     no
P9H4A Overview balance                   active
Active implementation branch             work-history-ui-h4a-overview-balance
Exact next branch                        work-history-ui-h4b-tasks
P9H4B branch created                     no
P9H4A canonical closeout                 active
Active implementation branch             work-history-ui-h4a-closeout
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

## Retained evidence

```text
Workflow run: 28232602651
Workflow run: 28278497196
PR: #439
Workflow run: 28280486736
Artifact ID: 7921680615
Workflow run: 28283570437
Artifact ID: 7922730563
```

## P9H4B acceptance

- compact purpose and scope for Archives;
- clear Daily, Peaks, and Battles hierarchy;
- non-sticky archive controls;
- dense scan-friendly archive cards;
- explicit Current view, Copy, Share image, and Data download groups;
- provider, period, metric, observed scope, state/source, and limitation language;
- Back/Forward and direct-link restoration;
- no History refetch while switching tasks or archive subviews;
- unchanged report, post, PNG, CSV, and JSON contracts.

## Sequence

```text
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            active
P9H5  work-history-ui-h5-responsive        exact next after merge and explicit continuation; not created
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

Do not create `work-history-ui-h5-responsive` before P9H4B merges, canonical closeout is complete, and explicit continuation is received.