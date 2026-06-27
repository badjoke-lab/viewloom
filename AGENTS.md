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
Active implementation branch: none
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
```

Historical gate evidence, not current state:

```text
P9H4B active on work-history-ui-h4b-tasks
Active implementation branch: work-history-ui-h4b-tasks
Exact next implementation branch: work-history-ui-h5-responsive
P9H5 branch created: no
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

Do not create `work-history-ui-h5-responsive` before explicit continuation. Do not start Phase 10–16 before its documented entry condition. After every merge, issue the full merge report and stop.