# Heatmap PR 9 Data Semantics

- `Observed rank` is the selected record's position after sorting the current valid Heatmap snapshot by viewers.
- `Observed share` is selected viewers divided by total viewers in that same observed snapshot.
- Momentum direction uses the existing momentum value and the snapshot bucket window.
- Activity never converts unavailable sampling into a measured zero.
- `Observed since`, duration, and peak are derived from the latest contiguous run in stored five-minute hot snapshots.
- The context query is capped at 288 snapshots. When the run reaches that boundary, duration is labeled as a lower bound.
- A missing selected record ends the contiguous observed run.
- Context failure does not invalidate current snapshot viewers, rank, share, or momentum.
