# Contributing to ViewLoom

## Required documents

Before changing the repository, read:

- `docs/operations/development-and-deployment-policy.md`;
- `docs/operations/development-policy-addendum.md`;
- `docs/operations/documentation-governance.md`;
- `docs/README.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- `docs/product/post-watchlist-program-plan.md`;
- the affected accepted baseline specification;
- the affected active/future permanent specification;
- the affected implementation plan;
- any active note under `docs/work-in-progress/`;
- relevant audit and acceptance records.

Do not begin from chat memory, screenshots, an old pull request, or a previously read stale document alone. Compare the current schedule with actual branches/PRs. When required behavior, priority, order, or acceptance criteria changed, update governing documents before implementation.

Every later branch rereads the revised authorities before changing code.

## Current scheduled work

```text
Current phase: Phase 9 — History P1 repair
Current window: P9H0
Current branch: work-history-ui-h0-baseline
Exact next after merge report and explicit continuation: work-history-ui-h1-metric
```

Phase 10–16 work must not begin before the entry condition and explicit continuation recorded in the current schedule and affected implementation plan.

## Standard workflow

```text
canonical docs
  -> compare actual branch/PR state
  -> confirm phase, window, branch, entry condition
  -> work-* branch
  -> documentation-first alignment when required
  -> targeted iteration checks
  -> update active working note as decisions change
  -> completed candidate
  -> full required CI, browser gates, and artifact review
  -> optional preview-* branch when Cloudflare runtime validation is necessary
  -> merge to main
  -> production deployment verification
  -> production smoke and visual acceptance
  -> permanent documentation finalization
  -> delete completed temporary working notes
  -> full merge report and stop
```

## Branches

- `work-*`: ordinary development. Do not intentionally trigger Cloudflare Preview.
- `preview-*`: completed candidate only. Use for deliberate Cloudflare runtime validation.
- `main`: production branch.

No later branch is created before the predecessor merge report and explicit continuation.

## Commits

Group related changes into logical commits. Do not use one-file-per-commit as the normal workflow.

When an editing tool forces multiple branch commits:

- use `[CF-Pages-Skip]` when the change must not deploy;
- keep each commit internally valid where practical;
- state the tool limitation in the PR;
- squash merge so `main` receives one logical change.

## Checks

During implementation, run focused checks for the affected code. Before merge, run the complete required checks on the latest candidate HEAD. Old CI results from superseded commits do not count.

Layout or responsive changes require screenshot artifact review in addition to automated browser assertions. Documentation changes that alter the active schedule must update and run `scripts/verify-development-policy.mjs`.

## Pull requests

Every implementation PR must state:

```text
Roadmap phase:
Schedule window:
Program plan:
Permanent specification:
Implementation plan:
Active working note, if any:
Predecessor merge/continuation:
Exact next branch after merge:
```

Also state whether the change affects:

- Twitch;
- Kick;
- provider separation;
- databases or bindings;
- collectors or cron;
- retention;
- output schemas;
- Cloudflare deployment behavior;
- layout/responsive/accessibility behavior;
- localization routes/catalogs/SEO;
- temporary-note lifecycle or permanent documentation.

## Completion

Do not state that a change is live, deployed, complete, or visually accepted merely because the PR merged.

Completion requires the applicable combination of:

- final candidate CI;
- browser gates;
- screenshot artifact review;
- deliberate Preview verification;
- exact production deployment identity;
- production smoke checks;
- manual visual acceptance;
- permanent documentation update;
- deletion of completed temporary working notes;
- full merge report and exact next-branch handoff.