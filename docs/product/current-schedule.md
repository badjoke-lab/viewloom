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
Production intraday generation started yes
Current gate 12A-4 production category execution-cost probe
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
12A-4-3 production cost, remote apply, capture acceptance   current
12A-5 foundation acceptance and accumulation handoff        queued
```

## Accepted source and storage gate

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
productionCategorySchemaPresent false
remoteMigrationApplyAuthorized false
productionCostProbeRequired true
runtimeCaptureAuthorized false
providerSeparated true
```

## Exact next action

```text
freeze the Issue #519 provider-separated execution-cost contract
add read-only Twitch and Kick preflight bundles
verify local controlled schema apply and second-pass idempotency
verify dictionary unchanged-name no-op
verify bounded probe rows and complete cleanup
verify category failure does not replace collector success
set explicit acceptance thresholds and stop conditions
perform no production deployment in the planning PR
perform no remote migration apply in the planning PR
leave CATEGORY_CAPTURE_ENABLED absent
write no production category rows
add no backfill
add no new cron
leave raw retention unchanged
add no category analytics UI
```

## Production probe order after planning acceptance

```text
read-only provider preflight
  -> explicit remote schema apply decision
  -> controlled schema apply with capture disabled
  -> bounded provider-separated cost measurement
  -> cleanup and temporary Worker deletion
  -> sanitized evidence freeze
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
- `../audits/12a2-current-gate-state.json`

Do not merge provider category identities or create combined-provider category rankings.
