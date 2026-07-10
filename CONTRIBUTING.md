# Contributing to ViewLoom

## Required reading

Read the development policy, documentation governance, documentation index, roadmap, schedule, program plan, affected specifications, implementation plans, and evidence before changing the repository.

## Current state

```text
Phase 12A Analytics Capture Foundation active
12A-0 current data and capacity baseline complete PR #490
12A-1 analytics field contract complete PR #492
12A-2 rollup design budget accepted PR #494
12A-2 remote D1 size gate tooling installed PR #495
Current workstream 12A-2 remote D1 size gate blocked before migration
Current blocker cloudflare_credentials_missing
Migration started no
```

Permanent current evidence:

```text
docs/audits/12a2-intraday-rollup-design-contract.json
docs/audits/12a2-intraday-rollup-budget-evidence.json
docs/audits/12a2-remote-d1-size-evidence.json
docs/audits/12a2-current-gate-state.json
docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md
docs/operations/12a2-remote-d1-size-gate-blocked-2026-07-11.md
```

## Accepted 12A-2 design

```text
grain provider x day x streamer
hour encoding sparse compact JSON cells
Twitch cap 600 streamers/day
Kick cap 200 streamers/day
intraday retention 90 days
new cron no
raw retention extension no
Twitch safe projected rollup storage 70.99 MB
Kick safe projected rollup storage 23.57 MB
```

## Current blocker boundary

The remote size workflow currently lacks:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The permanent evidence therefore records:

```text
status blocked
blocker cloudflare_credentials_missing
migrationStorageGatePass false
migrationAuthorizedByThisEvidenceAlone false
```

False means not measured / blocked, not capacity failure. Do not invent remote D1 size or headroom values from the 12A-0 payload baseline.

Resume order:

```text
1. make the two repository secrets available
2. rerun Analytics 12A2 Remote D1 Size Gate on main
3. require observed-mode evidence
4. require migrationStorageGatePass=true
5. only then create work-analytics-12a2-migration
```

Until the gate passes, do not include:

```text
D1 migration
compact-rollup runtime generation
raw-retention extension
new high-frequency cron
category capture activation
exact-session claims
cross-provider totals, rankings, baselines, categories, or relationships
```

12A-1 source contracts remain authoritative. Twitch `provider_started_at` is provider-reported evidence only; Kick provider start time remains unavailable; category capture remains unapproved for both providers under the current contract.

## Standard workflow

```text
canonical documents
  -> repository comparison
  -> branch and gate check
  -> implementation
  -> targeted checks
  -> final latest-head evidence
  -> merge
  -> canonical state update
```

Ordinary development uses `work-*`; deliberate runtime validation uses `preview-*`; `main` is production. Twitch and Kick remain provider-separated.
