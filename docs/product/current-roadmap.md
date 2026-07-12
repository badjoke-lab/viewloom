# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 repository migration accepted PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Remote schema gate pass
Account D1 databases measured 8 / 8
Generation storage gate pass
Current workstream 12A-3 production execution-cost measurement and bounded generation dry run
12A-3 generation authorized no
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 migration acceptance: `../audits/12a2-migration-acceptance.json`
- 12A-2 deployment evidence: `../audits/12a2-collector-worker-deploy-evidence.json`
- 12A-3 storage contract: `../audits/12a3-account-storage-gate-contract.json`
- 12A-3 storage evidence: `../audits/12a3-account-storage-evidence.json`
- Current state: `../audits/12a2-current-gate-state.json`

## Accepted production and storage state

```text
Twitch schemaComplete true; objects 3 / 3
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true

Twitch current/projected storage 319.39 / 390.38 MB
Kick current/projected storage   268.99 / 292.56 MB
Account databases measured       8 / 8
Account current/projected        3551.70 / 3646.26 MB
Account operational ceiling      4608 MB
Account projected utilization    71.22%
Account projected headroom       1473.74 MB
generationStorageGatePass        true
```

The storage workflow uses D1 Read only, deletes raw control-plane responses, and persists no database names, database IDs, Account ID, or secret values.

## Closed blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
```

## Current blocker

```text
generation_execution_cost_unmeasured
```

Therefore 12A-3 production generation remains unauthorized.

## Forward sequence

```text
12A-3 production execution-cost measurement and bounded generation dry run
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
