# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-11

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 remote schema evidence observed PR #501
12A-2 controlled apply code merged PR #502
12A-2 immediate bootstrap refinement merged PR #503
12A-2 post-bootstrap recheck observed PR #504
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Worker deployment evidence absent
Current gate collector Worker deployment evidence and remote schema verification
12A-3 generation authorized no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design and repository migration               accepted through PR #499
12A-2 controlled apply code                         merged through PR #503
12A-2 post-bootstrap production recheck             complete PR #504
Collector Worker deployment evidence                current gate
Remote schema verification                          blocked at 0 / 3 per provider
12A-3 bounded intraday rollup generation            blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Accepted controlled apply code

```text
provider-separated collector D1 bindings
one immediate startup bootstrap attempt per Worker isolate
warm-isolate schema presence cache
bounded maintenance retries at 00:20 and 12:20 UTC windows
exact accepted migration parity
public DDL endpoint no
new cron no
backfill no
generation no
```

## Post-bootstrap production recheck

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
workerDeploymentEvidencePresent false
```

The recheck was performed after PRs #502 and #503 merged, but merge is not deployment evidence. Current repository history/runbooks treat collector deploy as a Cloudflare-side step, and no repository collector deploy workflow has been identified.

## Exact next action

```text
deploy the collector Worker code through an authorized Cloudflare-side process
OR produce independent evidence that the merged Worker code is already deployed
allow a scheduled invocation to execute the one-shot bootstrap
rerun /api/schema-audit
require Twitch 3 / 3 matching objects
require Kick 3 / 3 matching objects
then close remote_schema_not_applied and collector_worker_deployment_not_evidenced as evidence supports
```

Do not claim automatic deployment failure from the recheck alone.

## 12A-3 generation gate

```text
accountAggregateMeasured false
generationStorageGatePass false
generation authorized false
blockers:
  remote_schema_not_applied
  collector_worker_deployment_not_evidenced
  account_aggregate_storage_unmeasured
```

Do not add production writes until these gates close.

## Governing evidence

- `../audits/12a2-intraday-rollup-design-contract.json`
- `../audits/12a2-intraday-rollup-budget-evidence.json`
- `../audits/12a2-binding-size-production-evidence.json`
- `../audits/12a2-migration-acceptance.json`
- `../audits/12a2-remote-schema-production-evidence.json`
- `../audits/12a2-remote-schema-post-bootstrap-recheck.json`
- `../audits/12a2-current-gate-state.json`

Do not bypass deployment, remote-schema, or generation gates with payload-only estimates, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
