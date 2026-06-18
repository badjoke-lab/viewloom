# Provider observation coverage contract

ViewLoom keeps Twitch and Kick observations separated while exposing a common coverage truth shape.

## Common response invariants

Every feature coverage model must include:

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

The following values are fixed across both providers:

```text
isProviderWide = false
isBounded = true
collectionCadenceSeconds = 300
```

No feature response may describe its observed window as complete provider-wide coverage.

## Provider-specific limits

```text
Twitch topLimit = 300
Kick topLimit = 100
```

These limits remain separate. They must not be added together or presented as a cross-platform ranking or total.

## Provider-specific modes

### Twitch

```text
helix
fixture
unknown
```

The normal target source is `twitch-helix-streams`.

### Kick

```text
official-livestreams
registry
seed-list
```

Kick mode communicates whether the observation came from the official livestream endpoint, registry candidates, or seed-list candidates.

Provider-specific mode names are intentionally not collapsed into one generic label.

## Route separation

Twitch middleware enrichment applies to:

```text
/api/twitch-heatmap
/api/day-flow
/api/battle-lines
/api/history
```

Kick middleware enrichment applies to:

```text
/api/kick-heatmap
/api/kick-day-flow
/api/kick-battle-lines
```

Kick History enriches inside `/api/kick-history` and must not be added to the root middleware route set.

## Storage separation

```text
Twitch helper -> DB_TWITCH_HOT only
Kick helper   -> DB_KICK_HOT only
```

No coverage helper may query the other provider database. No coverage contract may include combined Twitch and Kick counts.

## Existing feature coverage semantics

Provider observation coverage is stored in `coverageModel`.

Feature-specific completeness fields remain independent:

- Battle Lines `coverage` describes timeline bucket completeness.
- History `coverage` describes requested-day completeness.
- Heatmap and Day Flow may retain their existing coverage notes and legacy fields.

Coverage enrichment must preserve the original response state, chart data, rankings, HTTP status, and provider-specific fallback behavior.
