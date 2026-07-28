# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-28

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 through 12A-4-23: Twitch permanent implementation, release, initial observation, and initial acceptance.
- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.
- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.
- Kick dormant release package accepted in PR #641 and frozen canonically in PR #642.
- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.
- Kick permanent category capture started through PR #643, completed the minimum 24-hour observation, and was accepted in PR #648 without rollback.
- The first Twitch seven-day audit was executed read-only in PR #651 and correctly rejected after detecting a production configuration regression.

### Current gate: recover Twitch permanent category capture

Kick permanent category capture remains accepted and active on the existing five-minute collector.

Twitch permanent category capture is **not currently active**. Category-bearing collection stopped after `2026-07-23T11:35:00Z`; the first category-disabled snapshot followed at `2026-07-23T11:40:00Z`. The hidden category controls remain complete and accepted, but public exposure remains unauthorized.

The confirmed cause is `Deploy Collector Workers` run `30003576549`: the Kick-only PR #637 merge triggered both provider deployment jobs, and Twitch job `89194219805` applied the normal Twitch config at `2026-07-23T11:33:53Z`.

The original Twitch seven-day accumulation clock is invalid. A new clock begins only after guarded Twitch recovery is deployed and verified.

### Active deliverables

#### Track A — Kick

1. Final acceptance: PR #648.
2. Final observation: run `30193672205`, job `89771280558`, artifact `8629415129`.
3. Kick permanent capture remains active on the existing five-minute collector.
4. No Kick category UI is authorized by this acceptance.

#### Track B — Twitch recovery and hidden filter

1. Freeze the rejected audit and confirmed regression evidence from Issue #650.
2. Fix the shared collector deployment workflow so provider-specific changes cannot deploy the other provider.
3. Select normal or permanent deployment configs from the canonical provider runtime state.
4. Prepare and accept a dormant Twitch-only recovery package under Issue #652.
5. Run a fresh read-only production preflight, then deploy only the accepted Twitch permanent config through a separate exact trigger.
6. Verify permanent binding, two consecutive real/non-empty/fresh category-bearing snapshots, zero leakage, safe storage headroom, unchanged cadence, and no Kick mutation.
7. Restart the seven-day stability clock from the verified recovery start.
8. Keep the controls hidden until the new seven-day audit passes and a separate public cutover PR is accepted.

### Following gates

1. 12A-5B-R1 Twitch permanent-category recovery.
2. New seven-day Twitch accumulation audit from the verified recovery start.
3. 12A-5C public Twitch Heatmap category-filter cutover only after the new audit passes.
4. Kick category UI only after separate Kick stable-accumulation and UI authorization evidence.
5. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains `*/5 * * * *` for both providers.
- No new Worker cron is authorized.
- No backfill or retention expansion is authorized.
- Twitch recovery must not mutate Kick.
- Accepted hidden Twitch controls must not become public before the restarted seven-day audit and separate cutover acceptance.
- Rejected accumulation evidence cannot authorize public UI.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a2-collector-worker-deploy-contract.json`
- `docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/work-in-progress/phase12a4-category-parallel-execution.md`
