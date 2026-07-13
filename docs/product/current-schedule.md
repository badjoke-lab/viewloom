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
Production intraday generation started yes
Current gate 12A-4 provider-specific category migration and disabled runtime implementation
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
12A-4-2 category migration and disabled runtime             current
12A-4-3 production cost, remote apply, capture acceptance   queued
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
repositoryMigrationCandidateAuthorized true
remoteMigrationApplyAuthorized false
productionCostProbeRequired true
runtimeCaptureAuthorized false
providerSeparated true
```

## Exact next action

```text
add a new provider-separated category migration candidate after 004_intraday_rollups.sql
add provider_category_dictionary
add category columns to streamer_intraday_rollups and intraday_rollup_status
add compact raw categoryIds/categoryRefs encoding behind a disabled runtime flag
add one set-based dictionary statement only when category capture is explicitly enabled
extend the existing intraday upsert without adding generator statements
add local migration, idempotency, payload, rollup, coverage, and provider-separation fixtures
leave CATEGORY_CAPTURE_ENABLED absent from both production wrangler files
perform no remote migration apply
write no production category rows
add no backfill
add no new cron
leave raw retention unchanged
add no category analytics UI
```

## Governing evidence

- `../audits/12a1-analytics-field-contract.json`
- `../audits/12a1-source-evidence.json`
- `../audits/12a4-category-source-audit-contract.json`
- `../audits/12a4-category-source-audit-evidence.json`
- `../audits/12a4-category-storage-design-contract.json`
- `../audits/12a4-category-storage-budget-evidence.json`
- `../operations/12a4-category-storage-design-acceptance-2026-07-14.md`
- `../audits/12a2-current-gate-state.json`

Do not merge provider category identities or create combined-provider category rankings.
