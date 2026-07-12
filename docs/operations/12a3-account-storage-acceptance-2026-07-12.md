# 12A-3 account storage gate acceptance

Date: 2026-07-12
Workstream: 12A-3 generation storage and execution gate
Status: storage gate passed; generation execution-cost gate remains

## Evidence identity

```text
PR: #507
Evidence head: 488fac1a5755d6b615224aa51f8ffb2018038a9d
Workflow: Analytics 12A3 Account Storage Gate
Workflow run: 29175976919
Artifact: phase12a3-account-storage-gate
Artifact ID: 8254945754
Artifact digest: sha256:5ee6365a342a9cf086d861cd354dab29cbb4135c92d81fcde3a7dda26c8bcd0b
Observed at: 2026-07-12T01:56:08.148Z
Permanent evidence: docs/audits/12a3-account-storage-evidence.json
```

## Platform limits and operating ceilings

Cloudflare Workers Free D1 limits observed from the official limits contract:

```text
per database maximum: 500 MB
account storage maximum: 5120 MB
```

ViewLoom uses 90% operational ceilings:

```text
per database: 450 MB
account aggregate: 4608 MB
```

## Twitch result

```text
current size:                  319.39 MB
accepted safe projection:      70.99 MB
projected size:                390.38 MB
operational ceiling:           450.00 MB
projected hard-limit headroom: 109.62 MB
projected utilization:          78.08%
provider storage gate:         pass
```

## Kick result

```text
current size:                  268.99 MB
accepted safe projection:      23.57 MB
projected size:                292.56 MB
operational ceiling:           450.00 MB
projected hard-limit headroom: 207.44 MB
projected utilization:          58.51%
provider storage gate:         pass
```

## Account result

```text
D1 databases measured:          8 / 8
current aggregate size:      3551.70 MB
combined safe projection:      94.56 MB
projected aggregate size:    3646.26 MB
operational ceiling:         4608.00 MB
projected hard-limit headroom:1473.74 MB
projected utilization:          71.22%
account storage gate:          pass
```

## Gate result

```text
Twitch provider pass: true
Kick provider pass: true
account aggregate measured: true
account pass: true
generationStorageGatePass: true
```

The storage blocker `account_aggregate_storage_unmeasured` is closed.

## Remaining boundary

Storage evidence alone does not authorize generation.

```text
generationAuthorizedByThisEvidenceAlone: false
next gate: generation_execution_cost_measurement
runtime generation started: false
backfill performed: false
retention changed: false
```

The next workstream must measure bounded production execution cost before compact intraday rollup generation is activated.

## Privacy

Raw Wrangler responses were deleted before artifact upload. Provider database names and IDs, unrelated account database names, Account ID, and secret values are absent from permanent evidence.
