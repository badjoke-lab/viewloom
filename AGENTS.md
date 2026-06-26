# ViewLoom agent instructions

Before changing this repository, read these files in order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/operations/development-policy-addendum.md`
3. `docs/operations/documentation-governance.md`
4. `docs/README.md`
5. `docs/product/current-roadmap.md`
6. `docs/product/current-schedule.md`
7. `docs/product/post-watchlist-program-plan.md`
8. the affected accepted baseline specification
9. the affected active/future permanent specification
10. the affected implementation plan
11. any active note under `docs/work-in-progress/`
12. relevant audit and acceptance records

Non-negotiable rules:

1. Do not start from chat memory, screenshots, an old PR, or a previously read version of a document alone.
2. Confirm that the current roadmap and schedule place the exact branch next.
3. Compare the schedule with actual branches/PRs and update governing documents first when state, scope, behavior, order, or acceptance criteria changed.
4. Reread the revised authorities at the beginning of every later branch.
5. Use `work-*` branches for ordinary development.
6. Keep Cloudflare Preview off during implementation.
7. Group related changes into logical commits; when tools force multiple file commits, use `[CF-Pages-Skip]` where appropriate and squash merge.
8. Run targeted checks while iterating and full required CI/browser/artifact review only on the completed latest candidate HEAD.
9. Use `preview-*` only when deployable Cloudflare runtime validation is required.
10. Merge to `main` only after completed-candidate gates pass.
11. Do not report a feature as deployed or visually complete until production deployment, smoke checks, and required visual acceptance are verified.
12. Keep Twitch and Kick data, rankings, storage, exports, routes, and coverage claims separated in every locale.
13. Update the active working note as material decisions change.
14. At milestone completion, transfer stable decisions to permanent docs and delete the completed temporary note.
15. Do not start Phase 10–16 work before its documented entry condition and explicit continuation.

Current execution is Phase 9 P9H0 on `work-history-ui-h0-baseline`. The exact next branch after merge reporting and explicit continuation is `work-history-ui-h1-metric`.

The policy, index, roadmap, schedule, program plan, affected permanent specification, implementation plan, active working note, and audit evidence are the execution context. This file is only the mandatory entry point.