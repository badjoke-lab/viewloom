# Contributing to ViewLoom

## Required documents

Before changing the repository, read:

- `docs/operations/development-and-deployment-policy.md`;
- `docs/operations/development-policy-addendum.md`;
- `docs/operations/documentation-governance.md`;
- `docs/README.md`;
- `docs/product/current-roadmap.md`;
- `docs/product/current-schedule.md`;
- the affected feature specification and implementation plan;
- any active note under `docs/work-in-progress/`.

Do not begin from chat memory, screenshots, or an old pull request alone. When required behavior or priority changed, update the governing documents before implementation.

## Standard workflow

```text
canonical docs
  -> confirm roadmap phase and schedule window
  -> work-* branch
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
```

## Branches

- `work-*`: ordinary development. Do not intentionally trigger Cloudflare Preview.
- `preview-*`: completed candidate only. Use for deliberate Cloudflare runtime validation.
- `main`: production branch.

## Commits

Group related changes into logical commits. Do not use one-file-per-commit as the normal workflow.

When an editing tool forces multiple branch commits:

- use `[CF-Pages-Skip]` when the change must not deploy;
- keep each commit internally valid where practical;
- squash merge the PR so `main` receives one logical change.

## Checks

During implementation, run focused checks for the affected code. Before merge, run the complete required checks on the latest candidate HEAD. Old CI results from superseded commits do not count.

Layout or responsive changes require screenshot artifact review in addition to automated browser assertions.

## Pull requests

Every implementation PR must state:

```text
Roadmap phase:
Schedule window:
Permanent specification:
Implementation plan:
Active working note, if any:
```

Also state whether the change affects:

- Twitch;
- Kick;
- provider separation;
- databases or bindings;
- collectors or cron;
- retention;
- Cloudflare deployment behavior;
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
- deletion of completed temporary working notes.
