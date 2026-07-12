# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design and migration accepted through PR #499
12A-2 collector deployment and remote schema accepted PR #506
12A-3 account storage gate accepted PR #507
12A-3 execution-cost gate accepted PR #508
12A-3 bounded generator enabled PR #510
12A-3 production accumulation accepted PR #511
Twitch remote schema objects 3 / 3
Kick remote schema objects 3 / 3
Account D1 databases measured 8 / 8
Generation storage gate pass
Generation execution-cost gate pass
Production generation started yes
Current workstream 12A-4 provider-specific category capture foundation
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 migration acceptance: `../audits/12a2-migration-acceptance.json`
- 12A-2 deployment evidence: `../audits/12a2-collector-worker-deploy-evidence.json`
- 12A-3 storage evidence: `../audits/12a3-account-storage-evidence.json`
- 12A-3 execution-cost evidence: `../audits/12a3-execution-cost-evidence.json`
- 12A-3 generator evidence: `../audits/12a3-generator-enablement-evidence.json`
- 12A-3 post-merge evidence: `../audits/12a3-postmerge-acceptance-evidence.json`
- Current state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-3 boundary

```text
remoteSchemaGatePass true
generationStorageGatePass true
generationExecutionCostGatePass true
boundedGeneratorEnabled true
postMergeAccumulationPass true
runtimeGenerationStarted true
providerSeparated true
newCronAdded false
backfillPerformed false
temporaryVerifiersRetained false
```

Twitch and Kick now refresh provider-separated intraday rollups during the existing 00:20 and 12:20 UTC maintenance windows. The retained daily limits remain Twitch 600 and Kick 200, with today and yesterday refreshed idempotently.

## Current implementation boundary

```text
12A-3 complete
12A-4 category capture foundation current
category capture runtime not started
cross-provider analytics not allowed
raw retention unchanged
new cron not authorized
```

## Forward sequence

```text
12A-4 provider-specific category capture foundation
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
