# 12A-4-24 category parallel execution

## Status

Twitch and Kick permanent category capture are accepted and active. The hidden Twitch controls remain accepted but non-public:

- Track A: Kick permanent category capture completed release, initial verification, minimum 24-hour observation, and final acceptance in PR #648; the temporary hourly monitor is retired.
- Track B: hidden Twitch Heatmap category controls from PR #640 are accepted; the seven-day accumulation audit is next under Issue #635.

Public Twitch category-filter exposure remains unauthorized until the seven-day Twitch accumulation audit and a separate public cutover PR.

## Accepted Twitch baseline

- Production start: `2026-07-20T11:40:00.000Z`.
- Final acceptance PR: #633.
- Final observation run: 29827696569.
- Final observation job: 88624752189.
- Final artifact: 8493912964.
- Observed category snapshots: 291.
- Expected category snapshots: 290.
- Coverage ratio: 1.0.
- Collector errors: 0.
- Provider leakage: 0.
- Projected 90-day size: 378.59 MB.
- Provider headroom: 71.41 MB.
- Account-wide headroom: 626.08 MB.

## Track A — Kick permanent capture

### Accepted implementation and release packages

- Implementation package PR: #637.
- Implementation merge SHA: `b4012ebddb9ec33c50b6298c882f0f1a4ee16be0`.
- Dormant release package PR: #641.
- Dormant release merge SHA: `7afb81bb9098104107860e9fe6c920c7380964ad`.
- Release validation run: 30089007295.
- Release verify job: 89467818501.
- Fresh production preflight job: 89467818503.
- Permanent config: `workers/collector-kick/wrangler.category-permanent.toml`.
- Normal rollback config: `workers/collector-kick/wrangler.toml`.
- Fresh read-only preflight: passed.
- Production publish from package or acceptance PR: no.
- Remote D1 mutation from package or acceptance PR: no.
- Kick production runtime active: yes.
- Final acceptance PR: #648.
- Final observation run/job/artifact: `30193672205` / `89771280558` / `8629415129`.
- Final category-bearing snapshots: 298.
- Final provider leakage: 0.
- Warning extension required: no.
- Rollback required: no.
- Twitch changed: no.

### Immediate work order

1. Track complete. Keep Kick permanent capture active on the existing five-minute collector.
2. Preserve provider separation and the normal config as an available rollback target.
3. Kick category UI remains unauthorized until separate Kick stable-accumulation and UI evidence is accepted.

### Hard boundary

No Twitch configuration, binding, row, API, runtime, or public UI change is permitted from the Kick track.

## Track B — hidden Twitch Heatmap filter

### Accepted API and hidden control packages

- Hidden API package PR: #638.
- Hidden API merge SHA: `5b466e3e440324bbd6b19d60aa3acaed0d1d95e8`.
- Hidden controls package PR: #640.
- Hidden controls merge SHA: `aecd4a10ca0da3146c23e5841412603e1e4416dd`.
- Hidden controls validation run: 30005758951.
- Hidden controls validation job: 89201237079.
- `categoryPreview=1` exact Twitch-only entry retained.
- `All categories` default and Top 20/50/100 implemented.
- Category filtering occurs before Top N.
- URL restoration, truthful states, mobile behavior, focus-visible behavior, and aria-live status accepted.
- Public category control or navigation added: no.
- Collector or Kick change: no.

### Immediate work order

1. Keep the accepted controls hidden and preserve the unfiltered fallback.
2. Run the seven-day accumulation audit at or after `2026-07-27T11:40:00.000Z` / 2026-07-27 20:40 JST.
3. Verify seven stable Twitch days, category and dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, bounded growth, and storage headroom.
4. Use a separate public cutover PR only after the audit passes.

### Public gate

The audit must pass while public exposure remains disabled. Twitch evidence cannot authorize Kick category UI.

## Shared boundaries

- Existing Twitch and Kick Worker cadence remains `*/5 * * * *`.
- No new Worker cron.
- No backfill.
- No retention expansion.
- No cross-provider category identity, mapping, totals, or rankings.
- Provider data, route state, options, and results remain separate.
- Every PR must cite the current specification, plan, roadmap, schedule, canonical gate, this WIP, relevant decision and package contracts, and development policy.

## Mandatory source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-kick-permanent-category-decision-contract.json`
- `docs/audits/12a4-kick-permanent-category-capture-package-contract.json`
- `docs/audits/12a4-kick-permanent-category-release-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json`
- `docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json`
- `docs/audits/12a4-twitch-permanent-category-final-acceptance.json`
- `docs/audits/12a4-kick-permanent-category-final-acceptance.json`
- `docs/operations/development-and-deployment-policy.md`

