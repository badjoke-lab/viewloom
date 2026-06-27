# ViewLoom History UI repair implementation plan

Status: active implementation subplan
Version: 2.1
Last updated: 2026-06-27
Roadmap phase: Phase 9 — History P1 repair
Completed P9H0: PR #430
Completed P9H1: PR #434
Completed P9H2: PR #436
Completed P9H2 canonical closeout: PR #437
Completed P9H3: PR #439
Completed P9H3 canonical closeout: PR #440
Current implementation branch: none
Exact next branch after explicit continuation: `work-history-ui-h4-tasks`

Historical gate strings, not current state:

```text
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

Accepted results:

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

Permanent acceptance files:

```text
apps/web/scripts/history-ui-h3-overview-browser.mjs
scripts/verify-history-ui-h3-overview.mjs
.github/workflows/history-ui-h3-overview.yml
```

## Remaining sequence

```text
P9H3 work-history-ui-h3-overview   complete PR #439
P9H4 work-history-ui-h4-tasks      exact next after explicit continuation; not created
P9H5 work-history-ui-h5-responsive queued
P9H6 work-history-ui-h6-candidate  queued
P9H7 work-history-ui-h7-acceptance queued
```

P9H4 covers Archives and publishing hierarchy. P9H5 covers required widths and accessibility. P9H6–P9H7 cover local candidate and production acceptance.

P9H3 is complete and canonically closed through PR #440. Do not create `work-history-ui-h4-tasks` before explicit continuation is received.
