# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-29

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
P9H6 Local candidate                     complete PR #449
P9H6 canonical closeout                  complete PR #450
P9H7 Hosted and production acceptance    complete PR #451
P9H7 canonical closeout                  complete PR #453
Phase 9 History P1 repair                complete
Active implementation branch             none
Exact next branch                        work-quality-u10a-baseline
U10A branch created                      no
```

History Phase 9 is accepted against the exact production commit `233a35ebe219c6be42723eb749e2bcc84ae7fc09`. Permanent evidence is owned by `docs/operations/history-production-acceptance-2026-06-28.md`.

## Exact next window

```text
U10A work-quality-u10a-baseline
Purpose: defect and ownership baseline
Entry condition: Phase 9 closeout merged and explicit continuation received
Product repair: prohibited except proven P0 isolation
Required output: classified defect ledger, owner map, missing/failing assertions or fixtures, temporary Phase 10 working note
```

## Historical gate strings

The following strings are retained only for earlier phase-specific verifiers and are not current execution state.

```text
Active implementation branch             none
Exact next branch                        work-history-ui-h7-acceptance
P9H7 branch created                      no
P9H6 Local candidate                     active
Active implementation branch             work-history-ui-h6-candidate
P9H6 canonical closeout                  active
Active implementation branch             work-history-ui-h6-closeout
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
PR: #447
Workflow run: 28293856405
Artifact ID: 7925847144
```

## Accepted P9H6 evidence

```text
PR: #449
Final head: c7d54e530053b29091b84e651b78b679f55f3a8a
Merge commit: d46e2f3d04c9528e6493d9aa3d436000e340272a
Workflow run: 28308389704
Artifact: history-ui-h6-candidate
Artifact ID: 7930159988
Digest: sha256:658ad6332313b024119cb68541f2702c0f3af3451247e0ba57fbea917db7b292
Manifest: viewloom-history-ui-h6-candidate-v1
Phases: 6
Scenarios: 21
Providers: Kick and Twitch, separated
```

## Accepted P9H7 evidence

```text
Implementation PR: #451
Closeout PR: #453
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Pre-merge production workflow: 28325492470
Pre-merge artifact: 7935573120
Post-merge production workflow: 28325951638
Post-merge artifact: 7935706617
1440 / 820 / 390 / 360
Forced colors: pass
Provider separation: pass
Real Viewer-minutes and Peak viewers: pass
```

## Sequence

```text
P9H5  work-history-ui-h5-responsive        complete PR #447
P9H6  work-history-ui-h6-candidate         complete PR #449
P9H7  work-history-ui-h7-acceptance        complete PR #451
Phase 9 canonical closeout                 complete PR #453
U10A   work-quality-u10a-baseline          exact next; not created
```

After every merge, update canonical documents, issue the full merge report, name the next branch, and stop until explicit continuation.