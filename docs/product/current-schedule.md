# ViewLoom current execution schedule

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
Remote schema gate pass
Current gate 12A-3 generation storage and execution
12A-3 generation authorized no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design/migration/deploy/remote schema          accepted through PR #506
12A-3 generation storage and execution gate         current / blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted production state

```text
Twitch Worker deploy success
Twitch schemaComplete true; objects 3 / 3
Kick Worker deploy success
Kick schemaComplete true; objects 3 / 3
remoteSchemaGatePass true
probe rowsWritten 0
```

## Exact next action

```text
measure account-wide D1 storage through an authorized read-only path
freeze generation storage budget evidence
measure bounded generator query/write execution cost without starting production accumulation
require generationStorageGatePass true
only then authorize bounded 12A-3 generation
```

## Current 12A-3 boundary

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
remaining blocker account_aggregate_storage_unmeasured
```

Do not add production rollup writes, backfill, raw-retention extension, a new high-frequency cron, category capture, exact-session claims, or cross-provider analytics until the remaining gates pass.

## Governing evidence

- `../audits/12a2-intraday-rollup-design-contract.json`
- `../audits/12a2-intraday-rollup-budget-evidence.json`
- `../audits/12a2-binding-size-production-evidence.json`
- `../audits/12a2-migration-acceptance.json`
- `../audits/12a2-collector-worker-deploy-evidence.json`
- `../audits/12a2-current-gate-state.json`
