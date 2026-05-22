# Kick status registry feedback

This document records the registry fields exposed by `/api/kick-status`.

## Summary

`/api/kick-status` now reads latest snapshot `collectorMeta` and exposes registry target and feedback state.

Top-level fields:

```text
coverageMode
targetSource
registryCandidateCount
registryError
registryFeedback
```

Collector fields:

```text
collector.coverageMode
collector.targetSource
collector.registryCandidateCount
collector.registryError
collector.registryFeedback
```

Latest snapshot fields:

```text
latestSnapshot.coverageMode
latestSnapshot.targetSource
```

## registryFeedback

Shape:

```json
{
  "applied": true,
  "observedUpdated": 3,
  "missedUpdated": 72,
  "error": null
}
```

Meaning:

- `applied`: whether registry feedback ran for the latest snapshot.
- `observedUpdated`: observed live candidates updated.
- `missedUpdated`: attempted but not observed candidates updated.
- `error`: sanitized feedback error, if any.

## Coverage meaning

`registry` means registry-backed candidate selection.

It does not mean Twitch parity, directory coverage, or global Kick discovery.

## UI copy rule

Status UI should treat registry coverage as an improvement over seed-list coverage while still showing that Kick is not directory coverage.

Suggested wording:

```text
Registry-backed candidate coverage is active. This improves target management but is not live directory coverage.
```

## Non-goals

This document does not run migration, import rows, add discovery, remove seed-list fallback, or claim Kick parity.
