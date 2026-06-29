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

Do not start from chat memory, screenshots, an old PR, or a stale document. Compare the schedule with actual branches and PRs, confirm explicit continuation, and update governing documents before implementation when state or acceptance changed.

Use `work-*` for ordinary development and `preview-*` only for deliberate Cloudflare validation. Only latest-head evidence counts. Keep Twitch and Kick routes, APIs, storage, rankings, exports, locales, and coverage claims separated.

Current state:

```text
Local Watchlist v1 complete through PR #425
Phase 8 complete through PR #428
P9H0–P9H6 complete through PR #449
P9H7 production acceptance complete through PR #451
P9H7 canonical closeout complete through PR #453
Phase 9 History P1 repair complete
Active implementation branch: none
Exact next implementation branch: work-quality-u10a-baseline
U10A branch created: no
```

Permanent History evidence:

```text
docs/operations/history-production-acceptance-2026-06-28.md
Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09
Post-merge workflow/artifact: 28325951638 / 7935706617
```

Phase 10 U10A is the exact next work after explicit continuation. It is a defect and ownership baseline: reproduce and classify known non-History defects, add failing gates or explicit fixtures, identify authoritative and legacy owners, and create the temporary Phase 10 working note. Do not repair beyond proven P0 isolation in U10A.

Do not start Phase 11–16 in parallel. No Phase 16 feature is approved. After every merge, issue the full merge report and stop.
