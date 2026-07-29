# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-29

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R2 replacement Twitch seven-day accumulation audit
Twitch permanent category capture active yes
Twitch recovery required no
Original Twitch seven-day clock valid no
Replacement Twitch seven-day clock active yes
Replacement Twitch seven-day clock start 2026-07-29T05:30:00.000Z
Replacement Twitch seven-day audit earliest 2026-08-05T05:30:00.000Z
Kick permanent implementation package accepted yes
Kick permanent release package accepted yes
Kick permanent runtime active yes
Twitch Heatmap hidden category API package accepted yes
Twitch Heatmap hidden control package accepted yes
Twitch Heatmap public category-filter exposure authorized no
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
```

## Recovery acceptance

- Trigger PR: #655; merge `40ab1cf6eb4ff4117c4ab6d69e2e5b8cb631b7e4`.
- Recovery run/job/artifact: `30423637234` / `90485345119` / `8713465427`.
- Acceptance PR: #657; merge `5565640b26a0fe8e896e5c47eb054b3363f50463`.
- Verified start: `2026-07-29T05:30:00.000Z`.
- Final read-only preflight: passed.
- Twitch permanent config only: deployed.
- Consecutive category-bearing snapshots: 2, real, non-empty, and fresh.
- Permanent binding: present.
- Provider leakage: 0.
- Existing cadence: unchanged at `*/5 * * * *`.
- Storage gates: passed.
- Rollback: not required.
- Kick mutation: none.

## Track A — Kick permanent category capture

1. Preserve the accepted Kick permanent configuration and five-minute cadence.
2. Do not redeploy Kick from Twitch-only source changes.
3. Do not add Kick category UI without separate evidence and authorization.

## Track B — replacement Twitch seven-day accumulation

Required order:

1. Preserve uninterrupted Twitch permanent category capture from `2026-07-29T05:30:00.000Z`.
2. At or after `2026-08-05T05:30:00.000Z`, run a read-only seven-day accumulation audit.
3. Verify every expected five-minute slot or explain bounded gaps without inventing data.
4. Verify permanent binding, category contract, freshness, real/non-empty payloads, zero leakage, safe storage headroom, and no Kick mutation.
5. Freeze accepted audit evidence canonically.
6. Keep public exposure disabled unless a later separate cutover PR is accepted.

## Public Twitch cutover

Blocked. A later separate PR must cite an accepted post-recovery seven-day audit, enable only the normal Twitch Heatmap category control, retain `All categories` and the unfiltered fallback, expose no Kick category UI, and pass browser, mobile, accessibility, and data-truth checks.

## Hard stops

- permanent binding becomes absent;
- category-bearing collection stops or becomes stale;
- provider leakage exceeds zero;
- projected Twitch 90-day size exceeds 440 MB or provider headroom falls below 10 MB;
- projected account-wide D1 headroom falls below 500 MB;
- any Kick configuration, binding, row, API, UI, or runtime mutation;
- any cadence, D1 schema, backfill, retention, or cross-provider change;
- any public category-filter exposure before accepted audit and separate cutover.

## Mandatory references

1. `docs/product/category-capture-permanent-rollout-spec.md`;
2. `docs/product/category-capture-permanent-rollout-plan.md`;
3. `docs/product/current-roadmap.md`;
4. this schedule;
5. `docs/audits/12a2-current-gate-state.json`;
6. `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`;
7. `docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json`;
8. `docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json`;
9. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
10. `docs/operations/development-and-deployment-policy.md`.
