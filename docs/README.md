# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-27

Read the development policy, documentation governance, roadmap, schedule, program plan, affected specifications, implementation plan, working note, and evidence before changing the repository.

## Current execution state

```text
Phase 6  Local Watchlist v1                              complete PR #425
P9H0 complete PR #430
P9H0 documentation closeout complete PR #432
Final-state correction complete PR #433
P9H1     metric execution repair                         complete PR #434
P9H2 complete PR #436
P9H2 canonical closeout complete PR #437
P9H3     work-history-ui-h3-overview                     complete PR #439
P9H3 canonical closeout complete PR #440
P9H4A    work-history-ui-h4a-overview-balance            active
Active implementation branch                            work-history-ui-h4a-overview-balance
P9H4B    work-history-ui-h4b-tasks                       exact next after merge; not created
```

Historical gate strings, not current state:

```text
P9H1 completed through PR #434
Active implementation branch                              none
P9H4     work-history-ui-h4-tasks                          exact next; not created
P9H3     work-history-ui-h3-overview                       active
Active implementation branch                              work-history-ui-h3-overview
P9H4     work-history-ui-h4-tasks                          exact next; not created
Active implementation branch                              none
P9H3     work-history-ui-h3-overview                       exact next; not created
P9H2 active on work-history-ui-h2-chart
P9H2     work-history-ui-h2-chart                          exact next; not created
```

## Local Watchlist permanent evidence

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`
- `../apps/web/docs/watchlist-latest-w2a-contract.md`
- `../apps/web/docs/watchlist-history-w2b-contract.md`

P9H3 keeps the complete desktop analysis and shortens the mobile default flow. Permanent acceptance is owned by the P9H3 browser script, verifier, and workflow.

P9H4A is the active Overview-balance repair. It removes the sticky `Key changes` collision, bounds the desktop Calendar, protects ranking width, separates coverage from primary Summary metrics, compacts withheld comparison, and improves mobile density. Permanent evidence is owned by the P9H4A browser script, verifier, and workflow.

Do not create `work-history-ui-h4b-tasks` before P9H4A merges, its canonical closeout is complete, and explicit continuation is received.