# Twitch feature coverage audit

Audit scope: Twitch Heatmap, Day Flow, Battle Lines, and History public API responses.

## Result

All four APIs remain isolated to Twitch storage and do not mix Kick observations. However, none of the four APIs currently exposes the complete structured provider-observation coverage contract used by Kick.

| Feature | Public route | Provider/platform | targetSource | sourceMode | coverageMode | existing coverage meaning | coverageModel | explicit non-provider-wide |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Heatmap | `/api/twitch-heatmap` | yes | yes | no top-level field | yes | prose note only | no | no |
| Day Flow | `/api/day-flow` | no | no | no | no | prose note only | no | no |
| Battle Lines | `/api/battle-lines` | platform only | no | no | no | observed timeline buckets | no | no |
| History | `/api/history` | platform only | no | no | no | requested-day completeness | no | no |

## Response-path findings

### Heatmap

- Success, empty, stale, and error responses carry `targetSource` and `coverageMode`.
- The collector `source_mode` is only available inside the raw latest row and diagnostic notes.
- There is no top-level `sourceMode`, `coverage`, or `coverageModel` contract.
- No response explicitly states that Top 300 is bounded and not provider-wide.

### Day Flow

- Success, partial, empty, demo-dominant, and error responses do not identify provider, target source, source mode, or configured Top 300 observation scope.
- `coverageNote` describes bucket completeness, not provider observation coverage.
- Existing response fields must remain compatible with the current renderer.

### Battle Lines

- Success and error responses inherit one shared payload builder.
- Existing `coverage` describes timeline bucket completeness and must not be replaced.
- `source` remains `api` even when the payload state is `demo`; `sourceMode` is not surfaced.
- No structured provider observation coverage is present.

### History

- Success, empty, demo, validation-error, oversized-range, and internal-error paths use the shared History model.
- Existing `coverage` describes requested-day completeness and must not be replaced.
- `source` is `real` or `demo`, but target source, source mode, Top 300, cadence, and bounded/provider-wide truth are absent.
- Error responses currently retain `source: real`; C5 should add coverage truth without changing existing History state behavior.

## C5 implementation requirements

Add a shared Twitch coverage helper and append a separate `coverageModel` to every response path.

Required fields:

```text
coverageMode
targetSource
sourceMode
coverageModel.mode
coverageModel.targetSource
coverageModel.sourceMode
coverageModel.label
coverageModel.isDirectoryCoverage
coverageModel.isProviderWide = false
coverageModel.isBounded = true
coverageModel.description
coverageModel.limitation
coverageModel.topLimit = 300
coverageModel.collectionCadenceSeconds = 300
```

Compatibility rules:

- Do not replace Battle Lines timeline `coverage`.
- Do not replace History day-completeness `coverage`.
- Do not alter chart, ranking, state, or fallback behavior in the coverage adoption PR.
- Do not read `DB_KICK_HOT` or include Kick totals.
- Apply enrichment to success, empty, demo, validation error, range error, and internal error responses.
