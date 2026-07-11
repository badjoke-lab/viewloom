# 12A-2 remote schema production evidence

Date: 2026-07-11
Workstream: 12A-2 remote schema apply and verification gate
Status: blocked because remote schema is not applied

## Evidence identity

```text
PR: #501
Evidence head: 18ee65ff21681852cac22a52c6fbf406ed4f16c1
Workflow: Analytics 12A2 Remote Schema Production
Workflow run: 29142529475
Artifact: phase12a2-remote-schema-production
Artifact ID: 8245626079
Artifact digest: sha256:e910df73fd9f94afc205a8254859c79bf27ff1226c5d1c087e7aefc3924845f9
Observed at: 2026-07-11T06:15:48.354Z
Production generated at: 2026-07-11T06:15:48.315Z
Permanent evidence: docs/audits/12a2-remote-schema-production-evidence.json
```

## Twitch result

```text
schemaComplete false
observedObjectCount 0 / 3
streamer_intraday_rollups absent
idx_intraday_streamer_day absent
intraday_rollup_status absent
rowsRead 14
rowsWritten 0
SQL duration 0.286 ms
```

## Kick result

```text
schemaComplete false
observedObjectCount 0 / 3
streamer_intraday_rollups absent
idx_intraday_streamer_day absent
intraday_rollup_status absent
rowsRead 14
rowsWritten 0
SQL duration 0.132 ms
```

## Gate result

```text
Twitch remote schema complete false
Kick remote schema complete false
remoteSchemaGatePass false
```

The result is not ambiguous: all three expected schema objects were absent in both provider databases at the observation time.

Current blockers:

```text
remote_schema_not_applied
account_aggregate_storage_unmeasured
```

## Safety boundary

The probe was read-only.

```text
migration apply performed by probe false
backfill performed by probe false
generation started by probe false
raw SQL definitions persisted false
rows written 0 for both providers
```

## Next action

Use a controlled, idempotent provider-separated remote schema application path for the accepted `db/d1/004_intraday_rollups.sql` schema, then rerun the read-only schema probe and require 3 / 3 matching objects for both providers.

12A-3 production generation remains prohibited until remote schema is complete and its remaining storage/execution gates pass.
