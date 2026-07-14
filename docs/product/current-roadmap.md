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
12A-4 migration and disabled runtime accepted through PR #518
Production intraday generation started yes
Current workstream 12A-4 production category execution-cost probe
Category capture runtime not started
```

## Accepted 12A-4 boundary

```text
Twitch source game_id / game_name
Kick source category.id / category.name
providerSeparated true
crossProviderCategoryIdentityAllowed false
combinedProviderCategoryRankingAllowed false

selectedModel embedded_hourly
categoryContractVersion category-source-v1
repositoryMigrationCandidateImplemented true
disabledRuntimeProductionAcceptance true
productionCategorySchemaPresent false
remoteMigrationApplyAuthorized false
productionCostProbeRequired true
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
12A-4-1 storage design and budget accepted
12A-4-2 migration and disabled runtime accepted
12A-4-3 production execution-cost gate current
production category schema apply not authorized by the planning PR
production category writes not authorized
category runtime capture not authorized
raw retention unchanged
new cron not authorized
backfill not authorized
category analytics UI not authorized
```

The current task is to prepare and validate the provider-separated execution-cost gate, then make an explicit remote-migration decision from evidence. Planning may not silently apply the production migration or enable category capture.

## Forward sequence

```text
12A-4 production execution-cost probe and remote migration decision
  -> provider-separated production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15.
