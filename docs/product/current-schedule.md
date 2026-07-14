# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-14

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and accumulation complete through PR #511
12A-4 category source audit accepted PR #513
12A-4 category storage design accepted PR #514
12A-4 category migration and disabled runtime accepted through PR #518
12A-4 read-only production preflight accepted PR #523
Production intraday generation started yes
Current gate 12A-4 controlled category schema apply design
Category runtime capture started no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline                    complete PR #490
12A-1 analytics field contract                              complete PR #492
12A-2 design/migration/deploy/remote schema                  accepted through PR #506
12A-3 storage/execution/generator/accumulation               complete through PR #511
12A-4-0 category source verification                        accepted PR #513
12A-4-1 category storage design and budget gate             accepted PR #514
12A-4-2 category migration and disabled runtime             accepted through PR #518
12A-4-3 read-only production preflight                      accepted PR #523
12A-4-4 controlled provider schema apply design             current
12A-4-5 bounded provider execution-cost probe               queued
12A-4-6 provider-separated capture acceptance               queued
12A-5 foundation acceptance and accumulation handoff        queued
```

## Accepted source, storage, and preflight gate

```text
Twitch source verified true
Twitch fields game_id / game_name
Kick primary source verified true
Kick fields category.id / category.name
sourceContractAccepted true
storageDesignAccepted true
selectedStorageModel embedded_hourly
repositoryMigrationCandidateImplemented true
disabledRuntimeProductionAccepted true
readOnlyPreflightAccepted true
readOnlyPreflightAcceptancePr 523
productionCategorySchemaPresent false
remoteMigrationApplyAuthorized false
boundedProductionProbeAuthorized false
runtimeCaptureAuthorized false
providerSeparated true
```

## Exact next action

```text
freeze the Issue #519 controlled schema apply design contract
keep migration parity exact with db/d1/005_category_capture.sql
use a provider-shared controlled apply module
use separate temporary Twitch and Kick Worker configs
require exact confirmation APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED
require completely absent pre-schema; stop on partial schema
require Twitch then Kick sequential execution and stop after first provider failure
require second apply to execute zero schema statements
preserve existing rollup rows and collector status in local fixtures
require category dictionary rows remain zero after schema-only apply
set explicit size, latency, leakage, cleanup, and deletion thresholds
perform no production deployment in this design PR
perform no remote migration apply in this design PR
leave CATEGORY_CAPTURE_ENABLED absent
write no production category rows
add no backfill
add no new cron
leave raw retention unchanged
add no category analytics UI
```

## Production order after design acceptance

```text
accepted read-only provider preflight
  -> explicit one-time schema-apply trigger PR
  -> exact main SHA and accepted evidence verification
  -> Twitch inspect / controlled apply / second-pass no-op / post-inspect / delete / HTTP 404
  -> stop on any Twitch failure
  -> Kick inspect / controlled apply / second-pass no-op / post-inspect / delete / HTTP 404
  -> sanitized schema-apply evidence freeze
  -> bounded provider-separated cost probe
  -> capture enablement decision
```

## Governing evidence

- `../audits/12a1-analytics-field-contract.json`
- `../audits/12a1-source-evidence.json`
- `../audits/12a4-category-source-audit-contract.json`
- `../audits/12a4-category-source-audit-evidence.json`
- `../audits/12a4-category-storage-design-contract.json`
- `../audits/12a4-category-storage-budget-evidence.json`
- `../audits/12a4-category-migration-runtime-contract.json`
- `../audits/12a4-disabled-runtime-postmerge-evidence.json`
- `../audits/12a4-category-execution-cost-probe-contract.json`
- `../audits/12a4-category-readonly-preflight-evidence.json`
- `../audits/12a4-category-controlled-schema-apply-contract.json`
- `../audits/12a2-current-gate-state.json`

Do not merge provider category identities or create combined-provider category rankings.
