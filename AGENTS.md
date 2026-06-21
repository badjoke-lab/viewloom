# ViewLoom agent instructions

Before changing this repository, read these files in order:

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/operations/development-policy-addendum.md`
3. `docs/operations/documentation-governance.md`
4. `docs/README.md`
5. `docs/product/current-roadmap.md`
6. `docs/product/current-schedule.md`
7. the affected permanent specification and implementation plan
8. any active note under `docs/work-in-progress/`

Non-negotiable rules:

1. Do not start from chat memory, screenshots, or an old PR alone.
2. Confirm that the roadmap and schedule place the work next.
3. Update governing docs before implementation when scope, behavior, order, or acceptance criteria changed.
4. Use `work-*` branches for ordinary development.
5. Keep Cloudflare Preview deployments off during implementation.
6. Group related changes into logical commits; do not use one-file-per-commit as the normal workflow.
7. Run targeted checks while iterating and the full required CI/browser/artifact review only on the completed candidate HEAD.
8. Use `preview-*` only when deployable Cloudflare runtime validation is required.
9. Merge to `main` only after the completed candidate passes required gates.
10. Do not report a feature as deployed or visually complete until production deployment, smoke checks, and required visual acceptance are verified.
11. Keep Twitch and Kick data, rankings, storage, exports, routes, and coverage claims separated.
12. Update active working notes as decisions change.
13. At milestone completion, transfer stable decisions to permanent docs and delete the completed temporary note.

The policy, current addendum, documentation index, roadmap, schedule, permanent specification, implementation plan, and active working note are the execution context. This file is only the mandatory entry point.
