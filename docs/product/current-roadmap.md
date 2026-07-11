# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 controlled apply code merged PRs #502-#503
12A-2 collector deployment and remote schema accepted PR #506
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Worker deployment evidence present
Remote schema gate pass
Current workstream 12A-3 generation storage and execution gate
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
- 12A-2 deployment evidence: `../audits/12a2-collector-worker-deploy-evidence.json`
- 12A-2 current state: `../audits/12a2-current-gate-state.json`

## Accepted production state

```text
Twitch projected with safety 391.95 MB
Kick projected with safety   287.95 MB
schemaMigrationGatePass true

Twitch Worker deployment success
Twitch schemaComplete true; objects 3 / 3
Kick Worker deployment success
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0
```

The permanent deployment path uses direct Wrangler 4 CLI with separate provider working directories and bindings. Pull requests verify only; main push and manual dispatch may deploy.

## Closed blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
```

## Current blocker

```text
account_aggregate_storage_unmeasured
```

Therefore 12A-3 generation remains unauthorized.

## Forward sequence

```text
12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
