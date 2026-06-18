# Kick feature coverage contract

Kick Heatmap, Day Flow, Battle Lines, and History must expose the same bounded observation truth.

## Required public fields

```text
coverageMode
targetSource
sourceMode
coverage.mode
coverage.topLimit
coverage.isProviderWide
coverage.isBounded
coverage.note
coverageModel
```

`coverageModel` includes:

```text
mode
targetSource
sourceMode
authMode
label
isDirectoryCoverage
isProviderWide
isBounded
description
limitation
sourceLimitation
topLimit
collectionCadenceSeconds
```

## Source modes

```text
official-livestreams
registry
seed-list
fixture
```

All modes are bounded. None represents complete provider-wide coverage.

## Route application

- Kick History applies enrichment inside its route so validation and error responses are covered.
- Kick Heatmap, Day Flow, and Battle Lines are enriched after their existing route handlers by the root Functions middleware.
- Twitch routes are never intercepted by the Kick middleware.
- If Kick storage is unavailable, enrichment derives the safest contract from the response metadata instead of failing the original feature response.
