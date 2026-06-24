# TEMPORARY — ViewLoom Local Watchlist v1 implementation ledger

Status: active implementation ledger
Created: 2026-06-24
Roadmap phase: Phase 6 — Local Watchlist v1
Current branch: `work-watchlist-w0`
Delete when: W5 production acceptance and documentation closure are complete.

## 1. W0 record

Initial W0 status: active W0 specification work
Branch: `work-watchlist-w0`
Closure PR: #415

W0 created:

```text
docs/product/local-watchlist-spec.md
docs/product/watchlist-v1-implementation-plan.md
```

W0 fixed:

- provider-specific secondary routes at `/twitch/watchlist/` and `/kick/watchlist/`;
- provider-separated keys `viewloom.watchlist.twitch.v1` and `viewloom.watchlist.kick.v1`;
- maximum 50 entries per provider and 12 initially visible;
- plain id and same-provider URL input;
- deterministic validation, repair, duplicate, limit, remove, move, clear, reset, and cross-tab behavior;
- empty list sends zero Heatmap and History requests;
- nonempty initial load sends exactly one Heatmap and one History request;
- period change sends History only;
- explicit refresh sends one Heatmap and one History request;
- no per-channel request loop;
- independent latest and retained evidence axes;
- exact absence language preserving `Not confirmed offline` and `No complete history is implied`;
- approved entry points limited to Watchlist form, additive Channel save, and secondary provider Home utility link;
- no alerts, login, cloud sync, exact sessions, cross-provider identity, or server-side user storage;
- W1–W5 sub-PR sequence and hosted acceptance policy.

No Watchlist runtime implementation begins until W0 merges and the full merge report is issued.

## 2. Current position

```text
W0  specification and plan       completion candidate in PR #415
W1  storage foundation           next, not started
W2A latest adapter               queued
W2B History adapter              queued
W3A routes and shell             queued
W3B evidence UI and entry points queued
W3C candidate polish             queued
W4A contract closure             queued
W4B browser QA                   queued
W5A hosted Preview               queued
W5B production closure           queued
```

## 3. W1 handoff

Planned branch:

```text
work-watchlist-w1-storage
```

W1 may add only:

- pure Watchlist model and types;
- provider key selection;
- id and provider URL normalization;
- parse, validation, repair, deduplication, and cap;
- add, remove, move, clear, reset, and storage-event operations;
- `period=7d|30d` URL-state helper;
- executable storage/model/URL verification and workflow.

W1 must not add:

- public Watchlist routes, HTML, or CSS;
- visible Watchlist UI;
- Heatmap or History adapters;
- fetch calls;
- Channel or Home integration;
- API, D1, binding, collector, cron, retention, or production behavior changes.

## 4. Active ledger fields for later PRs

Each later branch updates this note with:

```text
branch and PR
exact files and contracts added
verification and artifact results
known limitations or flake evidence
Preview/production identifiers when applicable
next branch and stop condition
```

## 5. Stop rule

After every merge, issue the full merge report and stop. Do not create the next branch until the user explicitly instructs continuation.
