# Twitch and Kick coverage comparison

This document records the coverage difference that affects ViewLoom feature quality.

## Purpose

ViewLoom must not treat Twitch and Kick as equivalent data surfaces yet.

Twitch currently behaves like a directory-style live stream source.
Kick currently behaves like a seed-list candidate polling source.

That difference directly affects Heatmap, Day Flow, Battle Lines, and History.

## Current comparison

| Area | Twitch | Kick current |
| --- | --- | --- |
| Collection model | directory-style live stream collection | seed-list candidate polling |
| Input universe | live streams returned by the provider-side listing path | known slugs from configured and built-in candidates |
| Unknown live channels | can appear through the listing path | invisible unless already in the seed list or future registry |
| Coverage state | can expose page coverage and `hasMore` | exposes seed-list, attempted, observed, and missed candidates |
| UI density risk | lower | high |
| Parity status | baseline target | not Twitch parity |

## Product impact

Kick can be technically healthy while still weak as a product surface.

Examples:

- `/api/kick-status` may be fresh while the latest snapshot contains only a few observed channels.
- Kick Heatmap may show too few tiles.
- Kick Day Flow may show sparse bands.
- Kick Battle Lines may have too few rival candidates.
- Kick History may not yet support useful weekly or monthly trends.

This should be described as a coverage limitation, not as a chart bug by default.

## Status copy rule

Status surfaces should explain three separate ideas:

1. Is the collector running?
2. How fresh is the latest snapshot?
3. Is the coverage model strong enough for dense product views?

A fresh Kick snapshot only answers the first two questions.
It does not mean Kick has Twitch-like coverage.

## Required API language

Kick status payloads should expose:

```json
{
  "coverageMode": "seed-list",
  "coverageModel": {
    "isTwitchParity": false,
    "isDirectoryCoverage": false
  }
}
```

They should also include text explaining that:

- Kick currently samples known channel candidates;
- each run only observes attempted slugs;
- unknown live channels are not visible unless discovered or imported later;
- registry work improves candidate management, not directory coverage by itself.

## Required next architecture

Move in this order:

```text
1. audit current seed-list performance
2. compare Twitch and Kick coverage honestly
3. plan candidate expansion
4. import seed candidates into kick_channels
5. make collector select from kick_channels
6. add registry feedback loop
7. add discovery or larger permitted candidate sources
8. re-QA Kick feature page density
```

## Non-goals

This document does not:

- claim Kick is fixed;
- claim Kick is Twitch parity;
- run migrations;
- change collector behavior;
- add discovery;
- change feature rendering.
