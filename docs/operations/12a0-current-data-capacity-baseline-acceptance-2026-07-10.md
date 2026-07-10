# 12A-0 current data and capacity baseline acceptance

Date: 2026-07-10
Workstream: 12A-0 current data and capacity baseline
Status: candidate evidence accepted and frozen

## Accepted evidence identity

```text
PR: #490
Evidence head SHA: 90bd33001a3cd894d933becfceb33984c018b1bf
Workflow: Analytics 12A0 Capacity Baseline
Workflow run: 29094472952
Artifact: phase12a0-capacity-baseline
Artifact ID: 8228170837
Artifact digest: sha256:4c9644aeb7fb065d4660f33055597515927c99d313830afd0793316ebde5c5cf
Generated at: 2026-07-10T13:00:35.069Z
Permanent evidence: docs/audits/12a0-current-data-capacity-baseline.json
```

The dedicated workflow collected production evidence through read-only public APIs, verified the generated artifact, and uploaded the accepted candidate artifact. The branch guard separately verified that the 12A-0 branch contained no runtime or data-path changes.

## Storage baseline

### Twitch

```text
binding: DB_TWITCH_HOT
database: vl_twitch_hot
raw rows: 8,688
rows in latest 24h: 287 / expected 288
cadence ratio: 0.9965
retained payload: 314.14 MB
estimated payload/day: 10.38 MB
accepted raw retention: 30 days
estimated payload at retention: 311.4 MB
oldest raw bucket: 2026-06-10T00:35:00.000Z
latest raw bucket: 2026-07-10T12:55:00.000Z
observed daily-rollup days: 74
```

### Kick

```text
binding: DB_KICK_HOT
database: vl_kick_hot
raw rows: 14,442
rows in latest 24h: 287 / expected 288
cadence ratio: 0.9965
retained payload: 232.96 MB
estimated payload/day: 4.63 MB
accepted raw retention: 60 days
estimated payload at retention: 277.8 MB
oldest raw bucket: 2026-05-20T16:42:00.000Z
latest raw bucket: 2026-07-10T12:55:00.000Z
observed daily-rollup days: 52
```

The single missing expected five-minute row in each latest 24-hour observation is recorded as measured behavior. 12A-0 does not reinterpret 287/288 as exact cadence completion.

## Source and coverage baseline

### Twitch

```text
source mode: real
state: partial
collector state: ok
cadence: 300 seconds
observed count: 300
Top limit: 300
covered pages: 3
hasMore: true
coverage model: bounded top-window observation
```

### Kick

```text
source mode: authenticated
state: fresh
collector state: snapshot_available
cadence: 300 seconds
observed count: 100
Top limit: 100
coverage mode: official-livestreams
target source: official-livestreams
```

Historical Kick source-mode rows at evidence time were:

```text
authenticated: 13,764
public-channel-fallback: 678
```

These counts are retained as historical source-mode evidence. They do not combine provider data and do not claim full provider-wide coverage.

## Daily-rollup evidence boundary

The evidence collector used two adjacent, non-overlapping 90-day History windows per provider.

The older window, 2026-01-12 through 2026-04-11, contained no observations and fell through to `minute_snapshots`. The newer window, 2026-04-12 through 2026-07-10, explicitly reported `read_path=daily_rollups` and contained:

```text
Twitch observed rollup days: 74
Kick observed rollup days: 52
```

Only rows observed through an explicit `daily_rollups` read path count toward the accepted rollup-day baseline.

## Query timing baseline

All values are end-to-end GitHub Actions runner to production HTTP timings. They include network latency and are not isolated D1 timings.

```text
target                    median ms   max ms
------------------------------------------------
data audit                   2411.56   2639.32
Twitch status                 383.97    391.78
Kick status                   521.25    525.43
Twitch History 30d            838.36   1101.09
Kick History 30d              799.56    980.85
Twitch Day Flow             1494.98   2076.09
Kick Day Flow                969.80   1827.05
Twitch Battle Lines         1487.86   1795.56
Kick Battle Lines            711.59    831.20
```

Availability samples in the accepted run:

```text
Twitch Battle Lines: 5 / 5 HTTP 200
Kick Battle Lines:   4 / 5 HTTP 200, 1 / 5 HTTP 503
```

The Kick 503 is accepted as baseline evidence of current availability variation. It is not hidden or converted into a successful timing sample.

## Collector-duration boundary

The current production model does not persist true collector wall-clock duration. 12A-0 therefore records an operational proxy only:

```text
Twitch bucket completion offset: 58.235 seconds
Kick bucket completion offset:   58.380 seconds
```

The proxy includes cron dispatch delay, collection time, and write time. It must not be claimed as pure collector execution duration.

True collector/analytics-maintenance duration instrumentation remains owned by 12A-3 bounded intraday rollup generation.

## Field-loss findings

The accepted machine-readable field matrix confirms the prior capability audit and records current code-path findings.

Most important findings:

- Twitch `started_at` is fetched, used to derive the current activity proxy, and discarded before raw payload storage.
- Twitch stream title, game/category id, game/category name, language, and session id are not currently fetched into the retained payload path.
- Kick category data may be present upstream and `category.name` may be inspected as a title fallback, but category identity is not retained as category data.
- Neither provider currently stores an authoritative session id, exact stream end, or authoritative offline state.
- Long-term daily rollups preserve aggregated daily facts and Top-30 streamer summaries, not full intraday structure.

## Budget decision boundary

12A-0 establishes baseline inputs only.

```text
Twitch current raw payload baseline: 314.14 MB retained, 10.38 MB/day estimated
Kick current raw payload baseline:   232.96 MB retained, 4.63 MB/day estimated
```

12A-2 must estimate provider-specific compact-rollup rows/day, bytes/day, retained size, and query cost against these baselines before any migration is approved.

No migration is authorized by the 12A-0 evidence alone.

## Scope acceptance

The accepted branch contains no:

```text
D1 migration
runtime/API behavior change
collector payload schema change
collection cadence change
observed-window expansion
raw-retention extension
new high-frequency cron
category capture
analytics UI
combined Twitch/Kick metric
cross-provider ranking
```

12A-0 is complete only after the frozen evidence passes latest-head verification and canonical execution state is advanced to 12A-1 analytics field contract.
