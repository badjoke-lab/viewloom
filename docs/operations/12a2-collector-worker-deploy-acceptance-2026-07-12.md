# 12A-2 collector Worker deployment acceptance

Date: 2026-07-12
Workstream: 12A-2 collector Worker deployment evidence and remote schema verification
Status: accepted; remote schema gate passed

## Evidence identity

```text
PR: #506
Evidence head: 6d83eeee128b205bf6656aa2b9eb44ea43c5ed3f
Workflow: One-time 12A2 Collector Deploy CLI
Workflow run: 29158855070
Artifact: phase12a2-one-time-collector-deploy-cli
Artifact ID: 8250263833
Artifact digest: sha256:de3bb82932e4fc88b3460076353a8df884b570a650e15136cba566f30d9ba0cd
Production schema generated at: 2026-07-11T16:01:17.970Z
Permanent evidence: docs/audits/12a2-collector-worker-deploy-evidence.json
```

## Deployment result

```text
Twitch Worker viewloom-collector-twitch
Wrangler CLI exit code 0
binding DB_TWITCH_HOT -> vl_twitch_hot
upload 1.30 sec
trigger deployment 0.57 sec

Kick Worker viewloom-collector-kick
Wrangler CLI exit code 0
binding DB_KICK_HOT -> vl_kick_hot
upload 1.19 sec
trigger deployment 0.57 sec
```

The successful path used Wrangler version 4 directly. The earlier `cloudflare/wrangler-action@v3` wrapper attempts failed before producing useful command diagnostics, so the permanent deploy workflow is changed to the direct Wrangler CLI path that produced accepted evidence.

## Production remote schema result

```text
Twitch schemaComplete true
Twitch observed objects 3 / 3
Twitch probe rowsRead 21
Twitch probe rowsWritten 0
Twitch database size 325.63 MB

Kick schemaComplete true
Kick observed objects 3 / 3
Kick probe rowsRead 21
Kick probe rowsWritten 0
Kick database size 266.71 MB

remoteSchemaGatePass true
```

All expected objects were present with matching definitions in both provider databases:

```text
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

## Closed blockers

```text
remote_schema_not_applied closed
collector_worker_deployment_not_evidenced closed
```

## Remaining blocker

```text
account_aggregate_storage_unmeasured
```

Therefore:

```text
workerDeploymentEvidencePresent true
remoteSchemaGatePass true
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
```

## Safety boundary

```text
direct D1 execute used false
backfill performed false
rollup generation started false
raw retention changed false
new cron added false
category capture activated false
cross-provider analytics added false
```

12A-3 production generation remains prohibited until its remaining storage and execution gates pass.
