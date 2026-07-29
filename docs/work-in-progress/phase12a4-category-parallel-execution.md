# 12A-5B-R2 replacement Twitch seven-day accumulation

## Status

Kick permanent category capture is accepted and active. Twitch permanent category capture was recovered, verified, accepted, and is active again.

- Recovery trigger PR: #655.
- Recovery acceptance and execution-path retirement PR: #657.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Replacement stability start: `2026-07-29T05:30:00.000Z`.
- Earliest replacement audit: `2026-08-05T05:30:00.000Z`.

Public Twitch category-filter exposure remains unauthorized. The original seven-day stability clock is invalid; only the replacement clock above is current.

## Recovery result

- Final preflight was read-only and passed.
- Only `workers/collector-twitch/wrangler.category-permanent.toml` was deployed.
- Two consecutive real, non-empty, fresh category-bearing snapshots passed.
- `CATEGORY_CAPTURE_ENABLED=true` is present.
- Existing cadence remains `*/5 * * * *`.
- Provider leakage is zero.
- Storage gates passed.
- Rollback was not required.
- Kick was unchanged.
- Trigger and production recovery workflow were retired in PR #657.

## Track A — Kick permanent capture

- Final acceptance PR: #648.
- Permanent config: `workers/collector-kick/wrangler.category-permanent.toml`.
- Runtime active: yes.
- Existing cadence: `*/5 * * * *`.
- Twitch-only work must not deploy, mutate, or otherwise change Kick.

## Track B — replacement Twitch accumulation

1. Accumulate category-bearing snapshots continuously from `2026-07-29T05:30:00.000Z`.
2. Keep the permanent Twitch binding and existing five-minute cadence unchanged.
3. At or after `2026-08-05T05:30:00.000Z`, run the replacement read-only seven-day accumulation audit.
4. Verify expected slots, real/non-empty/fresh snapshots, category references, collector errors, zero leakage, and storage headroom.
5. Freeze accepted evidence in canonical state.
6. Keep hidden controls non-public until a separate public cutover PR is accepted.

## Recovery history retained

- Rejected audit issue: #650.
- Recovery tracking issue: #652.
- Root-cause workflow run/job: `30003576549` / `89194219805`.
- Last category snapshot before regression: `2026-07-23T11:35:00.000Z`.
- First category-disabled snapshot: `2026-07-23T11:40:00.000Z`.
- The original clock remains invalid and cannot authorize public UI.

## Shared boundaries

- Twitch and Kick remain provider-separated.
- Existing cadence remains `*/5 * * * *` for both providers.
- No new Worker cron, D1 schema mutation, backfill, or retention expansion.
- No cross-provider identity, mapping, totals, or rankings.
- No public Twitch category UI before accepted replacement audit and separate cutover.
- Existing unfiltered Heatmap remains the fallback.

## Mandatory source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`
- `docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`
