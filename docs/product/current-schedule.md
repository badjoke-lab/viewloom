# ViewLoom current execution schedule

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
Current gate 12A-4 provider-specific category storage design and budget
Category runtime capture started no
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline              complete PR #490
12A-1 analytics field contract                        complete PR #492
12A-2 design/migration/deploy/remote schema            accepted through PR #506
12A-3 storage/execution/generator/accumulation         complete through PR #511
12A-4-0 category source verification                  accepted PR #513
12A-4-1 category storage design and budget gate       current
12A-4-2 migration and disabled runtime implementation queued
12A-4-3 production capture acceptance                 queued
12A-5 foundation acceptance and accumulation handoff  queued
```

## Accepted source gate

```text
Twitch source verified true
Twitch fields game_id / game_name
Kick primary source verified true
Kick fields category.id / category.name
sourceContractAccepted true
storageDesignAuthorized true
runtimeCaptureAuthorized false
providerSeparated true
```

## Exact next action

```text
compare raw-payload, compact daily, hourly-json, and separate-table storage models
preserve provider-native category ids and names
define category observed/missing/partial coverage language
estimate Twitch and Kick bytes/day and 90-day projections separately
measure D1 reads/writes and query duration for bounded candidates
choose retention and index policy
add no migration in the design PR
leave runtime category capture disabled
add no backfill
add no new cron
add no category analytics UI
```

## Governing evidence

- `../audits/12a1-analytics-field-contract.json`
- `../audits/12a1-source-evidence.json`
- `../audits/12a4-category-source-audit-contract.json`
- `../audits/12a4-category-source-audit-evidence.json`
- `../audits/12a2-current-gate-state.json`

Do not merge provider category identities or create combined-provider category rankings.
