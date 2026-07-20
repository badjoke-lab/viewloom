# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-20

```text
Phase 12A Analytics Capture Foundation active
12A-0 through 12A-3 complete
Provider-separated Kick and Twitch canaries complete and retired
12A-4-19 permanent rollout decision accepted
Twitch permanent implementation authorized yes
Twitch permanent runtime active no
Kick permanent implementation authorized no
Existing Worker cadence */5 * * * * unchanged
Backfill no
Retention expansion no
Category UI no
Cross-provider category identity or ranking no
```

## Active sequence

1. Build Phase 12A-4-20 Twitch-only implementation package.
2. Verify extraction, storage, provider separation, rollback, and disabled Kick fixtures.
3. Accept the package without production deployment from the implementation PR.
4. Create a separate exact Twitch deployment trigger.
5. Run a fresh Cloudflare GET / D1 SELECT preflight immediately before deployment.
6. Deploy only when every gate passes.
7. Require two consecutive real, non-empty, category-bearing five-minute snapshots.
8. Observe for at least 24 hours; extend to 48 hours on warning.
9. Accept and retire temporary paths, or roll back and freeze failure evidence.
10. Consider Kick in a separate explicit decision.
11. Require seven stable days before category UI work.

## Twitch hard stops

- Provider leakage greater than zero.
- Projected Twitch 90-day size greater than 440 MB.
- Twitch provider headroom below 10 MB.
- Projected account-wide D1 headroom below 500 MB.
- Normal collection stale, non-real, or empty for two consecutive expected cycles.
- Category payload absent for three consecutive otherwise successful snapshots after deployment.
- Repeated collector or D1 failures caused by category capture.
- Unexpected Kick configuration, binding, data, or behavior change.

## Current operating state

- Normal Twitch and Kick five-minute collection continues.
- Permanent category capture is not currently active.
- Historical canary category rows remain accepted evidence.
- No category-capture deployment or observation workflow is currently active.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, and development policy.
