# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-27

Read the development policy, documentation governance, current roadmap, current schedule, complete program plan, affected specification, implementation plan, working note, and evidence records before changing the repository.

## Current execution state

```text
Phase 6  Local Watchlist v1                              complete PR #425
P9H0     deterministic History baseline                  complete PR #430
P9H1     metric execution repair                         complete PR #434
P9H2     chart interpretation repair                     complete PR #436
P9H2     canonical closeout                              complete PR #437
P9H3     work-history-ui-h3-overview                       complete PR #439
P9H3     canonical closeout                                complete PR #440
Active implementation branch                              none
P9H4     work-history-ui-h4-tasks                          exact next; not created
```

Historical gate strings, not current state:

```text
P9H3     work-history-ui-h3-overview                       active
Active implementation branch                              work-history-ui-h3-overview
P9H4     work-history-ui-h4-tasks                          exact next; not created
Active implementation branch                              none
P9H3     work-history-ui-h3-overview                       exact next; not created
P9H2 active on work-history-ui-h2-chart
P9H2     work-history-ui-h2-chart                          exact next; not created
```

## Permanent evidence

Local Watchlist records remain in `product/local-watchlist-spec.md`, `product/watchlist-v1-implementation-plan.md`, and `operations/watchlist-production-acceptance-2026-06-25.md`.

P9H3 completed through PR #439 and was canonically closed through PR #440.

```text
Final head: 2cdd780787d06ab951e68b7cbca031089ab5312e
Workflow run: 28280486736
Artifact: history-ui-h3-overview / 7921680615
Digest: sha256:33e6c4fa3deeaab4a12394b768371dde06409ebf6d899f230110948fb63defee
Merge: 38e21f910d303f391a988121ff562f53a6a426b7
```

P9H3 keeps the complete desktop analysis while shortening the mobile default flow to Summary, coverage status, chart, and Selected day. Secondary analysis remains available through explicit controls without additional History requests.

Relevant files:

- `../apps/web/src/live/history-overview-p9h3.ts`
- `../apps/web/src/history-overview-p9h3.css`
- `../apps/web/scripts/history-ui-h3-overview-browser.mjs`
- `../scripts/verify-history-ui-h3-overview.mjs`
- `../.github/workflows/history-ui-h3-overview.yml`

Approved future authorities remain the cross-site quality plans and localization plans. P9H3 is complete and canonically closed through PR #440. `work-history-ui-h4-tasks` must not be created before explicit continuation is received.
