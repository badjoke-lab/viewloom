# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-20

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries complete and retired
12A-4-19 permanent rollout decision accepted
12A-4-20 Twitch permanent implementation package accepted
12A-4-21 Twitch permanent release package accepted
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

1. Create the separate exact one-file Twitch release trigger.
2. Pin PR #627 and merge `312f2c4d54dc4f881aa35e58140bd504b1b2229c` plus PR #628 acceptance.
3. Set a start boundary inside the three-hour runner limit.
4. On the main-branch trigger push, run the fresh Cloudflare GET / D1 SELECT preflight.
5. Stop before release if storage, schema, provider leakage, identity, binding, or normal snapshot health fails.
6. Release only the accepted Twitch permanent-category configuration.
7. Verify the permanent flag and absence of obsolete canary bindings.
8. Require two consecutive real, non-empty, category-bearing five-minute snapshots.
9. Begin the minimum 24-hour observation; extend to 48 hours on warning.
10. Restore the normal Twitch configuration automatically and freeze failure evidence if initial verification fails.
11. Consider Kick only after Twitch final acceptance in a separate explicit decision.
12. Require seven stable days before category UI work.

## Twitch hard stops

- Provider leakage greater than zero.
- Projected Twitch 90-day size greater than 440 MB.
- Twitch provider headroom below 10 MB.
- Projected account-wide D1 headroom below 500 MB.
- Normal collection stale, non-real, or empty for two consecutive expected cycles.
- Category payload absent for three consecutive otherwise successful snapshots after release.
- Repeated collector or D1 failures caused by category capture.
- Unexpected Kick configuration, binding, data, or behavior change.

## Current operating state

- Normal Twitch and Kick five-minute collection continues.
- The permanent Twitch implementation and release packages are accepted.
- Permanent category capture is not currently active.
- No exact release trigger or temporary observation schedule is active.
- Historical canary category rows remain accepted evidence.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, active WIP, implementation contract, release contract, and development policy.
