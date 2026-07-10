# ViewLoom current roadmap

Status: source of truth
Last updated: 2026-07-11

```text
Phase 10 U10A-U10H complete
Phase 11 P11A-P11G complete
Phase 11 production closeout complete
Phase 12 English release readiness complete
R12A legal/support complete
R12B Stripe/support readiness complete
R12C launch package and production closeout complete
Current phase: Phase 12A Analytics Capture Foundation
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 compact rollup design budget accepted PR #494
12A-2 remote D1 size gate tooling installed PR #495
Current state: blocked before 12A-2 migration
Current blocker: cloudflare_credentials_missing
Migration started: no
```

## Phase 12A authorities

- Analytics specification: `analytics-observation-system-spec.md`
- Analytics implementation plan: `analytics-observation-system-plan.md`
- Prior capability audit: `next-feature-data-capability-audit.md`
- 12A-0 baseline: `../audits/12a0-current-data-capacity-baseline.json`
- 12A-1 field contract: `../audits/12a1-analytics-field-contract.json`
- 12A-1 source evidence: `../audits/12a1-source-evidence.json`
- 12A-2 design contract: `../audits/12a2-intraday-rollup-design-contract.json`
- 12A-2 budget evidence: `../audits/12a2-intraday-rollup-budget-evidence.json`
- 12A-2 remote-size evidence: `../audits/12a2-remote-d1-size-evidence.json`
- 12A-2 current gate state: `../audits/12a2-current-gate-state.json`

## Completed 12A-0 baseline

```text
Twitch raw rows 8,688; estimated payload 10.38 MB/day; rollup observed days 74
Kick raw rows 14,442; estimated payload 4.63 MB/day; rollup observed days 52
Latest 24h cadence 287 / 288 for each provider
```

## Completed 12A-1 field contract

```text
Twitch provider_started_at approved for future capture as provider_reported_start_time
Kick provider_started_at unavailable until source verification
Twitch category capture unapproved
Kick category capture unapproved pending accepted live primary-path evidence
cross-provider identity equivalence prohibited
```

## Accepted 12A-2 design budget

PR #494 accepted:

```text
grain provider x day x streamer
Twitch cap 600/day
Kick cap 200/day
intraday retention 90 days
new cron no
raw retention extension no
Twitch safe projected rollup storage 70.99 MB
Kick safe projected rollup storage 23.57 MB
combined safe projection 94.56 MB
```

The local design budget and query plans passed. This did not authorize migration because payload size is not complete remote D1 database size.

## Current blocker

PR #495 installed the authenticated Wrangler remote-size gate. The current workflow environment lacks `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The permanent state is:

```text
remote evidence blocked
blocker cloudflare_credentials_missing
Twitch storage gate false
Kick storage gate false
account storage gate false
migrationStorageGatePass false
migration authorized false
migration started no
```

These false states mean blocked / not measured, not capacity failure.

## Resume path

```text
1. make CLOUDFLARE_API_TOKEN available as a repository secret
2. make CLOUDFLARE_ACCOUNT_ID available as a repository secret
3. rerun Analytics 12A2 Remote D1 Size Gate on main
4. require observed evidence and migrationStorageGatePass=true
5. create work-analytics-12a2-migration only after gate pass
6. add and verify schema migration
7. proceed to 12A-3 generation only after migration acceptance
```

## Approved forward sequence

```text
Phase 12A Analytics Capture Foundation
  12A-0 baseline complete
  12A-1 field contract complete
  12A-2 design accepted / migration blocked
  12A-3 generation queued
  12A-4 category capture foundation queued
  12A-5 foundation acceptance queued
Phase 13-14 localization with evidence accumulation
Phase 15 capability and calibration audit
Phase 16A-F analytics observation system
```

Phase 16 remains gated by Phase 15. Twitch and Kick remain provider-separated.
