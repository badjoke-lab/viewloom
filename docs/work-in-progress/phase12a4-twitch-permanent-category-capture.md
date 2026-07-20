# 12A-4-19 Twitch permanent category capture decision

## Status

Twitch permanent category capture is authorized for implementation but is not yet implemented, deployed, or active. Kick permanent category capture remains unauthorized.

## Accepted direction

- Use the existing Twitch five-minute collector and Twitch D1 database.
- Reuse the accepted category schema and `category-source-v1` contract.
- Add no Worker cron, backfill, retention expansion, category UI, or cross-provider behavior.
- Require a fresh read-only production preflight before deployment.
- Observe Twitch for at least 24 hours and up to 48 hours when warnings require more evidence.
- Roll back immediately on leakage, storage, collector-health, binding, or provider-boundary hard stops.
- Consider Kick only after Twitch final acceptance in a separate explicit decision.
- Require seven stable days before category UI work.

## Current work

Prepare Phase 12A-4-20: the Twitch-only permanent capture implementation package. That package must be validation-only in its PR and must not deploy from the implementation PR.

## Source documents

- `docs/product/category-capture-permanent-rollout-spec.md`
- `docs/product/category-capture-permanent-rollout-plan.md`
- `docs/product/current-roadmap.md`
- `docs/product/current-schedule.md`
- `docs/audits/12a2-current-gate-state.json`
- `docs/operations/development-and-deployment-policy.md`

## Hard boundaries

Twitch active now: no.  
Twitch implementation authorized: yes.  
Kick implementation authorized: no.  
Public category UI authorized: no.  
Backfill authorized: no.  
Retention expansion authorized: no.  
New Worker cron authorized: no.  
Cross-provider identity or ranking authorized: no.
