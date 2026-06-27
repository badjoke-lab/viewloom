# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-27

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
P9H5 Responsive and accessibility        active
Active implementation branch             work-history-ui-h5-responsive
Exact next branch                        work-history-ui-h6-candidate
P9H6 branch created                      no
```

P9H5 validates and repairs the complete History experience at 1440px, 820px, 390px, and 360px, including keyboard, touch, focus, target sizing, forced-colors, reduced-motion, overflow, and the retained production/local first-focus discrepancy.

## Historical gate strings

```text
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
```

## Accepted P9H4B evidence

```text
PR: #443
Final head: 93195f3e79f1edf7c95cd1150c94b41582c50c29
Merge commit: e28a6db311129fafe8cd1069ffe4ab240ba2b8bf
Workflow run: 28289223184
Artifact: history-ui-h4b-tasks
Artifact ID: 7924451682
Digest: sha256:f07200e1d5966dda3093788778d845fa2f8e2cc2ddf8fb4d939dba7c9992662f
```

Accepted scenarios: Twitch 1440 desktop, Kick 820 tablet, Kick 390 mobile, and Twitch 360 mobile. Each used one correct provider request. Direct links, task/archive switching, Back/Forward, and share preview issued no additional History request. State/source resolved to `Partial · Real observed data`.

## P9H5 acceptance scope

- no page-level horizontal overflow at 1440, 820, 390, or 360;
- semantic control order and readable chart/Selected day at every required width;
- keyboard, pointer, and touch day inspection;
- keyboard-accessible period, metric, task, archive, and day state;
- visible focus and non-color-only selection/state meaning;
- general targets at least 44px and publishing/management targets at least 48px;
- wrapped long text and URLs;
- usable reduced-motion, increased-contrast, and forced-colors modes;
- exact evidence for the initial keyboard focus target.

## Sequence

```text
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        active
P9H6  work-history-ui-h6-candidate         exact next after merge and explicit continuation; not created
P9H7  work-history-ui-h7-acceptance        queued
```

Do not create `work-history-ui-h6-candidate` before P9H5 merges, canonical closeout is complete, and explicit continuation is received.