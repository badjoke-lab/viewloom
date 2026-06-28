# ViewLoom agent instructions

Read before changing the repository:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/operations/development-policy-addendum.md`
3. `docs/operations/documentation-governance.md`
4. `docs/README.md`
5. `docs/product/current-roadmap.md`
6. `docs/product/current-schedule.md`
7. `docs/product/post-watchlist-program-plan.md`
8. affected specifications, implementation plan, working note, and evidence records

Do not start from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs, confirm explicit continuation, and update governing documents before implementation when state or acceptance changed.

Use `work-*` for ordinary development and `preview-*` only for deliberate Cloudflare validation. Only latest-head evidence counts. Keep Twitch and Kick routes, APIs, storage, rankings, exports, locales, and coverage claims separated.

Current state:

```text
P9H0 complete through PR #430
P9H0 documentation closeout complete through PR #432
Final-state correction complete through PR #433
P9H1 complete through PR #434
P9H2 complete through PR #436
P9H2 canonical closeout complete through PR #437
P9H3 complete through PR #439
P9H3 canonical closeout complete through PR #440
P9H4A complete through PR #441
P9H4A canonical closeout complete through PR #442
P9H4B complete through PR #443
P9H4B canonical closeout complete through PR #444
P9H5 complete through PR #447
P9H5 canonical closeout complete through PR #448
P9H6 complete through PR #449
P9H6 canonical closeout complete through PR #450
P9H7 active on work-history-ui-h7-acceptance
Active implementation branch: work-history-ui-h7-acceptance
Preview branch: preview-history-ui-h7-acceptance
```

Historical gate evidence, not current state:

```text
Active implementation branch: none
Exact next implementation branch: work-history-ui-h7-acceptance
P9H7 branch created: no
P9H6 active on work-history-ui-h6-candidate
Active implementation branch: work-history-ui-h6-candidate
P9H6 canonical closeout active
Active implementation branch: work-history-ui-h6-closeout
P9H5 active on work-history-ui-h5-responsive
Active implementation branch: work-history-ui-h5-responsive
Exact next implementation branch: work-history-ui-h6-candidate
P9H6 branch created: no
P9H4A active on work-history-ui-h4a-overview-balance
Active implementation branch: work-history-ui-h4a-overview-balance
Exact next implementation branch: work-history-ui-h4b-tasks
P9H4B branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
P9H3 active on work-history-ui-h3-overview
Active implementation branch: work-history-ui-h3-overview
Exact next implementation branch: work-history-ui-h4-tasks
P9H4 branch created: no
Active implementation branch: none
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
P9H2 active
Active implementation branch: work-history-ui-h2-chart
Exact next implementation branch: work-history-ui-h3-overview
P9H3 branch created: no
Active implementation branch: none
P9H2 branch created: no
```

P9H7 is acceptance-only. Do not start Phase 10–16 before P9H7 production acceptance, permanent evidence transfer, and temporary-note deletion are complete. After every merge, issue the full merge report and stop.
