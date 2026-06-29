# ViewLoom agent instructions

Read before changing the repository:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/operations/development-policy-addendum.md`
3. `docs/operations/documentation-governance.md`
4. `docs/README.md`
5. `docs/product/current-roadmap.md`
6. `docs/product/current-schedule.md`
7. `docs/product/post-watchlist-program-plan.md`
8. affected specifications, implementation plans, working notes, and evidence records

Do not start from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs. Use `work-*` for ordinary development and `preview-*` only for deliberate runtime validation. Only latest-head evidence counts.

Current state:

```text
Local Watchlist v1 complete through PR #425
Phase 8 complete through PR #428
Phase 9 History P1 repair complete
P9H7 production acceptance complete through PR #451
P9H7 canonical closeout complete through PR #453
Phase 10 U10A quality baseline complete through PR #454
U10A canonical closeout complete through PR #455
Phase 10 U10B shared shell complete through PR #456
U10B canonical closeout complete through PR #457
Active implementation branch: none
Exact next implementation branch: work-quality-u10c-visualization
U10C branch created: no
```

Permanent U10B authority: `docs/audits/cross-site-quality-u10b-shared-shell.json`.

Keep Twitch and Kick routes, APIs, storage, rankings, exports, locales, and coverage claims separated. Do not start U10C or Phase 11–16 without explicit continuation. No Phase 16 feature is approved. After every merge, issue the full merge report and stop.
