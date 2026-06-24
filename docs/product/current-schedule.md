# ViewLoom current execution schedule

Status: source of truth
Last updated: 2026-06-24

## 1. Operating rules

- P0 production failures interrupt all planned work.
- P1 defects interrupt the active phase when they block acceptance.
- P2 polish is grouped unless it belongs to the active milestone.
- `work-*` branches are implementation branches; hosted validation uses approved `preview-*` branches only.
- Documentation-only audits do not require Preview.
- After every merge, issue the full merge report before beginning another PR.

## 2. Current position

```text
Production foundation                    complete
Heatmap                                  complete
Day Flow                                 complete
Battle Lines                             complete
History H1-H7                            complete
History production acceptance            complete
Channel C0-C5B                           complete
Channel production acceptance            complete
Report/export R0-R4                      complete through PR #413
Phase 5 data-capability audit             complete through PR #414
Local Watchlist v1                       approved; W0 next, not started
History UI appearance revision            pending screenshots and instructions
```

Current active implementation phase after PR #414 merge:

```text
none
```

Next approved work:

```text
Phase 6 — Local Watchlist v1
W0 — permanent specification and implementation plan
```

Governing permanent records:

```text
docs/product/current-roadmap.md
docs/product/next-feature-data-capability-audit.md
docs/product/channel-and-streamer-spec.md
docs/product/history-and-trends-spec.md
```

## 3. Phase 5 result

Confirmed data boundary:

```text
Twitch: 5m, bounded Top 300, raw 30d, rollups 180d
Kick:   5m, official Top 100 when available, candidate fallback, raw 60d, rollups 180d
Daily rollup: Top 30 streamer facts
```

Not available as reliable retained facts:

```text
exact session start/end
complete session history
authoritative offline status
category history
language history
activity/chat heat
provider-wide complete totals
```

Candidate decisions:

```text
Local Watchlist v1          approved
Observed Runs research      deferred
Category / Game trends      deferred
Event Layer                 deferred
Language trends             not approved
Alerts                      not approved
```

Permanent evidence:

```text
docs/product/next-feature-data-capability-audit.md
```

## 4. Phase 6 W0 requirements

W0 is documentation only. It must freeze:

- provider-specific routes;
- versioned provider-separated localStorage;
- migration and invalid-state behavior;
- saved-entry limit;
- latest and retained evidence states;
- exact absence and limitation language;
- request-count contract;
- responsive, accessibility, and SEO rules;
- W1-W5 acceptance sequence.

Provisional routes:

```text
/twitch/watchlist/
/kick/watchlist/
```

Provisional request boundary:

```text
one provider Heatmap request per load
one provider History request per selected period
all saved ids matched locally
no per-channel request loop
local add/remove/reorder causes no request
```

Required evidence language:

```text
Not in latest observed set — not confirmed offline
Not in retained History result — no complete history is implied
```

## 5. Phase 6 sequence

```text
W0  permanent specification and implementation plan
W1  local state and storage foundation
W2  provider data adapters and evidence states
W3  responsive UI and approved entry points
W4  candidate QA
W5  Preview, production acceptance, and document cleanup
```

W5 is required because Watchlist introduces visible public routes.

## 6. Watchlist v1 non-goals

- definitive live/offline status;
- exact sessions;
- notifications;
- account or cloud synchronization;
- cross-provider identity or totals;
- new D1, collector, cron, or retention work;
- per-channel API request loops;
- category or language history.

## 7. Stop rule

Do not begin W0 before the PR #414 merge report is issued.
