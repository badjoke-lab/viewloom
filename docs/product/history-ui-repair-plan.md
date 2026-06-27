# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.5
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
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

P9H5 completed the required-width responsive and accessibility repair. P9H6–P9H7 remain candidate and production acceptance.

Historical gate strings, not current state:

```text
Version: 2.4
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h5-responsive`
P9H5 work-history-ui-h5-responsive        exact next after explicit continuation; not created

P9H5 active
Current implementation branch: `work-history-ui-h5-responsive`
P9H5 canonical closeout active
Current implementation branch: `work-history-ui-h5-closeout`

Version: 2.3
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4b-tasks`
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created
P9H4B active
Current implementation branch: `work-history-ui-h4b-tasks`
P9H4B canonical closeout active
Current implementation branch: `work-history-ui-h4b-closeout`

Version: 2.2
Current implementation branch: `work-history-ui-h4a-overview-balance`
P9H4A work-history-ui-h4a-overview-balance active
P9H4B work-history-ui-h4b-tasks            next after P9H4A merge and explicit continuation; not created
P9H4A canonical closeout active
Current implementation branch: `work-history-ui-h4a-closeout`

Version: 2.1
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created

Version: 2.0
Current implementation branch: `work-history-ui-h3-overview`
P9H3 work-history-ui-h3-overview   active
P9H4 work-history-ui-h4-tasks      exact next after P9H3 merge and explicit continuation; not created

Version: 1.9
Current implementation branch: none
P9H3 work-history-ui-h3-overview   exact next after explicit continuation; not created

Version: 1.8
Current implementation branch: `work-history-ui-h2-chart`
Exact next branch: `work-history-ui-h3-overview`
P9H2 work-history-ui-h2-chart      active

Version: 1.7
Current implementation branch: none
P9H2 work-history-ui-h2-chart      exact next; not created
```

## Completed P9H3

PR #439 repaired Overview order and compactness while preserving P9H1 metric behavior and P9H2 chart/day-inspection behavior.

Accepted behavior:

- desktop retains the complete Overview analysis;
- mobile defaults to Summary, coverage status, chart, and Selected day;
- comparison, calendar, rankings/changes, and detailed coverage use explicit secondary controls;
- only one secondary mobile analysis is open at a time;
- opening secondary analysis makes no additional History request;
- Twitch and Kick routes and outputs remain separate.

```text
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
Workflow: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
```

## Completed P9H4A — Overview balance

PR #441 repaired production-screenshot defects while preserving the accepted History controller and data contracts.

```text
Final head: 9cbaed979394232ceee5efc6c95954385eb230fa
Merge: 0201ff8464a568e5d6aebd1b3d179bcde93a17e7
Workflow: 28283570437
Artifact: history-ui-h4a-overview-balance / 7922730563
Digest: sha256:62bd0bd1c991cdc87286aa62d28668c961cac987eebaf606db5512469e968aac
Accepted widths: 1440, 1280, 1024, 820, 390, 360
```

## Completed P9H4B — Archives and publishing hierarchy

PR #443 repaired Archives and Report & Export hierarchy while preserving direct links, Back/Forward, one provider request, and all output formats.

```text
Final head: 93195f3e79f1edf7c95cd1150c94b41582c50c29
Merge: e28a6db311129fafe8cd1069ffe4ab240ba2b8bf
Workflow: 28289223184
Artifact: history-ui-h4b-tasks / 7924451682
Digest: sha256:f07200e1d5966dda3093788778d845fa2f8e2cc2ddf8fb4d939dba7c9992662f
Accepted widths: 1440, 820, 390, 360
```

## Completed P9H5 — Responsive and accessibility

PR #447 established deterministic keyboard entry, stable chart keyboard inspection across redraws, touch day selection, required-width control wrapping, 44px general targets, 48px archive/publishing targets, long-text wrapping, reduced-motion behavior, increased contrast, and forced-colors acceptance.

Accepted behavior:

- Twitch 1440 and Kick 820 support keyboard entry, task/archive controls, and chart day inspection;
- Kick 390 and Twitch 360 support touch day inspection without page-level horizontal overflow;
- Twitch 390 forced mode verifies reduced motion and forced colors;
- one correct provider request is used per scenario;
- task switching does not refetch History;
- selected-day state remains exposed through `aria-current`;
- report, post, PNG, CSV, and JSON contracts remain unchanged.

```text
Final head: 2dd3926cd3e02ded472ef20ab1090b86d13675d4
Merge: d7d20a4874fb44afc2abe6cf2384951d26bd4804
Workflow: 28293856405
Artifact: history-ui-h5-responsive / 7925847144
Digest: sha256:5d6f0d7a38dd58f19b270b9ab9ea0de331f3f0aaaa3bb66ef6d4caae4211d854
Accepted widths: 1440, 820, 390, 360
```

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h5-responsive-browser.mjs
apps/web/scripts/history-ui-h5-responsive-runner.mjs
scripts/verify-history-ui-h5-responsive.mjs
.github/workflows/history-ui-h5-responsive.yml
```

## Remaining sequence

```text
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            complete PR #443
P9H5  work-history-ui-h5-responsive        complete PR #447
P9H6  work-history-ui-h6-candidate         exact next after explicit continuation; not created
P9H7  work-history-ui-h7-acceptance        queued
```

P9H5 is complete and canonically closed through PR #448. Do not create `work-history-ui-h6-candidate` before explicit continuation is received.