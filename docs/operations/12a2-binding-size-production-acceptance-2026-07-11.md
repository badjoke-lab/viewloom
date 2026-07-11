# 12A-2 binding-size production acceptance

Date: 2026-07-11
Workstream: 12A-2 compact intraday rollup design and migration
Status: provider schema-migration gate passed; generation gate still blocked

## Evidence identity

```text
PR: #498
Evidence head: 1d5c8129412ef6feded36bc02d72ff2d7dec93b3
Workflow: Analytics 12A2 Binding Size Production
Workflow run: 29141599674
Artifact: phase12a2-binding-size-production
Artifact ID: 8245314373
Artifact digest: sha256:e682f1d91b01f47b90cc72751985115501434de7b723ec1d52465c9f5e698766
Observed at: 2026-07-11T05:41:29.837Z
Production generated at: 2026-07-11T05:41:29.817Z
Permanent evidence: docs/audits/12a2-binding-size-production-evidence.json
```

## Evidence source

Production endpoint:

```text
https://vl.badjoke-lab.com/api/data-audit
```

Evidence field:

```text
D1Result.meta.size_after
```

The existing audit query was reused. The query wrote zero rows for both providers.

## Twitch result

```text
current remote size:                  320.96 MB
accepted safe rollup projection:       70.99 MB
projected size with safe rollup:      391.95 MB
operational ceiling:                  450.00 MB
projected headroom to hard maximum:   108.05 MB
projected utilization of 500 MB max:   78.39%
provider migration gate:              pass

audit rows read:   8,601
audit rows written: 0
audit SQL duration: 3,026.542 ms
```

## Kick result

```text
current remote size:                  264.38 MB
accepted safe rollup projection:       23.57 MB
projected size with safe rollup:      287.95 MB
operational ceiling:                  450.00 MB
projected headroom to hard maximum:   212.05 MB
projected utilization of 500 MB max:   57.59%
provider migration gate:              pass

audit rows read:   14,643
audit rows written: 0
audit SQL duration: 3,748.056 ms
```

## Gate decision

```text
Twitch provider gate: true
Kick provider gate: true
schemaMigrationGatePass: true
```

The next allowed implementation branch is:

```text
work-analytics-12a2-migration
```

That branch may add only the accepted empty schema and indexes. It must not backfill rows, start rollup generation, extend retention, add a new cron, or activate category capture.

## Remaining generation blocker

This evidence does not measure total account-wide D1 storage across all databases.

Therefore:

```text
accountAggregateMeasured: false
generationStorageGatePass: false
generationAuthorizedByThisEvidenceAlone: false
```

The schema migration gate and generation storage gate are intentionally separate. A schema migration may proceed because the accepted empty schema does not itself begin data growth. 12A-3 generation remains blocked until its storage and execution gates are accepted.
