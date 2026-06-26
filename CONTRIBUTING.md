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
- the affected specifications, plan, working note, and acceptance records.

Do not begin from chat memory, screenshots, an old PR, or a stale document. Compare the current schedule with actual branches and PRs before implementation.

## Current state

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

P9H2 must not be created before explicit continuation.

## Standard workflow

```text
canonical documents
  -> compare repository state
  -> confirm branch and entry condition
  -> work-* branch
  -> targeted checks
  -> update working note
  -> final evidence review
  -> optional preview-* validation
  -> merge to main
  -> update permanent documents
  -> full report and stop
```

## Branches

- `work-*`: ordinary development.
- `preview-*`: completed candidate for deliberate runtime validation.
- `main`: production branch.

Connector-created multi-commit work must be squash merged.

## Pull requests

Every PR states the roadmap phase, schedule window, governing plans, working note, predecessor, exact next branch, provider impact, data/storage impact, output impact, Cloudflare impact, layout/accessibility impact, localization impact, and temporary-note impact.