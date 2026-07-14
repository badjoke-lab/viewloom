# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

```text
Current phase: Phase 12A Analytics Capture Foundation
12A-0 through 12A-3: complete
12A-4 category source audit: accepted PR #513
12A-4 category storage design: accepted PR #514
12A-4 migration and disabled runtime: accepted through PR #518
12A-4 read-only production preflight: accepted PR #523
12A-4 Twitch and Kick category schemas: complete and audited PR #545
Schema execution/recovery triggers: retired
Current workstream: 12A-4-5 bounded provider-separated category execution-cost probe design
CATEGORY_CAPTURE_ENABLED: absent
Category runtime capture started: no
```

## Permanent authorities

- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-category-schema-recovery-audit-evidence.json`
- `docs/audits/12a4-category-execution-cost-probe-contract.json`
- `docs/work-in-progress/phase12a4-category-execution-cost-probe.md`
- `docs/operations/development-and-deployment-policy.md`

## Current execution rule

Do not reapply either provider schema. The only current implementation target is a bounded provider-separated execution-cost probe package. It must use reserved identifiers, run Twitch before Kick, clean one provider completely before the next starts, verify zero remaining rows, and leave category capture disabled.

## Production safety

- `main` is production.
- No direct push to `main`.
- One PR per responsibility.
- Package PRs do not use production credentials or execute production work.
- Production execution requires a separate one-file trigger PR.
- Acceptance uses exact push SHA and sanitized artifact evidence.
- Twitch/Kick bindings and outputs remain separate.
- No new cron, backfill, retention expansion, cross-provider identity, or combined category rankings.
- Temporary Workers must be deleted and return HTTP 404.

## Validation

At minimum:

```bash
node scripts/verify-development-policy.mjs
pnpm build
pnpm typecheck
```

Also run the workstream-specific scope, package, fixture, evidence, and Wrangler dry-run gates.
