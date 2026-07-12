# ViewLoom

ViewLoom is an independent, unofficial observatory for retained Twitch and Kick live-stream data. Twitch and Kick remain separate across routes, APIs, bindings, storage, rankings, exports, baselines, relationships, and coverage claims.

## Core roles

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Rivalry and repeated temporal relationships
- History = Trends and retained analytical evidence
- Channel = one retained channel footprint and future personal baseline/run interpretation
- Local Watchlist = browser-local saved evidence

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline                         complete PR #490
12A-1 field contract                   complete PR #492
12A-2 design and migration             accepted through PR #499
12A-2 collector deployment/schema      accepted PR #506
12A-3 account storage gate             accepted PR #507
12A-3 execution-cost gate              accepted PR #508
Twitch remote schema objects           3 / 3
Kick remote schema objects             3 / 3
Account D1 databases measured          8 / 8
Generation storage gate                pass
Generation execution-cost gate         pass
Bounded generator implementation       current / not started
Production generation                  disabled
```

## Phase 12A permanent authorities

```text
docs/audits/12a0-current-data-capacity-baseline.json
docs/audits/12a1-analytics-field-contract.json
docs/audits/12a1-source-evidence.json
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-collector-worker-deploy-evidence.json
docs/audits/12a3-account-storage-gate-contract.json
docs/audits/12a3-account-storage-evidence.json
docs/audits/12a3-execution-cost-probe-contract.json
docs/audits/12a3-execution-cost-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md
docs/operations/12a3-account-storage-acceptance-2026-07-12.md
docs/operations/12a3-execution-cost-acceptance-2026-07-12.md
```

## Accepted storage evidence

```text
Twitch current/projected: 319.39 / 390.38 MB
Kick current/projected:   268.99 / 292.56 MB
Account databases measured: 8 / 8
Account current/projected: 3551.70 / 3646.26 MB
Account operational ceiling: 4608 MB
generationStorageGatePass: true
```

## Accepted execution-cost evidence

The production probe used the latest complete UTC day and removed every temporary row and Worker service after measurement.

```text
Twitch source snapshots: 288
Twitch retained candidates: 600 / 1996
Twitch aggregate D1 duration / wall: 790.730 / 1368 ms
Twitch full-cap write wall projection: 5040 ms

Kick source snapshots: 288
Kick retained candidates: 200 / 739
Kick aggregate D1 duration / wall: 426.097 / 788 ms
Kick full-cap write wall projection: 1848 ms

Twitch idempotent second pass: true
Kick idempotent second pass: true
Probe rows retained: 0
Temporary Workers retained: no
generationExecutionCostGatePass: true
```

## Current boundary

```text
workerDeploymentEvidencePresent: true
remoteSchemaGatePass: true
accountAggregateMeasured: true
generationStorageGatePass: true
generationExecutionCostGatePass: true
implementationAuthorized: true
generationAuthorized: false
runtimeGenerationStarted: false
remaining implementation boundary: bounded_generator_not_implemented
```

The blockers `remote_schema_not_applied`, `collector_worker_deployment_not_evidenced`, `account_aggregate_storage_unmeasured`, and `generation_execution_cost_unmeasured` are closed.

The next workstream is a separate bounded production generator implementation behind the existing maintenance windows. No backfill, retention extension, new high-frequency cron, category capture activation, exact-session claim, or cross-provider analytics is authorized.

## Forward sequence

```text
12A-3 bounded production generator implementation
  -> production accumulation acceptance
  -> 12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Canonical reading starts at `docs/README.md`. Only accepted evidence and latest-head verification count. Twitch and Kick remain provider-separated.
