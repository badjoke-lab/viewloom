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
Dormant replacement audit package accepted PR #661 / acceptance PR #662
Runner repair accepted PR #663 / acceptance PR #664
Current branch work-659-twitch-replacement-audit-checkpoint-package
Twitch Heatmap public category-filter exposure unauthorized
```

## Current work order

1. Create and verify `work-659-twitch-replacement-audit-checkpoint-package`.
2. Accept checkpoint execution separately before any production read-only run.
3. Freeze sanitized checkpoint evidence as diagnostic only.
4. Start Heatmap Canvas responsibility separation after checkpoint-package priority is secured.
5. Add a hidden/disabled Canvas scene after module-split acceptance.
6. Address #148 Day Flow/Battle Lines provider parity.
7. Execute #659 final mode only at or after the accepted boundary.
8. Use a later separate PR for public category-filter cutover.

## Change classification

Every change must declare one primary responsibility:

- documentation/contract;
- read-only audit or checkpoint package;
- implementation/refactor package;
- one-time production trigger;
- evidence acceptance/freeze;
- retirement/cleanup;
- unrelated product work.

Do not combine package implementation, production execution, and acceptance in one PR.

## Current boundaries

- Preserve both provider-specific permanent category configurations and five-minute cadences.
- Do not mutate Kick from Twitch-only work.
- Do not change D1 schema, backfill, retention, or provider identity rules.
- The accepted runner repair performed no production credentials, Cloudflare/D1 execution, or runtime change.
- Do not expose the hidden Twitch category filter before #659 is accepted and a separate cutover PR passes.
- Checkpoint mode never accepts #659 or authorizes public UI.
- Heatmap Canvas work changes renderer/interaction only unless a later explicit contract authorizes more.
- Existing unfiltered Heatmap remains the fallback.

## Branch and merge policy

- No direct push to `main`.
- Use `work-*` for normal implementation and documentation.
- Use one PR per responsibility.
- Keep scope allowlists explicit.
- Only the latest candidate HEAD is authoritative.
- Use a Preview branch only when real Cloudflare runtime validation is necessary.
- Freeze sanitized evidence on `main` before advancing a gate.

## Required validation

Run workstream-specific checks. For governance and category changes, run at minimum:

```bash
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

For checkpoint-package work, also run:

```bash
node scripts/verify-12a5-twitch-replacement-seven-day-audit-runner-repair.mjs
node scripts/test-12a5-twitch-replacement-seven-day-audit.mjs
```

For web changes, also run affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.

PR validation jobs must not require production credentials. Production credentials belong only in an already-accepted bounded execution workflow.
