# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-12

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design/migration/deploy/schema accepted through PR #506
12A-3 bounded generation and accumulation complete through PR #511
12A-4 category source audit accepted PR #513
Production intraday generation started yes
Current workstream 12A-4 provider-specific category storage design and budget gate
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
- Current state: `../audits/12a2-current-gate-state.json`

## Accepted 12A-4 source boundary

```text
categorySourceAuditPass true
storageDesignAuthorized true
runtimeCaptureAuthorized false

Twitch provider id path game_id
Twitch name path game_name
Twitch minimum observed presence ratio 1.0

Kick provider id path category.id
Kick name path category.name
Kick minimum observed presence ratio 1.0

providerSeparated true
crossProviderCategoryIdentityAllowed false
combinedProviderCategoryRankingAllowed false
mainCollectorsRestored true
```

## Current implementation boundary

```text
12A-3 complete and accumulating
12A-4-0 source verification complete
12A-4-1 storage design and budget gate current
production schema change not authorized
category runtime capture not authorized
raw retention unchanged
new cron not authorized
backfill not authorized
category analytics UI not authorized
```

The current task is to compare provider-separated category storage options, define coverage language, project storage growth, measure bounded query/write cost, and choose a migration candidate. No runtime capture may start in this step.

## Forward sequence

```text
12A-4 category storage design and budget gate
  -> migration and disabled runtime implementation
  -> production capture acceptance
  -> 12A-5 foundation acceptance and accumulation handoff
  -> Phase 13-14 localization with evidence accumulation
  -> Phase 15 capability and calibration audit
  -> Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15.
