# 12A-2 compact intraday rollup migration acceptance

Date: 2026-07-11
Workstream: 12A-2 compact intraday rollup design and migration
Status: repository migration accepted; remote apply not claimed

## Evidence identity

```text
PR: #499
Accepted head: ba68ab29ef119574038deb3b6d167c05b0b4b94a
Workflow: Analytics 12A2 Migration
Workflow run: 29141999070
Permanent evidence: docs/audits/12a2-migration-acceptance.json
```

## Accepted migration

```text
db/d1/004_intraday_rollups.sql
```

Schema:

```text
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

The same schema file is intended for the separate Twitch and Kick D1 databases.

## Verification result

```text
migration scope guard                     pass
local SQLite apply                        pass
second apply / idempotency                pass
exact table shape                         pass
exact primary-key shape                   pass
exact secondary-index shape               pass
empty after apply                         pass
forbidden DML absent                      pass
```

The migration contains no backfill and no runtime generation logic.

## Evidence boundary

This acceptance means:

```text
repository migration SQL accepted yes
schema contract preserved yes
local apply verified yes
idempotency verified yes
```

It does not mean:

```text
remote Twitch D1 schema applied no evidence
remote Kick D1 schema applied no evidence
runtime generation started no
12A-3 generation authorized no
```

The remote schema must exist before any production generator writes to the new tables. That condition must be verified separately.

## Remaining generation blocker

```text
accountAggregateMeasured false
generationStorageGatePass false
generationAuthorized false
blocker account_aggregate_storage_unmeasured
```

The next program workstream is 12A-3 generation gate and bounded intraday rollup generation, but production generation remains blocked until its storage, remote-schema, and execution-cost gates pass.
