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
12A-2 controlled apply code merged PR #502
12A-2 immediate bootstrap refinement merged PR #503
12A-2 post-bootstrap recheck observed PR #504
Twitch remote schema objects 0 / 3
Kick remote schema objects 0 / 3
Worker deployment evidence absent
Remote schema gate blocked
Current workstream collector Worker deployment evidence and remote schema verification
12A-3 generation authorized no
Generation blockers remote_schema_not_applied, collector_worker_deployment_not_evidenced, account_aggregate_storage_unmeasured
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
- 12A-2 initial remote schema evidence: `audits/12a2-remote-schema-production-evidence.json`
- 12A-2 post-bootstrap schema recheck: `audits/12a2-remote-schema-post-bootstrap-recheck.json`
- 12A-2 current state: `audits/12a2-current-gate-state.json`
- 12A-2 initial remote schema blocked record: `operations/12a2-remote-schema-production-blocked-2026-07-11.md`
- 12A-2 post-bootstrap recheck record: `operations/12a2-remote-schema-production-recheck-2026-07-11.md`
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
12A-2 controlled apply code                         merged through PR #503
12A-2 post-bootstrap production recheck             complete PR #504
Collector Worker deployment evidence                current gate
Remote schema verification                          blocked at 0 / 3 per provider
12A-3 bounded intraday rollup generation            blocked
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## Controlled apply and observed production state

Controlled apply code uses separate Twitch and Kick D1 bindings, exact accepted migration parity, one immediate startup attempt per Worker isolate, warm-isolate presence caching, and bounded maintenance retries. It adds no public DDL endpoint and no new cron.

The production recheck after repository merge still observed:

```text
Twitch schemaComplete false
Twitch observed objects 0 / 3
Kick schemaComplete false
Kick observed objects 0 / 3
remoteSchemaGatePass false
probe rowsWritten 0
```

Repository merge is not deployment evidence. No repository collector deploy workflow has been identified, and historical runbooks treat collector deploy as a Cloudflare-side step. The recheck does not claim universal automatic deployment failure; it records that deployment is not evidenced and remote schema remains absent.

## Forward order

```text
collector Worker deployment evidence
  -> controlled bootstrap execution
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
