# Contributing to ViewLoom

Read `docs/operations/development-and-deployment-policy.md` before changing the repository.

## Standard workflow

```text
main
  -> work-* branch
  -> targeted iteration checks
  -> completed candidate
  -> full required CI and browser gates
  -> optional preview-* branch when Cloudflare runtime validation is necessary
  -> merge to main
  -> production deployment verification
  -> production smoke checks
```

## Branches

- `work-*`: ordinary development. Do not intentionally trigger Cloudflare Preview.
- `preview-*`: completed candidate only. Use for one deliberate Cloudflare Preview validation.
- `main`: production branch.

## Commits

Group related changes into logical commits. Do not use one-file-per-commit as the normal workflow.

When an editing tool forces multiple branch commits:

- use `[CF-Pages-Skip]` when the change must not deploy;
- keep each commit internally valid where practical;
- squash merge the PR so `main` receives one logical change.

## Checks

During implementation, run focused checks for the affected code. Before merge, run the complete required checks on the latest candidate HEAD. Old CI results from superseded commits do not count.

## Pull requests

Complete the repository PR checklist. State whether the change affects:

- Twitch;
- Kick;
- provider separation;
- databases or bindings;
- collectors or cron;
- retention;
- Cloudflare deployment behavior.

Do not state that a change is live merely because the PR merged. Production deployment and smoke checks are separate steps.
