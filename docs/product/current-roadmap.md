# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-11

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
Remote D1 schema apply unverified
Current gate remote schema apply / verification before 12A-3 generation
12A-3 generation authorized no
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 production size evidence: `../audits/12a2-binding-size-production-evidence.json`
- 12A-2 migration acceptance: `../audits/12a2-migration-acceptance.json`
- 12A-2 current state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-2 provider size evidence

```text
Twitch current/projected 320.96 / 391.95 MB
Kick current/projected   264.38 / 287.95 MB
schemaMigrationGatePass true
```

## Accepted repository migration

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Verification passed for branch scope, local apply, second-apply idempotency, exact table/PK/index shape, empty tables after apply, and forbidden DML absence.

## Current blockers

Repository migration acceptance does not prove remote schema application.

```text
remoteSchemaApplied false
remoteApplyEvidencePresent false
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
```

12A-3 generation remains blocked by:

```text
remote_schema_apply_unverified
account_aggregate_storage_unmeasured
```

## Forward sequence

```text
remote schema apply / verification gate
  -> 12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
