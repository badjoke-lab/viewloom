# ViewLoom development and deployment policy

Status: source of truth

This document defines how ViewLoom changes are developed, verified, previewed, merged, deployed, and reported. It applies to human contributors, AI agents, scripts, and future automation.

## 1. Goals

The workflow must satisfy all of the following:

- keep development speed high;
- avoid unnecessary Cloudflare Pages builds;
- avoid duplicated or obsolete GitHub Actions runs;
- preserve complete final verification;
- keep production deployment deliberate and observable;
- prevent unfinished work from being reported as complete or deployed.

The strategy is to reduce repeated deployment and verification work, not to reduce implementation speed or final quality.

## 2. Source-of-truth hierarchy

1. This document is the canonical operating policy.
2. `AGENTS.md` is the mandatory short entry point for automated contributors.
3. `CONTRIBUTING.md` is the human-facing execution guide.
4. `.github/pull_request_template.md` records compliance for each pull request.
5. `scripts/verify-development-policy.mjs` verifies the repository-side policy contract.

When duplicated wording conflicts, this document wins.

## 3. Branch classes

### `work-*`

Use for normal implementation, repair, refactoring, tests, and documentation.

Rules:

- Cloudflare Preview must not be required or intentionally triggered.
- Targeted checks may run during iteration.
- Full browser and full repository gates are reserved for the completed candidate HEAD unless a failure requires earlier diagnosis.
- A work branch is not a public release candidate.

Examples:

```text
work-369
work-history-battle-archive
work-heatmap-repair
```

### `preview-*`

Use only when a deployable Cloudflare Preview is necessary for final public-runtime validation.

Rules:

- Create it from an already completed and locally/CI-verified candidate HEAD.
- Do not continue ordinary development on the preview branch.
- Prefer one Preview deployment per candidate.
- If the candidate changes materially, return to the work branch, complete the change, and produce a new final preview candidate.

Examples:

```text
preview-369
preview-history-battle-archive
```

### `main`

`main` is the production branch.

Rules:

- Merge only completed candidates.
- A merge may trigger the production deployment.
- Production status must be verified separately from GitHub merge status.
- A merged PR is not automatically a verified production release.

## 4. Commit policy

The normal unit is one logical change, not one file.

Required behavior:

- group related implementation, tests, styles, contracts, and docs into coherent commits;
- avoid one-file-per-commit development;
- avoid pushing incomplete intermediate states solely to move files between tools;
- use Git tree/commit operations or local batching when available;
- when tool limitations force multiple branch commits, use `[CF-Pages-Skip]` where appropriate and squash merge the PR so `main` receives one logical commit;
- never use `[CF-Pages-Skip]` to hide a production change that must deploy.

## 5. Verification stages

### Stage A: iteration checks

Run the smallest checks that can detect errors in the current change.

Typical checks:

- typecheck for the affected package;
- focused contract test;
- affected unit or data-shape test;
- affected build target;
- one focused browser reproduction when diagnosing a browser-only failure.

Do not repeatedly run every browser suite after every small edit.

### Stage B: completed candidate checks

Before the candidate is considered ready, run all required checks for the affected feature and shared contracts.

This includes, where applicable:

- full web typecheck;
- production build;
- shared provider separation and coverage contracts;
- feature contract checks;
- deep-link checks;
- desktop and mobile browser gates;
- regression checks for shared shells or middleware.

Only the latest candidate HEAD is authoritative. Superseded results do not count.

### Stage C: optional Preview validation

Use a `preview-*` branch only when final behavior cannot be validated adequately through local preview and CI fixtures.

Preview validation may include:

- real Cloudflare Pages runtime behavior;
- Functions routing and bindings;
- real retained data rendering;
- headers, redirects, and canonical URLs;
- desktop and mobile smoke checks.

### Stage D: production verification

After merging to `main`:

- confirm the production deployment completed;
- confirm the expected commit is deployed;
- run the relevant public API and UI smoke checks;
- verify desktop and mobile behavior when the change affects responsive UI;
- report deployment as complete only after these checks pass.

## 6. GitHub Actions concurrency

Pull-request workflows that can be superseded must use:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

Purpose:

- stop obsolete runs when a new commit reaches the same PR;
- avoid wasting runner time on a candidate that can no longer be merged;
- keep only the newest candidate result authoritative.

A workflow may use a more specific concurrency group when necessary, but it must preserve same-PR cancellation unless there is a documented reason not to.

## 7. Cloudflare Pages repository policy

Required dashboard configuration:

```text
Production branch: main
Automatic production deployment: enabled
Preview branch include rule: preview-*
Preview branch exclude rule: work-*
```

Recommended build watch includes:

```text
apps/web/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
shared packages or configuration required by the web build
```

Recommended ignored changes:

```text
docs/**
planning-only files
mock/reference images not consumed by the build
internal audit notes
```

The exact watch paths must match the current build graph. Do not exclude a file that changes the generated site.

Dashboard settings are external state and cannot be proven by repository content alone. Record the latest manual verification below.

### Cloudflare settings verification record

```text
Last verified: pending
Verified by: pending
Production branch main: pending
work-* excluded from Preview: pending
preview-* included for Preview: pending
Build watch paths reviewed: pending
```

These fields must not be marked complete without checking the Cloudflare dashboard.

## 8. Pull request policy

Each PR must state:

- what changed;
- what did not change;
- affected providers and storage paths;
- whether DB, collector, cron, retention, or bindings changed;
- targeted checks run;
- final candidate checks run;
- whether Preview was required;
- whether production verification is still pending.

Feature work and operating-policy work should remain separate unless one cannot function without the other.

## 9. Deployment and completion language

Use precise states:

```text
implemented on branch
PR opened
CI passing
merged to main
production deployment detected
production smoke checks passing
```

Do not collapse these into one claim.

Forbidden before verification:

```text
live
fully deployed
production complete
publicly fixed
```

A feature can be merged but not yet deployed. A deployment can complete but still fail smoke checks.

## 10. Provider separation remains mandatory

Workflow optimization must never weaken ViewLoom's data rules.

- Twitch and Kick remain separate.
- No combined rankings or totals are introduced.
- Provider-specific database access remains isolated.
- Coverage remains bounded and explicitly non-provider-wide.
- Final checks must include affected provider-separation contracts.

## 11. Exception handling

An exception is allowed only when documented in the PR.

The exception record must include:

- rule being bypassed;
- reason;
- expected cost or risk;
- compensating verification;
- whether the exception is temporary;
- follow-up required.

Urgency alone is not enough to silently bypass the policy.

## 12. Standard execution sequence

```text
1. Read this policy.
2. Create a work-* branch from current main.
3. Implement in logical batches.
4. Run targeted iteration checks.
5. Complete the candidate.
6. Run required final CI/browser gates on the latest HEAD.
7. Create preview-* only when Cloudflare runtime validation is necessary.
8. Merge to main using the repository's selected merge method.
9. Verify production deployment and smoke checks.
10. Report the exact final state.
```

## 13. Current transition rule

Existing branches created before this policy may continue, but before merge they must:

- incorporate the current `main` policy commit;
- use the final-candidate verification sequence;
- avoid additional unnecessary Preview deployments;
- state any tool-forced multi-commit history and use squash merge when appropriate.
