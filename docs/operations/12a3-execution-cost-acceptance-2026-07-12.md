# 12A-3 execution cost gate acceptance

Date: 2026-07-12
Workstream: 12A-3 bounded intraday rollup generation
Status: execution-cost gate passed; bounded production generator not started

## Evidence identity

```text
PR: #508
Accepted candidate head: b13f808a51de5d8375532b9413750e66d8f7cb00
Workflow merge SHA: 6fc53e4da749e3fbd6c7a8bb02d90cd8db46420d
Workflow: Analytics 12A3 Execution Cost Probe
Workflow run: 29187282418
Artifact: phase12a3-execution-cost-probe
Artifact ID: 8258409485
Artifact digest: sha256:a6523da05fef711cd431b8803fd725cd7917231c72bd44397f0506b65339f2ab
Observed at: 2026-07-12T09:20:41.973Z
Permanent evidence: docs/audits/12a3-execution-cost-evidence.json
```

## Probe boundary

```text
source day: latest complete UTC day, 2026-07-11
source table: minute_snapshots
Twitch cap: 600
Kick cap: 200
write sample: 25 rollup rows/provider + 1 status row
write passes: 2 identical upsert passes
reserved day: 1900-01-01
cleanup required: yes
retained probe rows: 0
temporary Workers retained: no
production generation started: no
```

## Twitch result

```text
source snapshots: 288
candidate streamers: 1996
retained candidates: 600
aggregate D1 duration: 790.730 ms
aggregate rows read: 491359
aggregate rows written: 0
aggregate wall: 1368 ms
serialized result: 524610 bytes

first 25-row write pass:
  D1 duration: 1.272 ms
  rows written: 77
  wall: 210 ms
  retained rows including status: 26

second identical pass:
  D1 duration: 1.413 ms
  rows read: 26
  rows written: 26
  wall: 246 ms
  retained rows: 26

projected full-cap first pass:
  rows written: 1848
  D1 duration: 30.53 ms
  wall: 5040 ms

total Worker wall: 3392 ms
provider gate: pass
```

## Kick result

```text
source snapshots: 288
candidate streamers: 739
retained candidates: 200
aggregate D1 duration: 426.097 ms
aggregate rows read: 189525
aggregate rows written: 0
aggregate wall: 788 ms
serialized result: 178383 bytes

first 25-row write pass:
  D1 duration: 1.576 ms
  rows written: 77
  wall: 231 ms
  retained rows including status: 26

second identical pass:
  D1 duration: 1.292 ms
  rows read: 26
  rows written: 26
  wall: 209 ms
  retained rows: 26

projected full-cap first pass:
  rows written: 616
  D1 duration: 12.61 ms
  wall: 1848 ms

total Worker wall: 2799 ms
provider gate: pass
```

## Idempotency and cleanup

Both providers retained 26 rows after the first pass and the same 26 rows after the second identical pass. Cleanup then removed all probe rows.

```text
Twitch idempotentRowCount: true
Twitch cleanup remainingRows: 0
Kick idempotentRowCount: true
Kick cleanup remainingRows: 0
```

Temporary service lifecycle also passed for both providers:

```text
deploy exit 0
run exit 0
cleanup exit 0
delete exit 0
```

## Gate result

```text
Twitch provider pass: true
Kick provider pass: true
generationExecutionCostGatePass: true
generationAuthorizedByThisEvidenceAlone: false
productionGenerationStarted: false
```

The blocker `generation_execution_cost_unmeasured` is closed.

## Next boundary

This evidence authorizes implementation of a bounded production generator behind existing maintenance windows. It does not itself authorize ongoing writes.

The generator implementation must preserve:

```text
provider separation
existing cron only
idempotent upserts
no backfill
no raw-retention extension
no category capture
no exact-session fields
observable rows_read / rows_written / duration
failure containment after collector execution
```

## Privacy

Permanent evidence contains no streamer identities, database IDs, Account ID, secret values, raw responses, or deployment logs.
