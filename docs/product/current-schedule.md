# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-28

## Current position

```text
Phase 8 inventory/browser audit          complete PR #428
P9H0 History baseline                    complete PR #430
P9H1 History metric synchronization      complete PR #434
P9H2 History chart interpretation        complete PR #436
P9H2 canonical closeout                  complete PR #437
P9H3 History Overview hierarchy          complete PR #439
P9H3 canonical closeout                  complete PR #440
P9H4A Overview balance                   complete PR #441
P9H4A canonical closeout                 complete PR #442
P9H4B Archives and publishing hierarchy  complete PR #443
P9H4B canonical closeout                 complete PR #444
P9H5 Responsive and accessibility        complete PR #447
P9H5 canonical closeout                  complete PR #448
P9H6 Local candidate                     active
Active implementation branch             work-history-ui-h6-candidate
Exact next branch                        work-history-ui-h7-acceptance
P9H7 branch created                      no
```

P9H6 creates one deterministic local History candidate from the current build. It reruns the accepted metric, chart, Overview, task/archive, publishing, responsive, keyboard, touch, and forced-mode gates against one exact HEAD and publishes a machine-readable candidate manifest plus screenshots and logs.

## Historical gate strings

```text
P9H5 Responsive and accessibility        active
Active implementation branch             work-history-ui-h5-responsive
Exact next branch                        work-history-ui-h6-candidate
P9H6 branch created                      no
P9H5 canonical closeout                  active
Active implementation branch             work-history-ui-h5-closeout
P9H5 Responsive and accessibility        complete PR #447
P9H5 canonical closeout                  complete PR #448
Active implementation branch             none
Exact next branch                        work-history-ui-h6-candidate
P9H6 branch created                      no
PR: #439
P9H4B Archives and publishing hierarchy  active
Active implementation branch             work-history-ui-h4b-tasks
Exact next branch                        work-history-ui-h5-responsive
P9H5 branch created                      no
P9H4B canonical closeout                 active
Active implementation branch             work-history-ui-h4b-closeout
P9H4B Archives and publishing hierarchy  complete PR #443
P9H4B canonical closeout                 complete PR #444
Active implementation branch             none
Exact next branch                        work-history-ui-h5-responsive
P9H5 branch created                      no
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

## Retained History evidence

```text
PR: #434
Workflow run: 28232602651
Artifact ID: 7903212809

PR: #436
Workflow run: 28278497196
Artifact ID: 7921020539

PR: #439
Workflow run: 28280486736
Artifact ID: 7921680615

PR: #441
Workflow run: 28283570437
Artifact ID: 7922730563

PR: #443
Workflow run: 28289223184
Artifact ID: 7924451682
```

## Accepted P9H5 evidence

```text
PR: #447
Final head: 2dd3926cd3e02ded472ef20ab1090b86d13675d4
Merge commit: d7d20a4874fb44afc2abe6cf2384951d26bd4804
Workflow run: 28293856405
Artifact: history-ui-h5-responsive
Artifact ID: 7925847144
Digest: sha256:5d6f0d7a38dd58f19b270b9ab9ea0de331f3f0aaaa3bb66ef6d4caae4211d854
```

## P9H6 acceptance scope

- build and typecheck once from the exact candidate HEAD;
- run P9H1, P9H2, P9H3, P9H4A, P9H4B, and P9H5 browser acceptance against that one local preview;
- preserve Twitch/Kick endpoint separation in every evidence file;
- verify required evidence schemas, phase labels, result states, scenario counts, and candidate HEAD identity;
- preserve direct links, Back/Forward, no-refetch task/archive switching, metric execution, output context, required widths, keyboard, touch, focus, reduced motion, and forced colors;
- emit one `viewloom-history-ui-h6-candidate-v1` manifest with per-phase evidence digests;
- upload all screenshots, evidence JSON, manifest, and preview log as one candidate artifact;
- make no API, D1, collector, cron, retention, binding, provider, archive, metric, or output-schema change.

## Sequence

```text
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        complete PR #447
P9H6  work-history-ui-h6-candidate         active
P9H7  work-history-ui-h7-acceptance        exact next after P9H6 merge and canonical closeout; not created
```

Do not create `work-history-ui-h7-acceptance` before P9H6 merges, canonical closeout is complete, and explicit continuation is received.