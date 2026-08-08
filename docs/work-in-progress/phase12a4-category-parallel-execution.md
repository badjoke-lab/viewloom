# Phase 12A-4 category parallel execution

Status: active WIP  
Tracking issue: #659

## Current position

- Twitch and Kick permanent category capture are active and provider-separated on the existing five-minute cadences.
- Corrected Twitch category-source-v2 observation completed successfully in run `30620512044`.
- Evidence is frozen and temporary production execution paths are retired in PR #697 / #698.
- Provider-scoped semantic handling was accepted in PR #699.
- The revised seven-day Twitch stability clock was accepted in PR #700.

## Current gate

Active seven-day Twitch stability accumulation:

```text
start: 2026-07-31T17:00:00.000Z (2026-08-01 02:00 JST)
end-exclusive: 2026-08-07T17:00:00.000Z (2026-08-08 02:00 JST)
expected slots: 2016
cadence: 5 minutes
```

The existing Twitch collector continues unchanged. No start-time workflow, new cron, deployment, checkpoint, D1 mutation, binding change, retention change, Kick change, or operator action occurred.

## Accepted semantic rules

1. Identity remains provider-scoped.
2. Only complete provider-ID/name pairs create references.
3. Incomplete pairs remain null coverage.
4. Synthetic, name-only, and cross-provider mappings are prohibited.
5. Combined-provider category rankings are prohibited.

## Next gate

At or after `2026-08-07T17:00:00.000Z`, run the governed final read-only audit for all 2016 expected slots. Freeze and separately accept the evidence before any final-mode or public cutover decision.

## Required boundaries

- No final audit before the end boundary.
- No observation rerun, recreated temporary execution path, checkpoint rerun, backfill, threshold relaxation, synthetic mapping, or clock reset.
- No Kick, cadence, retention, cross-provider identity, combined ranking, final-mode, or public category UI change.
- The unfiltered Heatmap remains the fallback.
