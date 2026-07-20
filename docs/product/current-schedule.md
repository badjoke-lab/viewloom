# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-20

```text
Phase 12A Analytics Capture Foundation active
Provider-separated Kick and Twitch canaries complete and retired
12A-4-19 permanent rollout decision accepted
12A-4-20 Twitch permanent implementation package accepted
12A-4-21 Twitch permanent release start accepted
12A-4-22 Twitch permanent observation active
Twitch permanent runtime active yes
Exact release trigger current no
Temporary GitHub observation schedule active yes
Kick permanent implementation authorized no
Existing Worker cadence */5 * * * * unchanged
Backfill no
Retention expansion no
Category UI no
Cross-provider category identity or ranking no
```

## Active sequence

1. Run the temporary hourly read-only Twitch observation.
2. Check the permanent flag, obsolete bindings, provider leakage, storage, freshness, real/non-empty snapshots, category coverage, and collector errors.
3. Restore the normal Twitch config automatically on a hard stop and verify normal snapshot recovery.
4. Continue until at least 2026-07-21 20:40 JST.
5. Extend to 2026-07-22 20:40 JST if any warning occurs.
6. Freeze final evidence, accept or roll back Twitch, and retire trigger/monitor paths.
7. Consider Kick only in a separate explicit decision after Twitch final acceptance.
8. Require seven stable days before category UI work.

## Twitch hard stops

- Permanent flag absent or false, or obsolete canary bindings present.
- Provider leakage greater than zero.
- Projected Twitch 90-day size greater than 440 MB or provider headroom below 10 MB.
- Projected account-wide D1 headroom below 500 MB.
- Latest collection stale, non-real, or empty.
- Category snapshot coverage below 0.80 after the initial grace window.
- Three or more collector error runs since activation.
- Unexpected Kick configuration, binding, data, or behavior change.

## Current operating state

- Twitch permanent category capture is active on the existing five-minute collector.
- Initial verification accepted 2 category rows, 0 leakage rows, 0 collector errors, and a real 300-stream snapshot.
- Kick normal collection continues unchanged and Kick permanent capture is unauthorized.
- The exact release trigger is retired by the start-acceptance package.

## Mandatory references

Every category PR must read and cite the permanent rollout specification, rollout plan, current roadmap, current schedule, canonical gate, active WIP, start acceptance, observation contract, and development policy.
