# Contributing to ViewLoom

## Required reading and freshness rule

Before creating a branch, fetch current `main` and read:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/product/current-roadmap.md`
4. `docs/product/current-schedule.md`
5. `docs/audits/12a2-current-gate-state.json`
6. the affected feature specification and implementation plan
7. the active work-in-progress record
8. `docs/operations/development-and-deployment-policy.md`

Reread the same current documents before marking a PR ready or merging it. Do not use a cached summary when repository documents have changed. If the documents disagree with the repository or each other, repair the source-of-truth documents before implementation continues.

Every PR must record the Current-main SHA that was read and the governing documents used.

## Current state

```text
Phase 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate viewloom-12a2-current-gate-state-v33
Twitch permanent category capture active
Kick permanent category capture active
Replacement stability start 2026-07-29T05:30:00.000Z
Earliest replacement audit 2026-08-05T05:30:00.000Z
Replacement audit issue #659
Dormant runner package accepted PR #661 / #662
Runner repair accepted PR #663 / #664
Checkpoint package accepted PR #665 / #666
Current branch work-659-twitch-replacement-audit-checkpoint-trigger
Twitch Heatmap public category-filter exposure unauthorized
```

## Current work order

1. Add the exact one-file checkpoint trigger on `work-659-twitch-replacement-audit-checkpoint-trigger`.
2. Validate package PR #665 and merge SHA `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a` identity.
3. Merge the trigger only after validation; production checkpoint execution occurs only on main push.
4. Freeze sanitized checkpoint evidence and exact run/job/artifact/digest identities.
5. Retire the trigger and temporary execution path after evidence freeze.
6. Start Heatmap Canvas responsibility separation after checkpoint priority is secured.
7. Address #148 provider parity.
8. Execute #659 final mode only at or after the accepted boundary.
9. Use a later separate PR for public category-filter cutover.

## Change classification

Every change must declare one primary responsibility:

- documentation/contract;
- read-only audit or checkpoint package;
- implementation/refactor package;
- one-time production trigger;
- evidence acceptance/freeze;
- retirement/cleanup;
- unrelated product work.

Do not combine package implementation, production execution, evidence acceptance, and retirement in one PR.

## Current boundaries

- Preserve both provider-specific permanent category configurations and five-minute cadences.
- Do not mutate Kick from Twitch-only work.
- Do not change D1 schema, backfill, retention, provider identity, or cross-provider rules.
- The accepted checkpoint package is checkpoint-only, Cloudflare GET, and D1 SELECT/WITH.
- Trigger PRs add only the exact trigger file and do not execute production before merge.
- Do not expose the hidden Twitch category filter before #659 final acceptance and a separate cutover PR.
- Checkpoint mode never accepts #659, guarantees final acceptance, authorizes mutation, or authorizes public UI.
- Existing unfiltered Heatmap remains the fallback.

## Branch and merge policy

- No direct push to `main`.
- Use `work-*` for normal implementation and documentation.
- Use one PR per responsibility.
- Keep scope allowlists explicit.
- Only the latest candidate HEAD is authoritative.
- Freeze sanitized evidence on `main` before advancing a gate.

## Required validation

For checkpoint/category governance work, run:

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-package.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
node scripts/test-12a5-twitch-replacement-seven-day-audit.mjs
```

For web changes, also run affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.

PR validation jobs must not use production credentials. Production credentials belong only in an already-accepted bounded execution workflow whose job is blocked on a validated main-push trigger.
