# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-06-28

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
P9H4A    work-history-ui-h4a-overview-balance            complete PR #441
P9H4A canonical closeout complete PR #442
P9H4B    work-history-ui-h4b-tasks                       complete PR #443
P9H4B canonical closeout complete PR #444
P9H5     work-history-ui-h5-responsive                   complete PR #447
P9H5 canonical closeout complete PR #448
P9H6     work-history-ui-h6-candidate                    complete PR #449
P9H6 canonical closeout complete PR #450
P9H7     work-history-ui-h7-acceptance                   active
Active implementation branch                            work-history-ui-h7-acceptance
Preview branch                                          preview-history-ui-h7-acceptance
```

Historical gate strings, not current state:

```text
Active implementation branch                            none
P9H7     work-history-ui-h7-acceptance                   exact next; not created
P9H6     work-history-ui-h6-candidate                    active
Active implementation branch                            work-history-ui-h6-candidate
P9H6 canonical closeout active
Active implementation branch                            work-history-ui-h6-closeout
P9H1 completed through PR #434
P9H3     work-history-ui-h3-overview                       complete PR #439
P9H4A    work-history-ui-h4a-overview-balance            active
Active implementation branch                            work-history-ui-h4a-overview-balance
P9H4B    work-history-ui-h4b-tasks                       exact next after merge; not created
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

## Permanent evidence owners

- Local Watchlist: `product/local-watchlist-spec.md`, `product/watchlist-v1-implementation-plan.md`, and `operations/watchlist-production-acceptance-2026-06-25.md`.
- P9H3: its browser script, verifier, and workflow.
- P9H4A: its browser script, verifier, and workflow.
- P9H4B: its browser script, verifier, and workflow.
- P9H5: `apps/web/scripts/history-ui-h5-responsive-browser.mjs`, `scripts/verify-history-ui-h5-responsive.mjs`, and `.github/workflows/history-ui-h5-responsive.yml`.
- P9H6: `apps/web/scripts/history-ui-h6-candidate-manifest.mjs`, `scripts/verify-history-ui-h6-candidate.mjs`, and `.github/workflows/history-ui-h6-candidate.yml`.
- Active P9H7: `apps/web/scripts/history-ui-h7-hosted-acceptance.mjs`, `scripts/verify-history-ui-h7-evidence.mjs`, `scripts/verify-history-ui-h7-acceptance.mjs`, `.github/workflows/history-ui-h7-acceptance.yml`, and `work-in-progress/p9h7-acceptance.md`.

P9H7 is acceptance-only. Phase 10 remains blocked until exact Preview and production evidence are transferred to a permanent record and both temporary History repair notes are deleted.
