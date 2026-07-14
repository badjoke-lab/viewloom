# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, bindings, storage, rankings, exports, baselines, relationships, categories, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry
- History = Trends
- Channel = one retained channel footprint
- Data Status = collection health and evidence quality

## Current development state

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
12A-4 Twitch and Kick category schemas complete and audited PR #545
Schema execution and recovery triggers retired
Current workstream 12A-4-5 bounded provider-separated category execution-cost probe design
CATEGORY_CAPTURE_ENABLED absent
Production category rows absent
Category runtime capture not started
```

The current task is **not** another schema apply and is **not** category capture enablement. It is a bounded one-shot cost probe design. The probe must measure provider-specific execution cost, prove dictionary idempotency, remove all reserved probe data, preserve collector success semantics, and delete temporary Workers.

## Hard boundaries

- No cross-provider category identity.
- No combined Twitch/Kick category rankings.
- No new cron for category capture.
- No category backfill.
- No retention expansion in 12A-4.
- No production probe from a package PR.
- No runtime capture before a separate accepted enablement gate.
- Accepted category columns are preserved; rollback disables runtime rather than dropping schema.

## Repository layout

- `apps/web` — public site and Pages Functions APIs.
- `workers/collector-twitch` — Twitch collector.
- `workers/collector-kick` — Kick collector.
- `workers/shared` — provider-independent bounded generation and schema logic.
- `db/d1` — D1 migrations.
- `docs/product` — current product roadmap and schedule.
- `docs/audits` — machine-readable contracts and accepted evidence.
- `docs/work-in-progress` — the one active bounded workstream.

## Source of truth

Read these before changing production behavior:

1. `docs/product/current-roadmap.md`
2. `docs/product/current-schedule.md`
3. `docs/audits/12a2-current-gate-state.json`
4. `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
5. `docs/audits/12a4-category-execution-cost-probe-contract.json`
6. `docs/work-in-progress/phase12a4-category-execution-cost-probe.md`
7. `docs/operations/development-and-deployment-policy.md`

## Required validation

Before merge, run the relevant package verifier plus:

```bash
node scripts/verify-development-policy.mjs
pnpm build
pnpm typecheck
```

Production execution must remain isolated behind a separate one-file trigger PR and an exact-SHA acceptance workflow.

## Data honesty

ViewLoom distinguishes real, partial, stale, empty, error, and demo states. Missing observations are not silently converted to zero, and provider coverage limitations remain visible.
