# Phase 12A-0 current data and capacity baseline

Status: active evidence collection
Workstream: 12A-0 current data and capacity baseline
Branch: `work-analytics-12a0-capacity-baseline`

## Purpose

Capture the provider-separated storage, collection, coverage, retention, field, and query-cost baseline that must exist before any Phase 12A migration or analytics capture expansion is approved.

This workstream is evidence-only. It does not change public runtime behavior, D1 schema, collector normalization, collection cadence, observed-window limits, raw retention, daily-rollup retention, bindings, provider separation, or analytics UI.

## Required evidence

The candidate evidence must record, separately for Twitch and Kick:

```text
current raw D1 row count
rows observed in the latest 24 hours
average and maximum raw payload bytes
current retained payload MB
estimated payload MB/day
oldest and latest retained raw bucket
daily-rollup observed-day count through bounded History reads
production source mode
production coverage mode and bounded-window behavior
five-minute cadence behavior
rollup refresh schedule
retention cleanup schedule
collector-duration evidence or an explicit current measurement limitation
relevant production API timing samples
current retained-field matrix
upstream fields fetched or inspected but not retained
storage and query baseline budgets for the 12A-2 migration decision
```

## Evidence method

The dedicated workflow:

```text
.github/workflows/analytics-12a0-capacity-baseline.yml
```

runs the read-only collector:

```text
scripts/collect-12a0-capacity-baseline.mjs
```

against:

```text
https://vl.badjoke-lab.com
```

The collector reads the existing production APIs only. It does not invoke either collector, write D1 rows, alter a schema, trigger a migration, or change a schedule.

Raw storage facts come from the existing provider-separated `/api/data-audit` path. Source and coverage facts come from the provider-specific status APIs. Daily-rollup availability is checked through two adjacent, non-overlapping 90-day History windows per provider; a window counts as rollup evidence only when the History response explicitly reports `read_path=daily_rollups`.

Query timings are end-to-end HTTP timings from the GitHub Actions runner. They are baseline observations, not isolated D1 execution timings.

## Collector-duration limitation

The current production model does not persist true collector wall-clock duration for both providers. 12A-0 therefore records:

```text
measurementStatus = not_persisted
proxyMetric = bucket_completion_offset_seconds
```

The proxy is the difference between the latest five-minute bucket timestamp and the observed collection completion timestamp. It includes cron dispatch delay, collection time, and write time, and must not be presented as pure collector execution duration.

True collector/analytics-maintenance duration instrumentation remains owned by 12A-3, where collector duration and D1 query/write cost must be measured after bounded intraday rollup generation exists.

## Completion sequence

```text
1. run candidate baseline workflow
2. verify generated evidence
3. freeze accepted artifact into docs/audits/12a0-current-data-capacity-baseline.json
4. add permanent operations acceptance record
5. verify latest PR head
6. update canonical program state to 12A-1 only after evidence acceptance
7. squash merge
```

## Prohibited changes

12A-0 must not include:

```text
D1 migration
new analytics table
collector payload schema change
raw-retention extension
new high-frequency cron
observed-window expansion
category capture
session or exact-run claims
combined Twitch/Kick metrics
cross-provider ranking or relationship analysis
public analytics UI
```
