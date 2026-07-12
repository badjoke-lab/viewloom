# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design and migration accepted through PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
12A-3 execution-cost gate accepted PR #508
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Account D1 databases measured 8 / 8
Generation storage gate pass
Generation execution-cost gate pass
Current workstream 12A-3 bounded production generator implementation
Production generation started no
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
- 12A-3 execution-cost contract: `../audits/12a3-execution-cost-probe-contract.json`
- 12A-3 execution-cost evidence: `../audits/12a3-execution-cost-evidence.json`
- Current state: `../audits/12a2-current-gate-state.json`

## Accepted gates

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true

Twitch aggregate D1 duration / wall 790.730 / 1368 ms
Twitch full-cap write wall projection 5040 ms
Kick aggregate D1 duration / wall 426.097 / 788 ms
Kick full-cap write wall projection 1848 ms

idempotent second pass true
probe rows retained 0
temporary Workers retained no
```

## Closed blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
generation_execution_cost_unmeasured
```

## Current implementation boundary

```text
bounded_generator_not_implemented
implementationAuthorized true
generationAuthorized false
runtimeGenerationStarted false
```

The next change is a bounded provider-specific generator behind the existing maintenance windows. It must preserve idempotency, failure containment, provider separation, cost observability, no backfill, and no new cron.

## Forward sequence

```text
12A-3 bounded production generator implementation
  -> production accumulation acceptance
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
