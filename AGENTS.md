# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Twitch permanent category capture: active
Kick permanent category capture: active
Replacement stability start: 2026-07-29T05:30:00.000Z
Earliest final boundary: 2026-08-05T05:30:00.000Z
Replacement audit issue: #659
Checkpoint run: 30478338654
Checkpoint outcome: failed
Failed gates: slot coverage / consecutive missing slots / category reference coverage
Current branch: work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package
Twitch Heatmap public category-filter exposure: unauthorized
Existing Twitch cadence: */5 * * * *
Existing Kick cadence: */5 * * * *
```

## Mandatory current authorities

Read these from current `main` before starting work and reread them before merging:

1. `docs/README.md`
2. `docs/product/current-roadmap.md`
3. `docs/product/current-schedule.md`
4. `docs/audits/12a2-current-gate-state.json`
5. the affected feature specification and implementation plan
6. the active work-in-progress record
7. `docs/operations/development-and-deployment-policy.md`

Current #659 authorities include:

- `docs/product/twitch-replacement-seven-day-audit-spec.md`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`

Do not rely on a cached handoff, old chat summary, or historical acceptance file when current `main` differs.

## Current execution order

1. Merge the checkpoint evidence/retirement PR.
2. Create and separately accept `work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package`.
3. Diagnose the three consecutive missing slots and 248 null category references using read-only queries only.
4. Do not rerun the checkpoint, relax thresholds, backfill, reset the stability clock, or mutate production without a separate accepted decision.
5. Keep the final audit blocked pending diagnosis; the calendar boundary alone does not authorize execution.
6. Keep public category-filter exposure disabled.

## Production safety

- `main` is production; do not push directly.
- Use `work-*` branches and one PR per responsibility.
- The one-time checkpoint trigger, execution workflow, and reporter are retired.
- Diagnostic work is Cloudflare GET and D1 SELECT/WITH only.
- No Worker deployment, new cron, cadence change, D1 schema mutation, backfill, retention expansion, Kick mutation, threshold relaxation, cross-provider identity, or combined ranking.
- Existing unfiltered Heatmap remains the production fallback.

## Validation

At minimum for current governance work:

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```
