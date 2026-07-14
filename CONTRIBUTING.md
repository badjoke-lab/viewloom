# Contributing to ViewLoom

## Required reading

Read these before changing production behavior:

1. `docs/README.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. the current contract and accepted evidence
6. `docs/operations/development-and-deployment-policy.md`

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source/storage/migration/disabled-runtime/preflight complete
Twitch and Kick category schemas complete and audited PR #545
Schema execution and recovery triggers retired
Current workstream 12A-4-5 bounded provider-separated category execution-cost probe design
category capture disabled
```

## Change classification

Every change must declare one primary responsibility:

- documentation/contract;
- implementation package;
- one-time production trigger;
- evidence acceptance/freeze;
- retirement/cleanup;
- unrelated product work.

Do not combine package implementation, production execution, and acceptance in one PR.

## Current 12A-4 rules

- Do not reapply Twitch or Kick category schema.
- Do not add `CATEGORY_CAPTURE_ENABLED`.
- Do not write persistent category rows from a package PR.
- Use reserved probe identifiers only.
- Execute providers independently and clean Twitch before Kick begins.
- Prove the dictionary second pass is a no-op.
- Verify zero remaining reserved rows and zero provider leakage.
- Delete temporary Workers and require HTTP 404.
- Keep cross-provider category identity and combined rankings out of scope.

## Branch and merge policy

- No direct push to `main`.
- One PR per responsibility.
- Keep scope allowlists explicit.
- Use exact package head SHA and merge SHA in one-time triggers.
- Use exact source push SHA in acceptance workflows.
- Freeze sanitized evidence on `main` before advancing the gate.

## Required validation

Run the workstream-specific checks and at minimum:

```bash
node scripts/verify-development-policy.mjs
pnpm build
pnpm typecheck
```

PR validation jobs must not require Cloudflare production credentials. Production credentials belong only in an already-accepted one-time trigger workflow.
