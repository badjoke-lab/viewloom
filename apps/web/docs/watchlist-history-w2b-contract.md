# Watchlist retained-History W2B contract

Status: active Phase 6 W2B contract
Version: 1.0
Date: 2026-06-24

## Scope

This contract governs the nonvisual retained-History and combined-evidence layer used by Local Watchlist v1.

It covers:

- Twitch `/api/history?period=<7d|30d>&metric=viewer_minutes` responses;
- Kick `/api/kick-history?period=<7d|30d>&metric=viewer_minutes` responses;
- period `topStreamers[]` indexing;
- bounded `daily[].topStreamers[]` appearance indexing;
- retained summaries and most recent retained appearance;
- independent storage, latest, and retained evidence axes;
- period-specific History memory cache;
- initial load, period change, Back/Forward restore, task-local changes, and explicit refresh request counts;
- endpoint failure isolation.

It does not add public Watchlist routes, HTML, CSS, visible wording, Channel/Home integration, polling, API changes, D1 changes, collector changes, cron changes, retention changes, or History UI changes.

## Neutral History snapshot

Schema:

```text
viewloom-watchlist-history-v1
```

Provider states:

```text
ready
partial
empty
error
```

Retained evidence states:

```text
present_retained
absent_usable
history_partial
history_unavailable
```

Mapping:

- complete `fresh` payload with good coverage plus id match -> `present_retained`;
- complete `fresh` payload with good coverage plus no id match -> `absent_usable`;
- partial or demo payload -> `history_partial`, while preserving matched retained facts;
- empty, error, provider mismatch, period mismatch, metric mismatch, unreadable payload, request failure, HTTP failure, or JSON failure -> `history_unavailable`.

Only `ready` permits an absence conclusion. `partial` never proves absence.

## Retained indexes

For each payload:

- build one normalized period Top Streamer index;
- build one normalized daily-appearance index from `daily[].topStreamers[]`;
- keep the first duplicate id in period Top Streamers;
- keep the first duplicate id per day in daily rows;
- sort daily appearances newest first;
- create one retained union index from period and daily evidence;
- allow a daily-only match to establish retained presence;
- preserve whether facts came from the period summary, daily rows, or both.

Retained item facts when supplied:

- normalized provider channel id;
- display name;
- viewer-minutes;
- peak viewers;
- average viewers;
- observed minutes;
- viewer-minute rank;
- peak rank;
- bounded daily appearance count;
- most recent retained appearance;
- period-summary presence;
- daily-appearance presence.

Missing numeric values remain `null`; no zero value is synthesized except the factual daily-appearance count of an indexed retained item.

## Combined evidence

Each stored entry retains independent fields:

```text
stored
latest
retained
```

A latest failure must not remove retained evidence. A History failure must not remove latest evidence. No single combined live/offline or overall availability state is created.

## Request contract

```text
empty list:
  0 Heatmap + 0 History

nonempty initial load:
  1 Heatmap + 1 History

period change to uncached period:
  0 Heatmap + 1 History

period restore from page memory:
  0 Heatmap + 0 History

explicit combined refresh:
  1 Heatmap + 1 History

add/remove/reorder/filter/show operations:
  0 Heatmap + 0 History
```

Additional rules:

- one through fifty entries have the same request count;
- no per-channel request loop exists;
- 7d and 30d History payloads are cached separately in page memory;
- concurrent History refreshes for the same period share one in-flight request;
- concurrent combined refreshes share one latest and one History request;
- Twitch never selects Kick endpoints and Kick never selects Twitch endpoints;
- request functions are injected by the caller;
- no interval or background polling exists.

## Dependency boundary

The W2B model, adapters, and controllers must not directly depend on:

- DOM APIs;
- browser storage globals;
- global `fetch`;
- Channel UI;
- CSS;
- API implementation modules;
- D1 bindings or collector code.
