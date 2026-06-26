# ViewLoom agent instructions

Read before changing the repository:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/operations/development-policy-addendum.md`
3. `docs/operations/documentation-governance.md`
4. `docs/README.md`
5. `docs/product/current-roadmap.md`
6. `docs/product/current-schedule.md`
7. `docs/product/post-watchlist-program-plan.md`
8. affected baseline specification
9. affected active/future specification
10. affected implementation plan
11. active working note
12. relevant audit and acceptance records

Do not start from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs. Confirm explicit continuation. Update governing documents before implementation when state, scope, order, or acceptance criteria changed.

Use `work-*` for ordinary development and `preview-*` only for deliberate Cloudflare validation of a completed candidate. Only latest-head evidence counts. Keep Twitch and Kick routes, APIs, storage, rankings, exports, locales, and coverage claims separated.

Current state:

```text
P9H0 complete through PR #430
P9H0 documentation closeout complete through PR #432
Final-state correction complete through PR #433
P9H1 complete through PR #434
P9H1 merge: 31b81d3ed3a56369055ba09eb4de871dfc59d315
Active implementation branch: none
Exact next implementation branch: work-history-ui-h2-chart
P9H2 branch created: no
```

Do not create P9H2 before explicit continuation. Do not start Phase 10–16 before its documented entry condition. After every merge, issue the full merge report and stop.