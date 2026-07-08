# ViewLoom Analytics Observation System implementation plan

Status: approved future implementation program
Version: 1.0
Created: 2026-07-08
Specification: `analytics-observation-system-spec.md`
Current-state authority: `current-roadmap.md` and `current-schedule.md`
Prior capability audit: `next-feature-data-capability-audit.md`

## 1. Purpose

This plan turns the Analytics Observation System specification into a governed execution sequence that preserves the existing Free Strong collection, retention, provider separation, and public-route contracts.

The program is intentionally split into an early capture foundation, an accumulation window, a capability/calibration audit, and then six product analytics phases.

```text
Phase 12A  Analytics Capture Foundation
Phase 15   Analytics Capability and Calibration Audit
Phase 16A  Baseline Engine
Phase 16B  Anomaly Detection
Phase 16C  Observed Run Intelligence
Phase 16D  Category-relative Analysis
Phase 16E  Co-movement and Relationship Analysis
Phase 16F  Replay and Backtest
```

Phase 13-14 localization may proceed after Phase 12A while forward-only analytics evidence accumulates.

## 2. Entry conditions

Phase 12A may begin only after:

- Phase 11 hosted production monitoring closeout is complete;
- Phase 12 release readiness is complete;
- canonical roadmap, schedule, and program plan agree on the next branch;
- current production storage/capacity evidence is captured;
- Twitch and Kick remain provider-separated.

Phase 16 implementation may begin only after Phase 15 accepts the data foundation, sample support, storage cost, query cost, and false-positive calibration evidence.

## 3. Global rules for every analytics PR

Every PR must state:

```text
provider scope
input tables and fields
new or changed output schema
query window
storage delta estimate
retention policy
cron/schedule impact
coverage behavior
stale/partial/demo behavior
version identifier where rules are involved
browser surface impact
acceptance gate
```

Every PR must preserve:

- separate Twitch/Kick routes, APIs, bindings, identities, baselines, relationships, reports, and claims;
- existing raw retention unless separately approved;
- explicit missing/partial/stale/demo states;
- latest-head evidence rules;
- production smoke ownership for all public routes.

## 4. Phase 12A — Analytics Capture Foundation

Purpose: begin collecting and compacting the evidence that cannot be reconstructed from current long-term daily rollups.

### 12A-0 — current data and capacity baseline

Tasks:

- record current D1 row counts, payload size, oldest/latest raw bucket, daily-rollup counts, collector duration, and relevant query timings;
- verify actual Twitch/Kick source modes and coverage behavior;
- verify current five-minute cadence and rollup/retention schedule behavior;
- record the current field matrix against the prior capability audit;
- identify fields fetched upstream but discarded before storage.

Completion:

- permanent machine-readable baseline evidence exists;
- storage/query budgets are recorded before any migration;
- no runtime change is included.

### 12A-1 — analytics field contract

Tasks:

- define minimum provider-specific fields for baseline, observed-run, and category work;
- decide whether Twitch `started_at` is retained and how its evidence strength is labeled;
- verify a Kick category source before approving category capture;
- define normalized internal category fields without claiming cross-provider identity equivalence;
- define versioned analytics source contracts.

Completion:

- field contract is permanent;
- unsupported fields remain explicitly unavailable;
- provider differences are documented.

### 12A-2 — compact intraday rollup design and migration

Target capability: preserve enough time-of-day structure for 90-day baseline work without retaining raw snapshots for 90 days.

Tasks:

- define `streamer_intraday_rollups` or an equivalent compact model;
- choose a bounded per-stream/day representation;
- include sample support and coverage evidence;
- define retention and indexes;
- estimate row count and bytes/day for Twitch and Kick separately;
- add migration only after budget acceptance.

Completion:

- migration and verifier pass;
- storage estimate is within accepted Free Strong budget;
- no raw-retention extension is introduced.

### 12A-3 — bounded intraday rollup generation

Tasks:

- generate compact intraday rollups from current snapshots;
- prefer existing scheduled execution windows when safe;
- do not add a new high-frequency cron by default;
- add idempotent refresh behavior;
- preserve collection success even when analytics maintenance fails, unless a separate atomicity decision is documented.

Completion:

- forward generation is stable;
- reruns are idempotent;
- collector duration and D1 query/write cost are measured;
- failures are visible in evidence without corrupting raw collection.

### 12A-4 — category capture foundation

Tasks:

- add provider-specific category/game fields only after source verification;
- retain minimum necessary fields;
- define category coverage language;
- begin forward-only accumulation;
- do not launch category analytics UI yet.

Completion:

- category capture is real and provider-specific;
- coverage is measurable;
- storage cost is accepted;
- no combined-provider category ranking exists.

### 12A-5 — foundation acceptance and accumulation handoff

Tasks:

- run provider-separated collector/storage acceptance;
- verify retention and rollup behavior;
- record production evidence;
- freeze Phase 12A schema/output contracts;
- hand off to Phase 13-14 localization while evidence accumulates.

Completion:

- Phase 12A production acceptance exists;
- no analytics UI is required for completion;
- Phase 15 entry metrics and minimum evidence windows are defined.

## 5. Phase 13-14 — localization with evidence accumulation

Analytics feature implementation remains paused while localization proceeds.

During this period:

- intraday rollups continue to accumulate;
- category capture continues to accumulate;
- storage growth is reviewed on the existing maintenance cadence;
- no ad hoc analytics feature bypasses the Phase 15 gate;
- production monitoring continues to protect collector freshness and capacity.

## 6. Phase 15 — Analytics Capability and Calibration Audit

Purpose: decide what the accumulated data can support honestly before Phase 16 UI/product implementation.

### 15A — data sufficiency audit

Measure:

```text
streamer sample counts
weekday x hour support
hour-only support
weekday-only support
provider/category coverage
missing-bucket rates
stale/partial rates
intraday rollup growth
query timings
```

Output:

- accepted fallback hierarchy thresholds;
- accepted minimum sample counts;
- accepted 7d/30d/90d windows by provider and feature;
- rejected or deferred claims.

### 15B — baseline calibration audit

Test robust candidate statistics:

```text
median
p10 / p25 / p75 / p90
MAD or equivalent robust dispersion
```

Determine:

- minimum support for weekday x hour;
- fallback thresholds;
- handling of sparse streamers;
- handling of bounded-set disappearance;
- effect of partial collection.

### 15C — anomaly rule calibration

Create deterministic candidate rules and replay them over bounded retained raw data.

Measure:

```text
detected count
extreme cases
persistence distribution
coverage-related triggers
repeated noisy candidates
threshold sensitivity
```

No public anomaly labels ship from Phase 15 alone.

### 15D — observed-run boundary audit

Evaluate gap policies and evidence confidence.

Determine:

- allowed gap size for one observed run;
- when a gap forces a new run;
- how bounded-set disappearance affects confidence;
- provider-specific start evidence handling;
- exact wording for unsupported session claims.

### 15E — relationship feasibility audit

Measure candidate-set size and compute cost for bounded strategies:

```text
Top N
same observed category
focus streamer neighborhood
anomaly-neighbor candidates
previous relationship candidates
```

Determine which strategies are allowed in Phase 16E.

### Phase 15 completion

Phase 15 closes only when it produces:

- accepted data sufficiency thresholds;
- baseline configuration v1;
- anomaly rule candidate v1;
- observed-run gap/confidence policy;
- category coverage policy;
- relationship candidate policy;
- replay execution policy;
- updated storage/query budget evidence.

## 7. Phase 16A — Baseline Engine

### A0 — baseline pure core

Implement deterministic functions that accept compact observations and configuration, then return baseline facts without UI dependencies.

Required output:

```text
window
context level requested
context level used
sample count
median
p10
p25
p75
p90
MAD or accepted equivalent
insufficient-data state
baseline version
```

### A1 — baseline profile materialization

Add bounded materialization only if Phase 15 evidence shows it is preferable to request-time calculation.

Requirements:

- idempotent refresh;
- explicit retention/version policy;
- provider separation;
- no raw duplication.

### A2 — Channel baseline integration

Channel is the first public home for baseline interpretation.

Initial outputs:

```text
typical range
current or latest retained percentile where honest
30-day median
volatility
consistency
sample support
fallback context used
```

Completion:

- Twitch and Kick browser evidence;
- sparse-data state evidence;
- stale/partial behavior evidence;
- no exact-session claim.

## 8. Phase 16B — Anomaly Detection

### B0 — versioned rule core

Implement pure deterministic anomaly evaluation using baseline output and observed points.

Initial classes:

```text
level deviation
rapid rise
rapid drop
rate anomaly
persistent movement
temporary spike
```

### B1 — bounded event materialization

Materialize only events that meet accepted thresholds. Do not store every score for every five-minute point.

### B2 — first public anomaly surface

Preferred initial surface order:

1. Channel interpretation;
2. compact Heatmap state badge or outline;
3. Day Flow anomaly-window markers.

Completion:

- rule and baseline versions visible in machine-readable output;
- stale/partial suppression tested;
- no causal attribution;
- repeated refresh does not duplicate events.

## 9. Phase 16C — Observed Run Intelligence

### C0 — observed-run model

Build a bounded run model from observations using the Phase 15 gap policy.

Required fields should include:

```text
first_observed
last_observed
observed_span
first_observed_viewers
peak_viewers
median_viewers
last_observed_viewers
time_to_observed_peak
late_run_decline
coverage_confidence
boundary_confidence
```

### C1 — bounded backfill

Allow only a bounded raw backfill inside current retention. Older exact runs are not fabricated from daily rollups.

### C2 — Channel integration

Expose observed runs in Channel with explicit evidence wording.

Completion:

- exact session language is absent;
- provider evidence differences are visible;
- missing, not-observed, and offline are not collapsed.

## 10. Phase 16D — Category-relative Analysis

### D0 — category rollup core

Build compact category intraday summaries from the already accumulated Phase 12A capture.

### D1 — relative metrics

Initial metrics:

```text
streamer growth
observed category growth
relative movement
streamer share
share change
rank movement
Top 1 concentration
Top 5 concentration
```

### D2 — anomaly context enrichment

Add context labels such as:

```text
category-wide movement
isolated relative movement
mixed context
insufficient category coverage
```

Completion:

- no category output from unsupported coverage;
- observed-category language is used where required;
- provider categories are not merged.

## 11. Phase 16E — Co-movement and Relationship Analysis

### E0 — relationship pure core

Extend Battle Lines analytical ownership with bounded relationship calculations.

Candidate metrics:

```text
same-time movement
opposite-movement rate
best observed lag
lag support
post-observation movement
repeat days
directionality
support count
category-adjusted residual movement
```

### E1 — candidate restriction and profile materialization

Use only Phase 15-approved candidate strategies. Retain compact profiles rather than raw pair timelines.

### E2 — Battle Lines integration

Add repeated-relationship interpretation to Battle Lines without replacing its current rivalry semantics.

Completion:

- all-pairs continuous calculation absent;
- minimum support visible;
- no audience-migration causal wording;
- category adjustment only when context coverage is sufficient.

## 12. Phase 16F — Replay and Backtest

### F0 — shared live/replay rule core verification

Prove that live anomaly evaluation and replay use the same rule implementation and versioned configuration.

### F1 — bounded replay runner

Initial scope:

```text
Twitch: up to available 30-day raw retention
Kick:   up to available 60-day raw retention
```

Run as explicit CLI/internal batch infrastructure, not an expensive public-request loop.

### F2 — evaluation output

Required summaries:

```text
detected count
extreme cases
recurring cases
threshold sensitivity
duration distribution
coverage failures
review candidates
```

### F3 — History evidence integration

History may expose bounded materialized anomaly/relationship archives and replay evidence summaries after the replay contract is accepted.

Completion:

- rule-version comparison is reproducible;
- replay does not alter live evidence by default;
- expensive long-window scans are not triggered by ordinary public page loads.

## 13. Branch and PR policy

The exact branch names for each step are set only when the preceding phase closes. Recommended families:

```text
work-analytics-foundation-*
work-analytics-audit-*
work-analytics-baseline-*
work-analytics-anomaly-*
work-analytics-observed-runs-*
work-analytics-category-*
work-analytics-relationships-*
work-analytics-replay-*
```

Do not create later-phase branches early.

Each implementation slice should separate:

```text
spec/contract
migration or storage
pure core
API integration
UI integration
browser acceptance
hosted acceptance
canonical closeout
```

when the scope justifies separate PRs.

## 14. Program completion

The program is complete only when ViewLoom can, within bounded observed evidence:

- describe normal state with explicit support;
- detect and classify unusual movement;
- distinguish short spikes from persistent movement;
- add observed-category context where supported;
- describe repeated temporal relationships without causal overclaiming;
- replay versioned rules against retained history;
- preserve Free Strong capacity, provider separation, and existing public-route quality contracts.
