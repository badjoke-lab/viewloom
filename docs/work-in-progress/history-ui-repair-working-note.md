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
Current implementation branch: `work-history-ui-h4a-overview-balance`
Exact next branch after merge and explicit continuation: `work-history-ui-h4b-tasks`
Delete when: P9H7 production acceptance and permanent-document transfer are complete.

Historical gate strings, not current state:

```text
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

Accepted behavior:

- desktop retains the complete Overview analysis;
- mobile defaults to Summary, coverage status, chart, and Selected day;
- comparison, calendar, rankings/changes, and detailed coverage use explicit controls;
- only one secondary mobile analysis is open at a time;
- secondary analysis reuses the loaded response;
- Twitch and Kick remain separate;
- report, share, PNG, CSV, and JSON formats remain.

The compact mobile task-flow defect is resolved. The production/local keyboard discrepancy remains assigned to P9H5 and final acceptance.

## Active P9H4A findings

Production screenshots supplied on 2026-06-27 establish the following latest defects:

```text
H4A-1  Key changes sticky card crosses into later section space on desktop
H4A-2  Calendar square cells make the supporting calendar dominate the full page
H4A-3  Ranking table is compressed by a persistent low-information right column
H4A-4  Five-card Summary gives coverage the wrong visual role
H4A-5  Withheld comparison keeps empty metric-card volume
H4A-6  Mobile chart remains tight and tooltip-heavy
H4A-7  Mobile Selected day and More analysis need denser, clearer presentation
```

Approved repair:

- remove sticky/fixed positioning from `Key changes`;
- pair ranking and insight only at wide desktop widths and stack at narrower desktop/tablet widths;
- cap calendar cells to low fixed/clamped rows and remove desktop square aspect ratio;
- reduce Summary to four primary facts and add coverage state to the coverage band;
- compact withheld comparison;
- increase mobile chart height, keep only the first three selected-day streamers, and use compact metric/action layout;
- add descriptions and disclosure indicators to mobile More analysis buttons;
- add geometry and request-count acceptance at 1440, 1280, 1024, 820, 390, and 360;
- preserve provider separation, one request per uncached provider/period/metric state, no-refetch secondary analysis, URL state, output schemas, API, D1, collector, cron, retention, and bindings.

## Current sequence

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

Do not create `work-history-ui-h4b-tasks` before P9H4A merges, its canonical closeout is complete, and explicit continuation is received.