# ViewLoom current execution schedule

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
Current gate 12A-3 bounded production generator implementation
Production generation started no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design/migration/deploy/remote schema          accepted through PR #506
12A-3 account-wide storage gate                     accepted PR #507
12A-3 execution-cost gate                           accepted PR #508
12A-3 bounded production generator implementation   current / not started
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted gate state

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true
implementationAuthorized true
generationAuthorized false
runtimeGenerationStarted false
```

## Exact next action

```text
extract the accepted provider-separated aggregate/upsert logic into shared runtime code
invoke it after the existing Twitch and Kick collector handlers
run only in the existing 00:20 and 12:20 UTC maintenance windows
refresh today and yesterday only
use idempotent upserts
retain at most Twitch 600 and Kick 200 streamers/day
record rows_read, rows_written, SQL duration, Worker duration, generated rows, and source support
contain analytics failure without changing collector outcome
add no new cron
perform no backfill
keep runtime generation disabled until implementation acceptance and deploy verification
```

## Governing evidence

- `../audits/12a2-intraday-rollup-design-contract.json`
- `../audits/12a2-intraday-rollup-budget-evidence.json`
- `../audits/12a2-migration-acceptance.json`
- `../audits/12a2-collector-worker-deploy-evidence.json`
- `../audits/12a3-account-storage-gate-contract.json`
- `../audits/12a3-account-storage-evidence.json`
- `../audits/12a3-execution-cost-probe-contract.json`
- `../audits/12a3-execution-cost-evidence.json`
- `../audits/12a2-current-gate-state.json`

Do not add unbounded backfill, raw-retention extension, a new high-frequency cron, category capture, exact-session claims, or cross-provider analytics.
