# 12A-5B-R1 Twitch permanent-category recovery

## Status

Kick permanent category capture is accepted and active. Twitch permanent category capture is not active and requires guarded recovery.

- Track A: Kick completed release, minimum observation, and final acceptance in PR #648. Its permanent configuration and five-minute cadence remain unchanged.
- Track B: the hidden Twitch Heatmap category controls remain accepted and non-public, but the first seven-day accumulation audit was rejected after detecting a Twitch production configuration regression.

Public Twitch category-filter exposure remains unauthorized. The original seven-day stability clock is invalid and must restart after verified recovery.

## Rejected Twitch accumulation evidence

- Audit issue: #650.
- Audit PR: #651, closed without merge.
- Audit run/job/artifact: `30356480145` / `90265761664` / `8687010041`.
- Diagnostic run/job/artifact: `30357344189` / `90268510286` / `8687336938`.
- Accepted start used by the rejected audit: `2026-07-20T11:40:00.000Z`.
- Last category-bearing snapshot: `2026-07-23T11:35:00.000Z`.
- First category-disabled snapshot: `2026-07-23T11:40:00.000Z`.
- Category rows: 790 of 2307 expected slots.
- Category reference coverage: 0.996458.
- Invalid references: 0.
- Unresolved observed category IDs: 0.
- Provider leakage: 0.
- Storage gates: pass.
- Public exposure during audit: disabled.

## Confirmed root cause

Cloudflare modified `viewloom-collector-twitch` at `2026-07-23T11:33:53.256999Z`.

The matching repository execution was:

- source PR: #637, Kick implementation package;
- source commit: `b4012ebddb9ec33c50b6298c882f0f1a4ee16be0`;
- workflow: `Deploy Collector Workers`;
- workflow run: `30003576549`;
- Twitch deployment job: `89194219805`.

The shared deployment workflow ran both provider jobs when either provider’s collector files changed. The Kick-only merge therefore ran `wrangler deploy` from `workers/collector-twitch`, applying the normal Twitch config and removing `CATEGORY_CAPTURE_ENABLED`.

## Provider-scoped deployment fix

The deployment workflow must now:

1. detect Twitch, Kick, and shared Worker path changes independently;
2. deploy Twitch only for Twitch/shared changes;
3. deploy Kick only for Kick/shared changes;
4. perform no deployment for workflow- or documentation-only changes;
5. require an explicit provider for manual dispatch;
6. select each provider’s normal or permanent config from the canonical runtime state;
7. preserve read-only PR validation and remote schema verification.

This prevents a Kick-only change from redeploying Twitch and prevents a Twitch-only change from redeploying Kick.

## Track A — Kick permanent capture

### Accepted baseline

- Final acceptance PR: #648.
- Final observation run/job/artifact: `30193672205` / `89771280558` / `8629415129`.
- Permanent config: `workers/collector-kick/wrangler.category-permanent.toml`.
- Runtime active: yes.
- Existing cadence: `*/5 * * * *`.

### Boundary

Twitch recovery must not deploy, mutate, or otherwise change Kick configuration, bindings, data, routes, API, UI, or runtime.

## Track B — Twitch permanent-category recovery

### Existing accepted components

- Initial permanent implementation and release evidence remain historical accepted evidence.
- Permanent config: `workers/collector-twitch/wrangler.category-permanent.toml`.
- Normal rollback config: `workers/collector-twitch/wrangler.toml`.
- Read-only observer: `scripts/run-12a4-twitch-permanent-category-observer.mjs`.
- Hidden API package PR: #638.
- Hidden controls package PR: #640.
- Hidden entry: `categoryPreview=1`.
- Public controls: absent.

### Recovery work order

1. Freeze the rejected audit evidence and canonical regression state.
2. Accept the provider-scoped shared deployment fix.
3. Accept a dormant Twitch-only recovery workflow with no trigger in its package PR.
4. Create a separate exact one-file trigger after package acceptance.
5. Run fresh read-only preflight immediately before deployment.
6. Deploy only the Twitch permanent config.
7. Require two consecutive real, non-empty, fresh, category-bearing snapshots and the permanent binding.
8. Require zero provider leakage, safe storage headroom, and unchanged five-minute cadence.
9. Roll back to the normal Twitch config and verify normal recovery on any hard stop.
10. Freeze recovery evidence and set the new seven-day clock from the verified recovery start.
11. Keep the category filter hidden until a new seven-day audit passes and a separate public cutover PR is accepted.

### Recovery boundaries

- no Kick deployment or mutation;
- no D1 schema mutation;
- no backfill;
- no retention expansion;
- no new Worker cron;
- no public category UI exposure;
- no cross-provider category identity, mapping, totals, or rankings.

## Shared boundaries

- Existing Twitch and Kick Worker cadence remains `*/5 * * * *`.
- Provider data, route state, options, and results remain separate.
- The normal configs remain explicit rollback targets, not the default deployment target for active permanent runtimes.
- Every PR must cite the current specification, plan, roadmap, schedule, canonical gate, this WIP, relevant evidence/contracts, and development policy.

## Mandatory source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a2-collector-worker-deploy-contract.json`
- `docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`
