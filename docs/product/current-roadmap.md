# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-11

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production provider-size evidence accepted PR #498
Current workstream 12A-2 empty schema migration
Schema migration authorized yes
Schema migration started no
Exact next branch work-analytics-12a2-migration
12A-3 generation authorized no
Generation blocker account_aggregate_storage_unmeasured
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `../audits/12a1-source-evidence.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 production size evidence: `../audits/12a2-binding-size-production-evidence.json`
- 12A-2 current gate state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-2 design

```text
grain provider x day x streamer
Twitch cap 600/day
Kick cap 200/day
intraday retention 90 days
new cron no
raw retention extension no
Twitch safe projection 70.99 MB
Kick safe projection 23.57 MB
```

## Accepted production size gate

```text
Twitch current remote size 320.96 MB
Twitch projected with safe rollup 391.95 MB
Twitch provider migration gate true

Kick current remote size 264.38 MB
Kick projected with safe rollup 287.95 MB
Kick provider migration gate true

schemaMigrationGatePass true
```

The legacy Wrangler control-plane path remains blocked by missing repository credentials, but accepted binding-based production evidence supersedes that blocker for provider schema-migration authorization.

## Current boundary

The next allowed branch is:

```text
work-analytics-12a2-migration
```

12A-2 migration may add only the accepted empty tables and indexes. It must not backfill or start generation.

12A-3 remains blocked:

```text
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
blocker account_aggregate_storage_unmeasured
```

## Forward sequence

```text
12A-2 empty schema migration
  -> migration acceptance
  -> 12A-3 generation gate and bounded generation
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
