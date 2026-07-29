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
Twitch Heatmap public category-filter exposure unauthorized
```

## Current work order

1. Build and verify the dormant read-only #659 audit package.
2. Add bounded read-only accumulation checkpoints.
3. Start Heatmap Canvas responsibility separation.
4. Add a hidden/disabled Canvas scene without production cutover.
5. Address #148 Day Flow/Battle Lines provider parity after the audit package is ready.
6. Execute #659 only at or after the accepted boundary.
7. Use a later separate PR for public category-filter cutover.

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
- Do not expose the hidden Twitch category filter before #659 is accepted and a separate cutover PR passes.
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

For web changes, also run the affected build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates.

PR validation jobs must not require production credentials. Production credentials belong only in an already-accepted bounded execution workflow.
