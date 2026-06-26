# Contributing to ViewLoom

## Required reading

Before changing the repository, read:

- `docs/operations/development-and-deployment-policy.md`;
- `docs/operations/development-policy-addendum.md`;
- `docs/operations/documentation-governance.md`;
- `docs/README.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- `docs/product/post-watchlist-program-plan.md`;
- the affected baseline specification;
- the affected active/future specification;
- the affected implementation plan;
- the active working note;
- relevant audit and acceptance records.

Do not begin from chat memory, screenshots, an old PR, or a stale document. Compare the current schedule with actual branches/PRs and update governing documents before implementation when state, scope, order, or acceptance criteria changed.

## Current state

```text
P9H0 complete through PR #430
P9H0 documentation closeout complete through PR #432
Active implementation branch: none
Exact next implementation branch: work-history-ui-h1-metric
P9H1 branch created: no
```

P9H1 must not be created before explicit continuation is received.

## Standard workflow

```text
canonical docs
  -> compare actual repository state
  -> confirm branch and entry condition
  -> work-* branch
  -> targeted checks
  -> update working note
  -> final candidate checks and artifact review
  -> optional preview-* validation
  -> merge to main
  -> production identity/smoke/visual acceptance where applicable
  -> permanent documentation update
  -> full merge report and stop
```

## Branches and commits

- `work-*`: ordinary development; no intentional Cloudflare Preview.
- `preview-*`: completed candidate only, for deliberate runtime validation.
- `main`: production branch.

Group related changes logically. When a connector forces multiple file commits, use `[CF-Pages-Skip]` where appropriate, explain the limitation, and squash merge.

## Pull requests

Every PR states:

```text
Roadmap phase
Schedule window
Program plan
Baseline specification
Active/future specification
Implementation plan
Working note
Predecessor merge and explicit continuation
Exact next branch after merge
```

Also state provider, DB/binding, collector/cron, retention, output-schema, Cloudflare, layout/accessibility, localization, and temporary-note impact.

## Completion

A merged PR is not automatically deployed or visually accepted. Completion uses the applicable combination of latest-head CI, browser gates, screenshot review, deliberate Preview, exact production deployment identity, production smoke, manual visual/localization acceptance, permanent documentation, and temporary-note cleanup.