# ViewLoom Analytics Observation System specification

Status: approved future permanent specification
Version: 1.0
Created: 2026-07-08
Roadmap: Phase 12A capture foundation, Phase 15 capability and calibration audit, Phase 16 analytics program
Implementation plan: `analytics-observation-system-plan.md`
Prior capability audit: `next-feature-data-capability-audit.md`

## 1. Purpose

ViewLoom will evolve from a site that collects and displays retained viewer counts into an explainable observation system that can describe normal state, unusual movement, context, repeated relationships, and historical rule evaluation.

The target progression is:

```text
current value
  -> normal state
  -> change
  -> anomaly
  -> context
  -> relationship
  -> historical validation
```

This is not a scale program. It does not treat larger observed-set limits, longer raw retention, more frequent polling, more charts, or constant AI inference as product sophistication.

## 2. Permanent operating constraints

The analytics program must preserve the Free Strong operating model unless a later separately approved infrastructure decision replaces it.

```text
Twitch collection cadence: 5 minutes
Kick collection cadence:   5 minutes
Twitch observed window:    up to 300 streams
Kick observed window:      up to 100 official livestream rows when available
Twitch raw retention:      30 days
Kick raw retention:        60 days
Daily rollup retention:    180 days
Provider separation:       mandatory
```

The following are prohibited by this specification unless separately approved:

- extending raw retention merely to support analytics;
- copying all raw five-minute data into another long-retention table;
- all-pairs continuous relationship calculation across the entire observed set;
- a public request path that repeatedly scans long raw windows;
- new high-frequency cron schedules when existing scheduled execution can safely host bounded maintenance work;
- constant LLM or paid AI API inference;
- cause attribution without evidence;
- cross-provider identity merging, totals, rankings, baselines, or relationships;
- presenting absence from a bounded observed set as authoritative offline state.

## 3. Evidence and language boundary

ViewLoom may describe observed statistical facts and repeated temporal relationships. It must not convert them into unsupported causal claims.

Approved examples:

```text
unusually high compared with baseline
unusual rise
unusual drop
sustained movement
category-wide movement
isolated relative movement
co-movement
post-observation movement
repeated temporal relationship
```

Disallowed without independent evidence:

```text
viewers moved from A to B
A caused B to rise
raid caused the spike
tournament caused the increase
social media caused the movement
```

Analytics output must always preserve source state, coverage state, rule version, and baseline version where applicable.

## 4. Current data boundary

The existing data model is the starting point, not something to hide.

### 4.1 Raw snapshots

Both providers retain bounded five-minute snapshots containing per-stream observed viewer counts. Raw retention is 30 days for Twitch and 60 days for Kick.

This supports bounded intraday analysis including:

- five-minute viewer deltas;
- 15-minute and 30-minute rates of change;
- short-window rises and drops;
- short-window persistence;
- same-time pair comparison;
- bounded lag comparison;
- bounded replay inside raw retention.

### 4.2 Daily rollups

Existing daily rollups retain day-level totals and a bounded Top 30 per-stream summary. They support long-period daily History but do not retain hour-of-day or session boundaries.

Therefore the existing 180-day rollups cannot honestly produce:

- weekday-by-hour baselines;
- hour-of-day baselines;
- time-since-start baselines;
- exact stream sessions;
- category-relative history.

### 4.3 Existing capability boundaries

The prior capability audit remains authoritative for these facts:

- exact sessions are not currently derivable;
- category/game analytics require new collection and rollup work;
- language analytics are not currently supported;
- Battle Lines already contains viewer-derived pair scoring and event semantics;
- scanning many raw days on every public request is not approved.

This specification advances deferred research only by adding the required evidence and storage foundation first.

## 5. Analytics architecture

The target architecture is layered. Each layer must be independently measurable and removable without corrupting the raw collection path.

```text
minute snapshots
  -> compact intraday rollups
  -> baseline profiles
  -> anomaly events and observed runs
  -> category-relative context
  -> relationship profiles
  -> replay and backtest evidence
```

The following table names are architectural targets, not automatic authorization to create all of them at once:

```text
streamer_intraday_rollups
baseline_profiles
analysis_events
observed_runs
category_intraday_rollups
relationship_profiles
analytics_rule_versions
```

Any migration must have a measured storage/query-cost estimate and an explicit retention policy before deployment.

## 6. Baseline Engine

Baseline Engine is the first product analytics capability.

### 6.1 Initial windows

Baseline v1 supports:

```text
7 days
30 days
```

A 90-day intraday baseline is not allowed until compact intraday history has accumulated or a bounded backfill path is approved.

### 6.2 Baseline hierarchy

For each provider-specific streamer identity, the engine may calculate:

```text
overall baseline
hour-of-day baseline
weekday baseline
weekday x hour baseline
```

The preferred lookup hierarchy is:

```text
weekday x hour
  -> hour-of-day when sample support is insufficient
  -> weekday when sample support is insufficient
  -> overall baseline when sample support is insufficient
  -> insufficient data when no honest fallback exists
```

### 6.3 Initial statistics

Baseline v1 should prefer explainable robust statistics:

```text
sample count
median
p10
p25
p75
p90
MAD or equivalent robust dispersion
```

Every returned baseline must expose sample support and the fallback level actually used.

## 7. Anomaly Detection

Anomaly Detection follows Baseline Engine and uses versioned deterministic rules.

Initial classes:

```text
level deviation
rapid rise
rapid drop
rate anomaly
persistent movement
temporary spike
```

A first implementation should distinguish magnitude from persistence. With five-minute snapshots, three consecutive buckets represent 15 minutes and six represent 30 minutes of observed persistence.

An anomaly record should support at least:

```text
provider
streamer_id
rule_version
baseline_version
direction
started_at
last_seen_at
max_score
duration_buckets
coverage_state
context_state
```

Detection must be suppressible or downgraded when data is stale, partial, missing, or demo.

## 8. Observed Run Intelligence

The initial run-level feature is named Observed Run Intelligence, not exact Session Intelligence.

Supported facts may include:

```text
first observed
last observed
observed span
first observed viewers
peak viewers
median viewers
last observed viewers
time to observed peak
late-run decline
coverage confidence
boundary confidence
```

The following claims remain prohibited unless stronger provider evidence is retained and validated:

```text
exact stream start
exact stream end
exact uninterrupted duration
complete session history
authoritative offline interval
```

Twitch and Kick may expose different evidence strength. Provider differences must be visible rather than normalized into unsupported parity.

## 9. Category-relative Analysis

Category-relative analysis requires collection to begin before product UI implementation.

The capture foundation must first verify provider-specific category sources and retain only the minimum normalized fields necessary for bounded analysis.

Initial analytical outputs may include:

```text
streamer growth vs observed category growth
share of observed category viewers
share change
rank movement inside the observed category set
Top 1 concentration
Top 5 concentration
category-relative anomaly
```

Coverage language must say `observed category` when full category coverage is not proven.

Category-relative analysis must not imply Twitch/Kick category identity equivalence unless a later mapping specification proves it.

## 10. Co-movement and Relationship Analysis

Relationship analysis extends Battle Lines instead of creating an unrelated duplicate feature surface.

Initial candidate measures:

```text
same-time movement
opposite-movement rate
lag +5m
lag +10m
lag +15m
lag +30m
post-observation movement
repeat days
directionality
support count
category-adjusted residual movement when category context exists
```

Continuous all-pairs computation is prohibited. Candidate restriction must use one or more bounded strategies such as:

```text
Top N within the selected period
same observed category
focus streamer neighborhood
anomaly-neighbor candidates
previously retained relationship candidates
```

Long-term storage should retain compact relationship summaries, not every five-minute pair point.

## 11. Replay and Backtest

Live detection and replay must share the same pure rule core.

Initial replay scope:

```text
Twitch: bounded by available 30-day raw retention
Kick:   bounded by available 60-day raw retention
```

Initial replay output:

```text
detected count
extreme cases
recurring cases
threshold sensitivity
duration distribution
coverage failures
review candidates
```

Replay begins as a bounded CLI, explicit internal job, or other manual batch path. It must not become an expensive public-request recomputation path.

## 12. UI integration

The analytics program should strengthen existing roles rather than create many new primary pages.

### Channel

First home for personal baseline and observed-run interpretation:

```text
typical range
current percentile
30-day median
volatility
consistency
baseline coverage
observed runs
```

### Heatmap

Compact anomaly state only. Examples:

```text
HIGH VS BASELINE
UNUSUAL RISE
UNUSUAL DROP
```

Anomaly state must not redefine the existing Heatmap size/color semantics without a separate visualization change.

### Day Flow

Bounded overlays or markers for anomaly windows, sustained rise windows, and unusual declines.

### Battle Lines

Primary surface for repeated relationships, observed lag, directionality, support count, and post-observation movement.

### History

Later archive surface for materialized anomalies, recurring cases, relationship history, and replay-derived evidence summaries.

## 13. Scheduling rule

The approved execution order is:

```text
Phase 11 hosted closeout
  -> Phase 12 release readiness
  -> Phase 12A Analytics Capture Foundation
  -> Phase 13-14 localization while forward analytics evidence accumulates
  -> Phase 15 Analytics Capability and Calibration Audit
  -> Phase 16 Analytics Program
       A Baseline Engine
       B Anomaly Detection
       C Observed Run Intelligence
       D Category-relative Analysis
       E Co-movement and Relationship Analysis
       F Replay and Backtest
```

Phase 16 is approved as the future major program, but implementation remains gated by Phase 15 evidence and per-phase entry conditions.

## 14. Definition of success

The analytics program succeeds when ViewLoom can explain, within its bounded observed data and without unsupported causal claims:

1. what is normal for a streamer in the available context;
2. when observed movement is unusual;
3. whether the movement is brief or persistent;
4. whether broader observed context moved at the same time;
5. whether two streams show a repeated temporal relationship;
6. how the current rule behaves when replayed against retained history.

The target is a small, explainable observation system, not a large opaque analytics platform.
