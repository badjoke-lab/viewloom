# Watchlist latest-observation W2A contract

Status: active Phase 6 W2A contract
Version: 1.0
Date: 2026-06-24

## Scope

This contract governs the nonvisual latest-observation layer used by Local Watchlist v1.

It covers:

- current Twitch `/api/twitch-heatmap` responses;
- current Kick `/api/kick-heatmap` responses;
- the Twitch nested `latest.payload_json` compatibility shape;
- provider-separated request selection;
- local id indexing and evidence derivation;
- zero-request empty lists;
- one-request nonempty lists;
- cache reuse and in-flight request deduplication.

It does not add a public Watchlist route, HTML, CSS, visible wording, History evidence, Channel/Home integration, polling, API changes, D1 changes, collector changes, cron changes, or retention changes.

## Neutral snapshot

Schema:

```text
viewloom-watchlist-latest-v1
```

Provider states:

```text
live
partial
stale
empty
error
```

Freshness:

```text
fresh
stale
unavailable
```

Preserved provider facts when supplied:

- provider;
- endpoint;
- source;
- target source;
- raw provider state;
- update timestamp;
- coverage mode;
- coverage note;
- channel id;
- display name;
- viewers;
- title;
- momentum;
- provider URL;
- observed start timestamp.

Missing numeric values remain `null`; no zero value is synthesized.

## Item matching

- channel identity uses the W1 normalized provider channel id;
- items are indexed once in a `ReadonlyMap` per response;
- invalid item ids are ignored;
- duplicate response ids keep their first normalized occurrence;
- no fuzzy display-name matching is allowed;
- stored display names are not modified.

## Evidence states

```text
present_fresh
present_stale
absent_usable
latest_unavailable
```

Mapping:

- usable fresh `live` or `partial` snapshot plus id match -> `present_fresh`;
- usable `stale` snapshot plus id match -> `present_stale`;
- usable `live`, `partial`, or `stale` snapshot plus no id match -> `absent_usable`;
- `empty`, `error`, provider mismatch, unreadable payload, request failure, HTTP failure, or JSON failure -> `latest_unavailable`.

`absent_usable` never creates zero viewers and never proves offline status.

## Provider request contract

```text
Twitch: /api/twitch-heatmap
Kick:   /api/kick-heatmap
```

- zero valid saved entries -> zero requests;
- one through fifty saved entries -> exactly one provider request;
- repeated load, filtering, expansion, add, remove, or reorder reuses the cached snapshot;
- explicit refresh creates one new provider request;
- concurrent load/refresh calls share the current in-flight request;
- Twitch never selects the Kick endpoint and Kick never selects the Twitch endpoint;
- request failure does not mutate Watchlist storage state;
- no per-channel request loop exists;
- no interval or background polling exists.

## Dependency boundary

The W2A model, adapter, and controller must not directly depend on:

- DOM APIs;
- browser storage globals;
- global `fetch`;
- History endpoints or models;
- Channel UI;
- CSS;
- API implementation modules;
- D1 bindings or collector code.

A request function is injected by the caller.
