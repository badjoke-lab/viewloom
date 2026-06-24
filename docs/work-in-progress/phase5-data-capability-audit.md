# TEMPORARY — ViewLoom Phase 5 data-capability audit

Status: active audit
Created: 2026-06-24
Roadmap phase: Phase 5 — next-feature data-capability audit
Branch: `work-phase5-data-capability-audit`
Delete when: the audit decision, stable capability matrix, and approved/no-go result have moved into permanent product documentation.

## 1. Purpose

Determine what ViewLoom can honestly build next from its current Twitch and Kick data paths before approving any new feature implementation.

This branch is audit-only. It must not change:

- product UI or routes;
- API behavior or response schemas;
- D1 schemas or bindings;
- collectors, polling cadence, cron, or retention;
- existing History, Channel, Heatmap, Day Flow, Battle Lines, or Status behavior;
- Twitch/Kick separation.

## 2. Candidates under audit

1. minimal Session page;
2. Category / Game trends;
3. Language trends;
4. Event layer;
5. login-free local Watchlist;
6. Alerts.

No candidate may proceed directly to implementation.

## 3. Required evidence

For each provider and candidate, record:

- retained source fields;
- normalized and stored fields;
- snapshot and rollup resolution;
- raw and rollup retention;
- API exposure;
- provider parity and provider-specific gaps;
- required migration, storage, collector, cron, and operational cost;
- unsupported claims and hard blockers;
- honest MVP boundary.

## 4. Confirmed starting facts

- Twitch collector config: `workers/collector-twitch/wrangler.toml`;
- Kick collector config: `workers/collector-kick/wrangler.toml`;
- both collectors are configured for `*/5 * * * *` polling;
- Twitch and Kick use separate D1 bindings and databases;
- Phase 5 starts from current retained data and does not assume unavailable chat, activity, or exact session events.

## 5. Investigation ledger

| Layer | Twitch evidence | Kick evidence | Decision |
|---|---|---|---|
| provider fetch | pending | pending | pending |
| normalization | pending | pending | pending |
| raw snapshot schema | pending | pending | pending |
| daily rollup schema | pending | pending | pending |
| retention cleanup | pending | pending | pending |
| History API | pending | pending | pending |
| feature candidate fit | pending | pending | pending |

## 6. Candidate decision matrix

| Candidate | Current-data feasibility | Required new collection/storage | Honest MVP | Initial state |
|---|---|---|---|---|
| minimal Session page | pending | pending | pending | audit |
| Category / Game trends | pending | pending | pending | audit |
| Language trends | pending | pending | pending | audit |
| Event layer | pending | pending | pending | audit |
| login-free local Watchlist | pending | pending | pending | audit |
| Alerts | pending | pending | pending | audit |

## 7. Stop rules

- Do not infer exact stream start/end or continuous sessions from gaps without proving the model.
- Do not claim provider-wide coverage from bounded channel or Top-N collection.
- Do not combine Twitch and Kick totals.
- Do not approve an MVP whose core claim requires uncollected fields.
- Do not hide ongoing storage, cron, or operational cost.

## 8. Final required output

The audit closes with one of:

```text
approve exactly one Phase 6 candidate with a bounded implementation plan
or
record an explicit no-go and keep the current product scope
```
