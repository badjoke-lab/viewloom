# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-28

```text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-5B-R1 Twitch permanent-category recovery
Twitch permanent category capture active no
Twitch recovery required yes
Original Twitch seven-day clock valid no
Kick permanent implementation package accepted yes
Kick permanent release package accepted yes
Kick permanent runtime active yes
Twitch Heatmap hidden category API package accepted yes
Twitch Heatmap hidden control package accepted yes
Twitch Heatmap public category-filter exposure authorized no
New Twitch seven-day audit earliest pending verified recovery start plus seven days
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
```

## Confirmed regression

- Accepted Twitch permanent-category start: `2026-07-20T11:40:00Z`.
- Last category-bearing snapshot: `2026-07-23T11:35:00Z`.
- First category-disabled snapshot: `2026-07-23T11:40:00Z`.
- Cloudflare Worker modification: `2026-07-23T11:33:53.256999Z`.
- Source workflow: `Deploy Collector Workers` run `30003576549`.
- Source job: `deploy-twitch` job `89194219805`.
- Triggering change: Kick-only PR #637 merge commit `b4012ebddb9ec33c50b6298c882f0f1a4ee16be0`.
- Cause: the shared workflow unconditionally deployed both normal provider configs for either provider’s collector change.

## Track A — Kick permanent category capture

Completed:

1. Kick release, initial verification, minimum observation, and final acceptance completed in PR #648.
2. Kick permanent capture remains active on the existing five-minute collector.
3. Final evidence remains run `30193672205`, job `89771280558`, artifact `8629415129`.

Next:

1. Preserve the accepted Kick permanent configuration and five-minute cadence.
2. Do not redeploy Kick from Twitch-only source changes.
3. Do not add Kick category UI without separate evidence and authorization.

## Track B — Twitch permanent-category recovery

Completed:

1. Hidden Twitch Heatmap API and control packages remain accepted and non-public.
2. Read-only audit PR #651 detected and documented the production regression.
3. Rejected audit and root-cause evidence are frozen in `docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json`.

Required order:

1. Correct canonical state to Twitch recovery required and invalidate the original seven-day clock.
2. Accept provider-scoped collector deployment planning so Twitch and Kick changes deploy independently.
3. Accept the dormant Twitch recovery package without production deployment.
4. Create a separate exact one-file recovery trigger with a bounded start time.
5. Immediately before deployment, run a fresh read-only Twitch preflight.
6. Deploy only `workers/collector-twitch/wrangler.category-permanent.toml`.
7. Verify the permanent binding and two consecutive real, non-empty, fresh, category-bearing Twitch snapshots.
8. On failure, restore `workers/collector-twitch/wrangler.toml` and verify normal snapshot recovery.
9. Freeze recovery evidence and set the new stable-accumulation start from the first verified category snapshot.
10. Run a new seven-day read-only accumulation audit after the new boundary.
11. Authorize public exposure only through a later separate cutover PR.

## Public Twitch cutover

Blocked. A later separate PR must explicitly:

- cite an accepted post-recovery seven-day audit;
- enable the normal Twitch Heatmap category control;
- expose no Kick category UI;
- retain `All categories` and the unfiltered fallback;
- pass production browser, mobile, accessibility, and data-truth checks;
- record exact build and deployment identities.

## Hard stops

### Twitch recovery

- preflight sees an unexpected permanent or canary binding state;
- provider leakage greater than zero;
- projected Twitch 90-day size above 440 MB or provider headroom below 10 MB;
- projected account-wide D1 headroom below 500 MB;
- latest normal snapshot stale, non-real, or empty before recovery;
- permanent binding absent after deployment;
- two category-bearing snapshots not observed within the bounded verification window;
- any Kick configuration, binding, row, API, UI, or runtime mutation;
- any cadence, D1 schema, backfill, retention, or cross-provider change.

### Hidden Twitch filter

- public nav or normal-route exposure before authorization;
- category selection applied after Top N instead of before Top N;
- provider category identity or URL state shared across Twitch and Kick;
- demo, empty, partial, stale, unknown, or unavailable states collapsed into false real data.

## Mandatory references

Every recovery or category PR must read and cite:

1. `docs/product/category-capture-permanent-rollout-spec.md`;
2. `docs/product/category-capture-permanent-rollout-plan.md`;
3. `docs/product/current-roadmap.md`;
4. this schedule;
5. `docs/audits/12a2-current-gate-state.json`;
6. `docs/audits/12a2-collector-worker-deploy-contract.json`;
7. `docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json`;
8. `docs/audits/12a5-twitch-permanent-category-recovery-contract.json`;
9. `docs/work-in-progress/phase12a4-category-parallel-execution.md`;
10. `docs/operations/development-and-deployment-policy.md`.
