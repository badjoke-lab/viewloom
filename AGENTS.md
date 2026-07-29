# ViewLoom repository handoff

Canonical project state is indexed in `docs/README.md`.

## Current state

```text
Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation
Canonical gate: viewloom-12a2-current-gate-state-v33
Twitch permanent category capture: active
Kick permanent category capture: active
Replacement Twitch stability start: 2026-07-29T05:30:00.000Z
Earliest replacement audit: 2026-08-05T05:30:00.000Z
Replacement audit issue: #659
Dormant runner package: accepted PR #661 / #662
Runner repair: accepted PR #663 / #664
Checkpoint package: accepted PR #665 / #666
Current branch: work-659-twitch-replacement-audit-checkpoint-trigger
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
- `docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json`
- `docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json`
- `docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`

Do not rely on a cached handoff, an old chat summary, or a historical acceptance file when current `main` differs. The current roadmap, schedule, canonical gate, affected specification, and active WIP determine authorization.

## Current execution order

1. Create `work-659-twitch-replacement-audit-checkpoint-trigger`.
2. Add only the exact accepted trigger file, bound to package PR #665 and merge `317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a`.
3. Merge only after trigger identity validation passes; production checkpoint execution occurs only on main push.
4. Freeze sanitized checkpoint evidence and run/job/artifact/digest identities.
5. Retire the one-time trigger and temporary execution path after evidence freeze.
6. Start Heatmap Canvas module split after checkpoint priority is secured.
7. Address #148 provider UI parity.
8. At or after `2026-08-05T05:30:00.000Z`, execute #659 final mode and freeze the result.
9. Keep public category-filter exposure disabled until accepted final evidence and a separate cutover PR.

## Production safety

- `main` is production; do not push directly.
- Use `work-*` branches and one PR per responsibility.
- Trigger PRs add only the exact trigger file.
- Package and acceptance PRs do not use production credentials or execute production access.
- Checkpoint execution is Cloudflare GET and D1 SELECT/WITH only.
- Checkpoint evidence is diagnostic, does not accept #659, and does not authorize public UI.
- Twitch and Kick bindings, rows, routes, options, and outputs remain separate.
- No Worker deployment, new cron, cadence change, D1 schema mutation, backfill, retention expansion, Kick mutation, cross-provider identity, or combined ranking.
- Existing unfiltered Heatmap remains the production fallback.

## Validation

Run affected targeted checks during iteration, then all feature and shared gates on the latest candidate HEAD. At minimum for checkpoint/category governance work:

```bash
node scripts/verify-12a5-twitch-replacement-audit-checkpoint-package.mjs
node scripts/verify-development-policy.mjs
node scripts/verify-category-rollout-policy.mjs
```

Run web build, typecheck, browser, mobile, accessibility, provider-separation, and data-truth gates when the affected scope requires them.
