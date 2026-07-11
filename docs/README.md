# ViewLoom documentation index

Status: source-of-truth map
Last updated: 2026-07-11

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current execution state

```text
Phase 12A Analytics Capture Foundation active
12A-0 baseline complete PR #490
12A-1 field contract complete PR #492
12A-2 design budget accepted PR #494
12A-2 production size evidence accepted PR #498
12A-2 repository migration accepted PR #499
12A-2 remote schema evidence observed PR #501
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Remote schema gate blocked
Current workstream controlled remote schema apply and verification
12A-3 generation authorized no
Generation blockers remote_schema_not_applied, account_aggregate_storage_unmeasured
```

## Current authorities

- Current roadmap: `product/current-roadmap.md`
- Current schedule: `product/current-schedule.md`
- Active program plan: `product/post-watchlist-program-plan.md`
- Analytics specification: `product/analytics-observation-system-spec.md`
- Analytics implementation plan: `product/analytics-observation-system-plan.md`
- 12A-0 baseline: `audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `audits/12a1-source-evidence.json`
- 12A-2 design contract: `audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 production size evidence: `audits/12a2-binding-size-production-evidence.json`
- 12A-2 repository migration acceptance: `audits/12a2-migration-acceptance.json`
- 12A-2 remote schema production evidence: `audits/12a2-remote-schema-production-evidence.json`
- 12A-2 current state: `audits/12a2-current-gate-state.json`
- 12A-2 remote schema blocked record: `operations/12a2-remote-schema-production-blocked-2026-07-11.md`
- Phase 12 release acceptance: `audits/phase12-release-acceptance.json`
- Public surface inventory: `audits/public-surface-inventory.json`
- Current gap state: `audits/public-surface-gaps.json`

## Permanent Watchlist records

- `product/local-watchlist-spec.md`
- `product/watchlist-v1-implementation-plan.md`
- `operations/watchlist-production-acceptance-2026-06-25.md`

## Active Phase 12A

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design and repository migration               accepted through PR #499
12A-2 remote schema observation                     complete PR #501
Controlled remote schema apply / verification       current
12A-3 bounded intraday rollup generation            blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Observed remote schema state

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

The repository migration is accepted, but all expected remote schema objects were observed absent in both provider databases. The next workstream is controlled, idempotent, provider-separated remote apply of the accepted schema, followed by the same read-only probe.

## Forward order

```text
controlled remote schema apply
  -> read-only remote schema verification
  -> 12A-3 generation storage and execution gate
  -> bounded intraday generation
  -> 12A-4 category foundation
  -> 12A-5 foundation acceptance
  -> Phase 13-14 localization and evidence accumulation
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16A-F Analytics Observation System
```

Twitch and Kick remain separate across routes, APIs, bindings, storage, coverage models, baselines, relationships, exports, and analytical claims.
