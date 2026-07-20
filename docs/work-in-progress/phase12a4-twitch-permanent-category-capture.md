# 12A-4-22 Twitch permanent category observation active

## Status

Twitch permanent category capture started at 2026-07-20 20:40 JST and passed initial read-only production verification. PR #632 freezes the start evidence, retires the exact release trigger path, and starts the minimum 24-hour Twitch-only observation package. Kick remains unauthorized and unchanged.

## Accepted start evidence

- Release trigger PR: #630.
- Release trigger merge: `3c262530fa234800a426dadb20148ee4f2219309`.
- Start boundary: `2026-07-20T11:40:00.000Z`.
- Verification run: `29739415464`.
- Verification job: `88342486922`.
- Verification artifact: `8459811639`.
- Artifact digest: `sha256:40362301ce22eb6da23443db5ee2238dd13711118c3d6b1ecee2ebbd6fe4132e`.
- Evidence: `docs/audits/12a4-twitch-permanent-category-start-acceptance.json`.

Initial accepted values: permanent flag true, obsolete canary bindings absent, category rows 2, provider leakage 0, collector errors 0, 300 streams, 680,566 viewers, projected 90-day size 374.41 MB, provider headroom 75.59 MB, and account-wide headroom 728.87 MB.

## Active observation

- Minimum end: 2026-07-21 20:40 JST.
- Warning extension end: 2026-07-22 20:40 JST.
- Monitoring: temporary hourly GitHub Actions schedule.
- Production reads: Cloudflare GET and D1 SELECT only.
- Hard-stop containment: restore the normal Twitch config and verify a new normal snapshot.
- New Worker cron: no.

## Current production state

- Twitch permanent category capture active: yes.
- Existing Twitch cadence: five minutes.
- Exact release trigger current: no.
- Kick change: no.
- Backfill or retention expansion: no.
- Category UI or cross-provider behavior: no.

## Next gate

After the minimum observation, freeze final read-only evidence. Accept Twitch only if storage, leakage, bindings, freshness, real/non-empty collection, category coverage, and collector health pass. Otherwise restore normal Twitch collection and freeze failure evidence. Retire all temporary observation paths in either case.

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/audits/12a4-twitch-permanent-category-start-acceptance.json`
- `docs/audits/12a4-twitch-permanent-category-observation-contract.json`
- `docs/operations/development-and-deployment-policy.md`

## Current authorization

Twitch runtime active: yes.  
Twitch observation active: yes.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
