# Phase 12A-2 compact intraday rollup design

Status: active design and budget measurement
Branch: `work-analytics-12a2-intraday-rollup-design`

## Purpose

Design and budget a bounded provider-separated intraday rollup before any migration is added.

## Candidate design

```text
grain: provider x day x streamer
hour storage: sparse compact JSON cells
Twitch retained cap: 600 streamers/day
Kick retained cap: 200 streamers/day
intraday retention: 90 days
new cron: no
raw retention change: no
category fields: no
exact-session fields: no
```

## Required evidence

The dedicated workflow must produce and verify:

```text
data + primary-key bytes/row
secondary-index bytes/row
90-day projected rows
90-day projected storage
20% safety projection
12A-0 payload baseline + safe rollup projection
index-use query plans
maximum design write bounds
```

## Migration gate

A passing local SQLite budget does not authorize migration.

Before apply:

```text
accepted design budget artifact required
current remote Twitch D1 database-size evidence required
current remote Kick D1 database-size evidence required
provider-specific storage headroom required
migration verifier required
```

## Completion sequence

```text
1. run conservative local storage benchmark
2. verify generated budget artifact
3. freeze accepted budget evidence
4. record design acceptance
5. close design-only PR
6. collect remote D1 size evidence
7. add migration only after storage headroom gate passes
```
