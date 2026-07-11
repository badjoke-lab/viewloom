# ViewLoom current roadmap

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
Remote schema gate blocked
Current workstream collector Worker deployment evidence and remote schema verification
12A-3 generation authorized no
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 production size evidence: `../audits/12a2-binding-size-production-evidence.json`
- 12A-2 migration acceptance: `../audits/12a2-migration-acceptance.json`
- 12A-2 initial remote schema evidence: `../audits/12a2-remote-schema-production-evidence.json`
- 12A-2 post-bootstrap recheck: `../audits/12a2-remote-schema-post-bootstrap-recheck.json`
- 12A-2 current state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-2 provider size evidence

```text
Twitch current/projected 320.96 / 391.95 MB
Kick current/projected   264.38 / 287.95 MB
schemaMigrationGatePass true
```

## Accepted repository migration

```text
db/d1/004_intraday_rollups.sql
streamer_intraday_rollups
idx_intraday_streamer_day
intraday_rollup_status
```

Local scope, apply, idempotency, schema-shape, empty-table, and no-DML checks passed.

## Controlled apply code state

```text
initial controlled apply PR #502 merged
immediate bootstrap refinement PR #503 merged
provider-separated bindings yes
public DDL endpoint no
new cron no
backfill no
generation no
```

The code allows one immediate bootstrap attempt per Worker isolate, caches known-present state in warm isolates, and retains bounded maintenance retries. Repository merge does not prove Worker deployment.

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

The controlled apply code is merged, but remote schema remains absent and collector Worker deployment is not evidenced. Historical runbooks treat collector deployment as a Cloudflare-side step, and no repository collector deploy workflow has been identified. The recheck does not claim universal automatic deployment failure.

## Current blockers

```text
remote_schema_not_applied
collector_worker_deployment_not_evidenced
account_aggregate_storage_unmeasured
```

12A-3 generation remains unauthorized.

## Forward sequence

```text
collector Worker deployment evidence
  -> controlled bootstrap execution
  -> read-only remote schema verification
  -> 12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
