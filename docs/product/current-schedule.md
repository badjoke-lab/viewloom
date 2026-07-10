# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-07-11

```text
Phase 10 complete through U10H
Phase 11 complete and production-closed
Phase 12 English release readiness complete
Current phase: Phase 12A Analytics Capture Foundation
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 rollup design budget accepted PR #494
12A-2 remote D1 size gate tooling installed PR #495
Current state: 12A-2 migration blocked before start
Current blocker: cloudflare_credentials_missing
```

## Phase 12A schedule

```text
12A-0 current data and capacity baseline            complete PR #490
12A-1 analytics field contract                      complete PR #492
12A-2 design budget                                 accepted PR #494
12A-2 remote D1 size gate tooling                   installed PR #495
12A-2 migration                                     blocked before start
12A-3 bounded intraday rollup generation            queued
12A-4 provider-specific category capture foundation queued
12A-5 foundation acceptance and accumulation handoff queued
```

## 12A-0 accepted baseline

```text
Twitch raw rows 8,688; retained payload 314.14 MB; estimated 10.38 MB/day; rollup observed days 74
Kick raw rows 14,442; retained payload 232.96 MB; estimated 4.63 MB/day; rollup observed days 52
Latest 24h cadence 287 / 288 for each provider
```

## 12A-1 accepted field contract

```text
Twitch provider_started_at approved for future capture as provider_reported_start_time
Kick provider_started_at unavailable until source verification
Twitch category capture unapproved
Kick category capture unapproved pending accepted live primary-path evidence
cross-provider identity equivalence prohibited
```

## 12A-2 accepted design

```text
grain provider x day x streamer
hour encoding sparse compact JSON cells
Twitch cap 600/day
Kick cap 200/day
intraday retention 90 days
new cron no
raw retention extension no
```

Accepted local storage projections:

```text
Twitch total measured bytes/row 1,148.83
Twitch projected 90d storage 59.16 MB
Twitch safe projection 70.99 MB

Kick total measured bytes/row 1,143.95
Kick projected 90d storage 19.64 MB
Kick safe projection 23.57 MB

Combined safe projection 94.56 MB
```

The design budget passed local SQLite measurement and query-plan verification. It does not prove current remote D1 headroom.

## Current 12A-2 remote-size gate

Installed workflow:

```text
Analytics 12A2 Remote D1 Size Gate
```

Current permanent evidence:

```text
docs/audits/12a2-remote-d1-size-evidence.json
status blocked
blocker cloudflare_credentials_missing
migrationStorageGatePass false
migrationAuthorizedByThisEvidenceAlone false
```

Required repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Current false gate values mean blocked / not measured. They are not evidence of capacity failure.

## Exact next action

```text
make both repository secrets available
rerun Analytics 12A2 Remote D1 Size Gate on main
require status observed
require migrationStorageGatePass=true
then create work-analytics-12a2-migration
```

No migration branch should be created before the remote-size gate passes.

## 12A-3 — bounded intraday rollup generation

Queued. After migration acceptance, generate compact rollups idempotently, prefer existing schedule windows, avoid a new high-frequency cron by default, and measure collector duration plus D1 query/write cost.

## 12A-4 — category capture foundation

Queued. Add provider-specific category/game fields only after source verification and separate storage acceptance. Do not launch category analytics UI yet.

## 12A-5 — foundation acceptance and accumulation handoff

Queued. Run provider-separated collector/storage acceptance, verify retention and rollup behavior, freeze schema/output contracts, and hand off to Phase 13–14 localization while evidence accumulates.

## Governing analytics documents

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Accepted 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 remote-size evidence: `../audits/12a2-remote-d1-size-evidence.json`
- 12A-2 current gate state: `../audits/12a2-current-gate-state.json`

Do not bypass the storage gate with payload-only estimates, raw-retention expansion, unsupported session/category claims, or cross-provider analytics.
