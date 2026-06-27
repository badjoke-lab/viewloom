# TEMPORARY — ViewLoom History UI repair working note

Status: active
Created: 2026-06-25
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed closeout: PR #432
Completed final-state correction: PR #433
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Completed P9H3: PR #439
Completed P9H3 canonical closeout: PR #440
Completed P9H4A: PR #441
Completed P9H4A canonical closeout: PR #442
Completed P9H4B: PR #443
Completed P9H4B canonical closeout: PR #444
Completed P9H5: PR #447
Completed P9H5 canonical closeout: PR #448
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h6-candidate`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

Historical gate strings, not current state:

```text
P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`
P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`
Current implementation branch: `work-history-ui-h4a-overview-balance`
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H4A canonical closeout active
Current implementation branch: `work-history-ui-h4a-closeout`
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`
P9H4 work-history-ui-h4-tasks            exact next after explicit continuation; not created
Current implementation branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview         active
P9H4 work-history-ui-h4-tasks            exact next after P9H3 merge and explicit continuation; not created
Current implementation branch: none
P9H3 work-history-ui-h3-overview         exact next after explicit continuation; not created
Current implementation branch: `work-history-ui-h2-chart`
P9H2 work-history-ui-h2-chart            active
Current implementation branch: none
P9H2 work-history-ui-h2-chart            exact next after explicit continuation; not created
```

## Historical P9H1 evidence

```text
Workflow run: 28232602651
Artifact ID: 7903212809
```

## P9H2 completion

```text
Workflow run: 28278497196
Artifact ID: 7921020539
```

Historical P9H2 implementation owners retained for permanent acceptance:

```text
history-chart-p9h2.ts               SVG semantics, roving day navigation, exact inspection
history-usability.ts                API coverageState preservation, including in-progress
history-ui-h2-chart-browser.mjs     Twitch desktop and Kick touch-mobile acceptance
```

## P9H3 completion

```text
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge commit: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow run: 28280486736
Artifact: history-ui-h3-overview
Artifact ID: 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

Accepted P9H3 behavior remains protected by its permanent gate.

## P9H4A completion

```text
Final head: 9cbaed979394232ceee5efc6c95954385eb230fa
Merge commit: 0201ff8464a568e5d6aebd1b3d179bcde93a17e7
Workflow run: 28283570437
Artifact: history-ui-h4a-overview-balance
Artifact ID: 7922730563
Digest: sha256:62bd0bd1c991cdc87286aa62d28668c961cac987eebaf606db5512469e968aac
Accepted widths: 1440, 1280, 1024, 820, 390, 360
```

## P9H4B completion

```text
Final head: 93195f3e79f1edf7c95cd1150c94b41582c50c29
Merge commit: e28a6db311129fafe8cd1069ffe4ab240ba2b8bf
Workflow run: 28289223184
Artifact: history-ui-h4b-tasks
Artifact ID: 7924451682
Digest: sha256:f07200e1d5966dda3093788778d845fa2f8e2cc2ddf8fb4d939dba7c9992662f
Accepted widths: 1440, 820, 390, 360
```

## P9H5 completion

PR #447 completed the required-width responsive and accessibility repair:

- deterministic first keyboard entry uses the History skip link;
- the chart keyboard target remains operable across redraws;
- desktop keyboard and mobile touch day inspection are accepted;
- every required width has zero page-level horizontal overflow;
- general controls meet 44px and archive/publishing controls meet 48px;
- long text wraps and mobile controls remain semantic;
- reduced-motion, increased-contrast, and forced-colors modes remain usable;
- one correct provider request is used per scenario;
- task switching does not refetch History;
- report, post, PNG, CSV, and JSON contracts remain unchanged.

```text
Final head: 2dd3926cd3e02ded472ef20ab1090b86d13675d4
Merge commit: d7d20a4874fb44afc2abe6cf2384951d26bd4804
Workflow run: 28293856405
Artifact: history-ui-h5-responsive
Artifact ID: 7925847144
Digest: sha256:5d6f0d7a38dd58f19b270b9ab9ea0de331f3f0aaaa3bb66ef6d4caae4211d854
Accepted widths: 1440, 820, 390, 360
```

The previous production/local initial-focus discrepancy is resolved by the deterministic skip-link path and remains a permanent acceptance assertion.

## Current sequence

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

P9H5 is complete and canonically closed through PR #448. Do not create `work-history-ui-h6-candidate` before explicit continuation is received.