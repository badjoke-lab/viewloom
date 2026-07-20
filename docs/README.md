# ViewLoom documentation index

Status: source-of-truth map  
Last updated: 2026-07-20

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries accepted and retired
canonical gate 12A-4-22 Twitch permanent observation active
Twitch permanent implementation package accepted yes
Twitch permanent release start accepted yes
Twitch permanent category capture active yes
Exact release trigger current no
Temporary GitHub observation schedule active yes
Kick permanent implementation authorized no
normal Twitch cadence */5 * * * *
new Worker cron authorized no
backfill authorized no
retention expansion authorized no
category UI authorized no
cross-provider identity or combined ranking authorized no
```

## Read first

1. `docs/operations/development-and-deployment-policy.md`
2. `docs/product/category-capture-permanent-rollout-spec.md`
3. `docs/product/category-capture-permanent-rollout-plan.md`
4. `docs/product/current-roadmap.md`
5. `docs/product/current-schedule.md`
6. `docs/audits/12a2-current-gate-state.json`
7. `docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md`
8. `docs/audits/12a4-twitch-permanent-category-start-acceptance.json`
9. `docs/audits/12a4-twitch-permanent-category-observation-contract.json`
10. `docs/audits/12a4-twitch-permanent-category-capture-package-contract.json`
11. `docs/audits/12a4-twitch-permanent-category-release-contract.json`

## Current category evidence chain

- Source and storage evidence remain accepted and provider-separated.
- Final Kick and Twitch bounded-canary evidence remains historical accepted evidence.
- Twitch permanent implementation and release packages are accepted.
- Twitch permanent start evidence: `docs/audits/12a4-twitch-permanent-category-start-acceptance.json`.
- Active observation contract: `docs/audits/12a4-twitch-permanent-category-observation-contract.json`.

## Current gate

The canonical gate is 12A-4-22. Twitch permanent category capture is active on the existing five-minute collector and passed initial start verification. The minimum 24-hour Twitch-only observation is active.

The temporary hourly GitHub Actions observer performs Cloudflare GET and D1 SELECT checks. A hard stop restores the normal category-disabled Twitch configuration and verifies normal snapshot recovery. No new Worker cron exists.

Kick remains unauthorized pending Twitch final acceptance and a separate explicit decision. Category UI, backfill, retention expansion, cross-provider identity, and combined rankings remain unauthorized.

## Invariants

- Twitch and Kick remain separate.
- Twitch activation does not authorize Kick.
- Normal collector cadence remains five minutes.
- The observation schedule is temporary GitHub Actions infrastructure, not a Worker cron.
- No backfill, retention expansion, category UI, cross-provider identity, or combined ranking is authorized.
- Missing, partial, stale, empty, error, and demo states remain distinct.

## Documentation governance

- Accepted evidence is immutable except when replaced by later exact-SHA acceptance.
- Current status belongs in roadmap, schedule, gate state, and the active WIP file.
- Historical implementation files remain in the repository but must not be presented as current.
- Production workflows require explicit contracts, sanitized evidence, and retirement steps.
