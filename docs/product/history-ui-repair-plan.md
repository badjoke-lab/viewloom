# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.3
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
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4b-tasks`

P9H4 is split. P9H4A completed the Overview layout and visual hierarchy repair. P9H4B retains Archives and Report & Export.

Historical gate strings, not current state:

```text
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

PR #441 repaired the production-screenshot defects while preserving the accepted History controller and data contracts.

Accepted behavior:

- `Key changes` is normal-flow and never intersects detailed Coverage;
- desktop Calendar cells are bounded to low rows rather than square cards;
- ranking width is protected and the insight card stacks below at narrower widths;
- four primary Summary facts are followed by a full-width coverage status band;
- partial/unavailable comparison omits empty metric tiles;
- mobile chart height, Selected day density, and More analysis descriptions are improved;
- Twitch and Kick use one correct provider request per scenario;
- P9H4A adds no competing History observer or request seam.

```text
Final head: 9cbaed979394232ceee5efc6c95954385eb230fa
Merge: 0201ff8464a568e5d6aebd1b3d179bcde93a17e7
Workflow: 28283570437
Artifact: history-ui-h4a-overview-balance / 7922730563
Digest: sha256:62bd0bd1c991cdc87286aa62d28668c961cac987eebaf606db5512469e968aac
```

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h4a-overview-browser.mjs
scripts/verify-history-ui-h4a-overview.mjs
.github/workflows/history-ui-h4a-overview.yml
```

Accepted widths:

```text
1440px
1280px
1024px
820px
390px
360px
```

## Remaining sequence

```text
P9H3  work-history-ui-h3-overview          complete PR #439
P9H4A work-history-ui-h4a-overview-balance complete PR #441
P9H4B work-history-ui-h4b-tasks            exact next after explicit continuation; not created
P9H5  work-history-ui-h5-responsive        queued
P9H6  work-history-ui-h6-candidate         queued
P9H7  work-history-ui-h7-acceptance        queued
```

P9H4B covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

P9H4A is complete and canonically closed through PR #442. Do not create `work-history-ui-h4b-tasks` before explicit continuation is received.