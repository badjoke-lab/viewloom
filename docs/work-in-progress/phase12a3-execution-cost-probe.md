# Phase 12A-3 execution cost probe

Status: active production evidence candidate
Branch: `work-analytics-12a3-execution-cost-probe`

## Purpose

Measure provider-separated intraday aggregation and bounded write cost against production D1 without starting continuous generation.

## Probe shape

```text
source day: latest complete UTC day
source table: minute_snapshots
Twitch full candidate cap: 600
Kick full candidate cap: 200
write sample: 25 rollup rows/provider + 1 status row
write passes: 2 identical upsert passes
reserved probe day: 1900-01-01
cleanup: mandatory
retained probe rows: 0 required
```

## Runtime isolation

```text
production collector code changed: no
new cron: no
permanent public route: no
temporary Twitch Worker: viewloom-cost-probe-twitch
temporary Kick Worker: viewloom-cost-probe-kick
same-repository exact branch only: yes
fork secrets: no
temporary Worker deletion: mandatory
```

## Evidence

The workflow records:

```text
source snapshot count
candidate and retained streamer counts
aggregate D1 duration / rows_read / rows_written
aggregate wall time
serialized result size
first write-pass D1 meta and wall time
second idempotent write-pass D1 meta and wall time
full-cap write projections
cleanup outcome
Worker lifecycle exit codes
```

## Boundaries

```text
production generation no
backfill no
raw retention change no
category capture no
exact-session fields no
cross-provider analytics no
```

Passing this probe permits a separate bounded production generator implementation. It does not itself authorize or start continuous generation.
