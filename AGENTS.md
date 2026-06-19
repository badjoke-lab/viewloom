# ViewLoom agent instructions

Before changing this repository, read `docs/operations/development-and-deployment-policy.md`.

Non-negotiable rules:

1. Use `work-*` branches for ordinary development.
2. Keep Cloudflare Preview deployments off during implementation.
3. Group related file changes into logical commits; do not use one-file-per-commit as a normal workflow.
4. Run targeted checks while iterating and the full required CI set only on the completed candidate HEAD.
5. Use `preview-*` only when a deployable preview is actually required.
6. Merge to `main` only after the completed candidate passes its required gates.
7. Do not report a feature as deployed until the production deployment and smoke checks are verified.
8. Keep Twitch and Kick data, rankings, storage, and coverage claims separated.

The policy document is the source of truth. This file is only the mandatory entry point.