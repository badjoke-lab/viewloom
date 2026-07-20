# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-20

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries complete and retired
12A-4-19 permanent rollout decision accepted
12A-4-20 Twitch permanent implementation package accepted
Twitch permanent runtime active no
Exact release trigger current no
Kick permanent implementation authorized no
Existing Worker cadence */5 * * * * unchanged
Backfill no
Retention expansion no
Category UI no
Cross-provider category identity or ranking no
```

## Active sequence

1. Prepare a separate 12A-4-21 exact Twitch release package.
2. Pin the accepted PR #625 package and PR #626 acceptance identities.
3. Run a fresh Cloudflare GET / D1 SELECT preflight immediately before production activation.
4. Stop before activation if storage, schema, provider leakage, identity, binding, or normal snapshot health fails.
5. Activate only the accepted Twitch permanent-category configuration.
6. Verify the permanent flag and absence of obsolete canary bindings.
7. Require two consecutive real, non-empty, category-bearing five-minute snapshots.
8. Begin the minimum 24-hour observation; extend to 48 hours on warning.
9. Accept and retire temporary paths, or restore the normal Twitch configuration and freeze failure evidence.
10. Consider Kick only after Twitch final acceptance in a separate explicit decision.
11. Require seven stable days before category UI work.

## Twitch hard stops

- Provider leakage greater than zero.
- Projected Twitch 90-day size greater than 440 MB.
- Twitch provider headroom below 10 MB.
- Projected account-wide D1 headroom below 500 MB.
- Normal collection stale, non-real, or empty for two consecutive expected cycles.
- Category payload absent for three consecutive otherwise successful snapshots after activation.
- Repeated collector or D1 failures caused by category capture.
- Unexpected Kick configuration, binding, data, or behavior change.

## Current operating state

- Normal Twitch and Kick five-minute collection continues.
- The permanent Twitch package is accepted and present in the repository.
- Permanent category capture is not currently active.
- No exact release trigger or temporary observation workflow is active.
- Historical canary category rows remain accepted evidence.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, active WIP, package contract, and development policy.
