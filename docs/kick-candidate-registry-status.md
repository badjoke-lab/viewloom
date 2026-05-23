# Kick candidate registry status

## Status

The current Kick `kick_channels` registry and live probe flow is temporary beta infrastructure.

It is useful for testing real Kick data through ViewLoom pages, but it is not the final Kick architecture.

## Current flow

```text
known candidate slugs
-> per-channel checks
-> registry feedback
-> priority boost
-> observed snapshots
```

## Not equivalent to Twitch

This path must not be described as:

```text
Twitch parity
full Kick coverage
Kick directory coverage
completed Kick collector
```

## Correct wording

Use:

```text
registry-backed candidate coverage
Kick beta coverage
temporary candidate collector
```

## Required next architecture work

The next major task is to investigate whether Kick has a stable live-directory or category-listing source that can replace candidate-first collection.

If a stable directory-like source is found, it should become the primary collector path.

The candidate registry should then become fallback, enrichment, or QA support.

## Completion gate

Kick is not complete until the collector can gather live streams from a directory-like source, or until the project explicitly accepts a lower-scope Kick beta product.
