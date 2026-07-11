# ViewLoom post-Watchlist execution program

Status: active source-of-truth program plan
Version: 7.6
Last updated: 2026-07-11
Current phase: Phase 12A — Analytics Capture Foundation
Current workstream: collector Worker deployment evidence and remote schema verification
12A-3 generation authorized: no
Generation blockers: `remote_schema_not_applied`, `collector_worker_deployment_not_evidenced`, `account_aggregate_storage_unmeasured`

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
12A-3 generation blocked
Phase 13-14 localization queued after Phase 12A
Phase 15 capability and calibration audit queued
Phase 16 analytics observation system gated by Phase 15
```

## Program sequence

```text
collector Worker deployment evidence
  -> controlled bootstrap execution
  -> read-only remote schema verification
  -> 12A-3 generation storage and execution gate
  -> bounded intraday rollup generation
  -> 12A-4 category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization and analytics evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

## Active authorities

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-binding-size-production-evidence.json
docs/audits/12a2-migration-acceptance.json
docs/audits/12a2-remote-schema-production-evidence.json
docs/audits/12a2-remote-schema-post-bootstrap-recheck.json
docs/audits/12a2-current-gate-state.json
docs/product/intraday-rollup-design-v1.md
docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md
docs/operations/12a2-migration-acceptance-2026-07-11.md
docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md
docs/operations/12a2-remote-schema-production-recheck-2026-07-11.md
```

## Accepted provider size and migration evidence

```text
Twitch current/projected 320.96 / 391.95 MB
Kick current/projected   264.38 / 287.95 MB
schemaMigrationGatePass true
repository migration accepted PR #499
```

## Controlled apply code

PR #502 merged provider-separated controlled bootstrap through existing collector D1 bindings. PR #503 added one immediate startup attempt per Worker isolate, warm-isolate presence caching, and bounded maintenance retries.

```text
public DDL endpoint no
new cron no
backfill no
generation no
retention change no
```

Repository merge does not prove Worker deployment.

## Post-bootstrap production recheck

```text
Twitch schemaComplete false; observed 0 / 3
Kick schemaComplete false; observed 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
workerDeploymentEvidencePresent false
```

The merged code has not produced observed remote schema application. Historical runbooks treat collector deployment as a Cloudflare-side operation, and no repository collector deploy workflow has been identified. This state records deployment as not evidenced; it does not make a universal automatic-deploy failure claim.

## Current gate

```text
deploy collector Worker code through an authorized Cloudflare-side process
OR produce independent deployment evidence
then allow controlled bootstrap execution
rerun read-only /api/schema-audit
require Twitch 3 / 3
require Kick 3 / 3
```

12A-3 remains blocked until remote schema verification and generation storage/execution gates pass.

## Remaining Phase 12A

### Collector Worker deployment evidence and remote schema verification

Establish deployment evidence through an authorized Cloudflare-side process or independent deployment observation, then rerun provider-separated schema evidence.

### 12A-3 bounded intraday rollup generation

After all gates pass, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector plus D1 cost.

### 12A-4 category capture foundation

Add only verified provider-specific category/game fields, define coverage language, begin forward-only accumulation, and do not launch category analytics UI.

### 12A-5 foundation acceptance and accumulation handoff

Run provider-separated acceptance, verify retention/rollup behavior, freeze schema/output contracts, and hand off to localization while evidence accumulates.

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated throughout the program.
