# ViewLoom development and deployment policy

Status: source of truth

This document defines how ViewLoom changes are developed, verified, previewed, merged, deployed, and reported. It applies to human contributors, AI agents, scripts, and automation.

## 1. Goals

The workflow must:

- keep development speed high;
- keep source-of-truth documents current;
- avoid unnecessary Cloudflare Pages builds;
- avoid obsolete GitHub Actions work;
- preserve complete final verification;
- keep production deployment deliberate and observable;
- prevent unfinished work from being reported as complete or deployed;
- preserve provider separation and data truth.

## 2. Source-of-truth hierarchy

1. This policy is the canonical operating policy.
2. `AGENTS.md` is the mandatory automated-contributor entry point.
3. `docs/README.md` is the current documentation map.
4. `docs/product/current-roadmap.md`, `docs/product/current-schedule.md`, and `docs/audits/12a2-current-gate-state.json` define current position and authorization.
5. The affected feature specification and implementation plan define intended behavior.
6. The active WIP defines the current bounded execution sequence.
7. `CONTRIBUTING.md` and `.github/pull_request_template.md` enforce the workflow.
8. Verification scripts enforce repository-side contracts.

When duplicated wording conflicts, the current roadmap, schedule, canonical gate, affected live specification, active WIP, and this policy must be reconciled before implementation proceeds. Historical evidence does not override current authorization.

## 3. Mandatory freshness protocol

Before creating a branch:

1. fetch current `main`;
2. record the current-main SHA;
3. read `AGENTS.md` and `docs/README.md`;
4. read current roadmap, current schedule, canonical gate, affected specification/plan, active WIP, and relevant evidence;
5. compare the proposed work with the exact next branch, entry conditions, and stop rules.

Before marking a PR ready or merging:

1. fetch current `main` again;
2. reread the same current documents;
3. confirm no newer source-of-truth change supersedes the candidate;
4. update documentation first if the repository state or plan changed;
5. record the SHA and documents in the PR.

Cached chat summaries, old handoffs, branch-local historical copies, and memory are not authorization.

## 4. Branch classes

### `work-*`

Use for implementation, repair, refactoring, tests, audits, checkpoints, and documentation.

- Cloudflare Preview must not be intentionally triggered unless required.
- Run targeted checks during iteration.
- Reserve complete browser/repository gates for the latest completed candidate.
- A work branch is not a public release candidate.

### `preview-*`

Use only when a deployable Cloudflare Preview is necessary for final runtime validation.

- Create from a completed, verified candidate.
- Do not continue ordinary development on the preview branch.
- Prefer one Preview deployment per candidate.
- Material changes return to the work branch.

### `main`

`main` is production.

- Merge only completed candidates.
- A merge may trigger production deployment.
- Verify production separately from GitHub merge status.
- A merged PR is not automatically a verified production release.

## 5. Commit policy

The unit is one logical change.

- Group related implementation, tests, contracts, styles, and docs.
- Avoid one-file-per-commit development.
- Avoid incomplete intermediate pushes used only to move files.
- When connector limits force multiple branch commits, squash merge the PR.
- Never use deployment-skip markers to hide a production change that must deploy.

## 6. Verification stages

### Stage A — iteration

Run the smallest checks that detect current errors: focused typecheck, contract, unit/data-shape, build target, or browser reproduction.

### Stage B — completed candidate

Run all required checks for the affected feature and shared contracts on the latest candidate HEAD, including as applicable:

- web typecheck and production build;
- provider separation and coverage;
- feature contract and deep links;
- desktop/mobile browser;
- keyboard/accessibility;
- fallback and data truth;
- shared shell/middleware regression.

Superseded results do not count.

### Stage C — optional Preview

Use only when local/CI validation cannot adequately prove Cloudflare runtime behavior, bindings, routing, retained data rendering, headers, or responsive smoke behavior.

### Stage D — production verification

After merge:

- confirm production deployment completed;
- confirm the expected commit deployed;
- run relevant public API/UI smoke checks;
- verify responsive behavior for UI changes;
- report production completion only after checks pass.

## 7. GitHub Actions concurrency

Supersedable pull-request workflows must use a same-PR concurrency group and `cancel-in-progress: true`, unless a documented execution contract requires otherwise.

## 8. Cloudflare Pages repository policy

```text
Production branch: main
Automatic production deployment: enabled
Preview branch include rule: preview-*
Preview branch exclude rule: work-*
```

Build watch paths must match the current build graph. Documentation and internal evidence should not trigger Pages unless consumed by the build. Dashboard state must be verified separately and never inferred from repository content.

## 9. Pull request policy

Each PR must state:

- what changed and why;
- current-main SHA read;
- current roadmap phase and schedule window;
- affected specification/plan and active WIP;
- exact entry condition and stop rule;
- provider/storage paths affected;
- whether DB, collector, cron, retention, backfill, bindings, public UI, or runtime changed;
- targeted and final checks;
- Preview requirement;
- production verification state;
- documentation updated or retired;
- exact next branch after merge.

Feature work and operating-policy work should remain separate unless one cannot function without the other.

## 10. Deployment and completion language

Use exact states:

```text
implemented on branch
PR opened
CI passing
merged to main
production deployment detected
production smoke checks passing
```

Do not claim `live`, `fully deployed`, `production complete`, or `publicly fixed` before corresponding verification.

## 11. Provider separation and data truth

- Twitch and Kick remain separate.
- Provider-specific database access remains isolated.
- No combined rankings, totals, or automatic category identity mapping.
- Coverage remains bounded and explicitly non-provider-wide.
- Missing, partial, stale, empty, error, demo, unknown, and unavailable states must not be collapsed into false real data.
- Final checks include affected provider-separation and data-truth contracts.

## 12. Exception handling

An exception must be documented in the PR with:

- rule bypassed;
- reason;
- cost/risk;
- compensating verification;
- temporary/permanent status;
- follow-up.

Urgency alone is not enough.

## 13. Standard execution sequence

```text
1. Fetch current main and record its SHA.
2. Read current roadmap, schedule, gate, affected specification/plan, active WIP, and this policy.
3. Repair stale/conflicting source-of-truth documents before implementation.
4. Create a work-* branch from current main.
5. Implement in logical batches.
6. Run targeted iteration checks.
7. Complete the candidate.
8. Fetch current main again and reread governing documents.
9. Run final CI/browser/data-truth gates on the latest HEAD.
10. Create preview-* only when runtime validation is necessary.
11. Merge using the repository-selected method.
12. Verify production deployment and smoke checks.
13. Report exact final state and exact next branch/stop rule.
```

## 14. Current transition rule

Existing branches may continue only if they incorporate the current policy state before merge, reread current authorities, use final-candidate verification, and document any tool-forced multi-commit history.
