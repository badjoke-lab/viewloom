# ViewLoom current roadmap

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
Current workstream 12A-4 controlled category schema apply design
Category capture runtime not started
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `../audits/12a1-source-evidence.json`
- 12A-3 generator evidence: `../audits/12a3-generator-enablement-evidence.json`
- 12A-3 post-merge evidence: `../audits/12a3-postmerge-acceptance-evidence.json`
- 12A-4 category source contract: `../audits/12a4-category-source-audit-contract.json`
- 12A-4 category source evidence: `../audits/12a4-category-source-audit-evidence.json`
- 12A-4 category storage contract: `../audits/12a4-category-storage-design-contract.json`
- 12A-4 category storage evidence: `../audits/12a4-category-storage-budget-evidence.json`
- 12A-4 storage acceptance: `../operations/12a4-category-storage-design-acceptance-2026-07-14.md`
- 12A-4 category migration/runtime contract: `../audits/12a4-category-migration-runtime-contract.json`
- 12A-4 disabled-runtime evidence: `../audits/12a4-disabled-runtime-postmerge-evidence.json`
- 12A-4 execution-cost umbrella contract: `../audits/12a4-category-execution-cost-probe-contract.json`
- 12A-4 read-only preflight evidence: `../audits/12a4-category-readonly-preflight-evidence.json`
- 12A-4 controlled schema apply contract: `../audits/12a4-category-controlled-schema-apply-contract.json`
- Current state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-4 source boundary

```text
categorySourceAuditPass true
Twitch provider id path game_id
Twitch name path game_name
Kick provider id path category.id
Kick name path category.name
providerSeparated true
crossProviderCategoryIdentityAllowed false
combinedProviderCategoryRankingAllowed false
```

## Accepted 12A-4 storage and preflight boundary

```text
categoryStorageDesignPass true
selectedModel embedded_hourly
categoryContractVersion category-source-v1
raw encoding categoryIds + categoryRefs
category names provider_category_dictionary
long-term encoding category_hourly_json in existing streamer/day rows
newCategoryIndex false
repositoryMigrationCandidateImplemented true
disabledRuntimeProductionAccepted true
readOnlyPreflightAccepted true
readOnlyPreflightAcceptancePr 523
productionCategorySchemaPresent false
remoteMigrationApplyAuthorized false
boundedProductionProbeAuthorized false
runtimeCaptureAuthorized false
```

```text
Twitch projected total/headroom 438.70 / 11.30 MB
Kick projected total/headroom 314.57 / 135.43 MB
Account projected total/headroom 3716.59 / 891.41 MB
```

## Current implementation boundary

```text
12A-3 complete and accumulating
12A-4-0 source verification complete
12A-4-1 category storage design and budget accepted
12A-4-2 category migration and disabled runtime accepted
12A-4-3 read-only production preflight accepted
12A-4-4 controlled provider schema apply design current
production temporary schema Worker deployment not authorized by this design PR
production category schema apply not authorized by this design PR
bounded production cost probe not authorized
production category writes not authorized
category runtime capture not authorized
raw retention unchanged
new cron not authorized
backfill not authorized
category analytics UI not authorized
```

The current task is to prepare and validate the exact provider-separated controlled schema apply package. It must prove migration parity, partial-schema stop behavior, second-pass no-op behavior, provider order, deletion requirements, and failure policy before a separate one-time production trigger is considered.

## Forward sequence

```text
12A-4 controlled provider-separated category schema apply
  -> bounded provider-separated category execution-cost probe
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15.
