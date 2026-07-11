# 12A-2 remote schema production recheck

Date: 2026-07-11
Status: remote schema still absent; Worker deployment not evidenced

## Evidence identity

```text
PR: #504
Evidence head: 984c88bf78ec1ae262d0d186f84609a12a395d87
Workflow: Analytics 12A2 Remote Schema Production
Workflow run: 29143314721
Artifact: phase12a2-remote-schema-production
Artifact ID: 8245882770
Artifact digest: sha256:f1e18a955378f22ae1d8af8a519aabdbbd9c66e20babc885ff564a8d064bce5d
Observed at: 2026-07-11T06:45:14.182Z
Permanent evidence: docs/audits/12a2-remote-schema-post-bootstrap-recheck.json
```

## Code state before recheck

```text
controlled apply code merged PR #502
immediate one-shot bootstrap merged PR #503
```

## Twitch result

```text
schemaComplete false
observedObjectCount 0 / 3
rowsRead 14
rowsWritten 0
```

## Kick result

```text
schemaComplete false
observedObjectCount 0 / 3
rowsRead 14
rowsWritten 0
```

## Gate result

```text
remoteSchemaGatePass false
controlledApplyCodeMerged true
workerDeploymentEvidencePresent false
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
```

Current blockers:

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
```

## Evidence boundary

This recheck proves that both provider databases still lacked all three expected schema objects at the observation time.

It does not by itself prove why the Worker code had not applied schema. Repository history and current runbooks treat collector deployment as a Cloudflare-side operation, and no repository deploy workflow has been identified, but this record does not claim automatic deployment failure as a universal fact.

## Next action

```text
deploy the collector Worker code through an authorized Cloudflare-side process
OR produce independent evidence that the merged Worker code is already deployed
then allow the next scheduled invocation to run the one-shot bootstrap
rerun /api/schema-audit
require Twitch 3 / 3
require Kick 3 / 3
```

12A-3 generation remains prohibited.
