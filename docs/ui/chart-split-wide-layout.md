# Chart Split / Wide layout QA note

## Scope

This note records the completed Split / Wide chart layout work for ViewLoom core feature pages.

Target pages:

- `/twitch/heatmap/`
- `/twitch/day-flow/`
- `/twitch/battle-lines/`
- `/kick/heatmap/`
- `/kick/day-flow/`
- `/kick/battle-lines/`

History pages are out of scope for this layout pass.

## Completed PRs

- PR-01: shared Split / Wide layout mode foundation
- PR-02: Heatmap Split layout
- PR-03: Day Flow Split layout
- PR-04: Battle Lines Split layout
- PR-05: responsive polish across chart layouts

## Layout rules

### 1200px and wider

Split layout is available.

Default requested layout is `split`.

The effective layout is:

- `split` when requested layout is `split`
- `wide` when requested layout is `wide`

### Below 1200px

Split is disabled.

The requested layout is preserved, but the effective layout becomes `wide`.

When the viewport returns to 1200px or wider, a preserved requested layout of `split` becomes effective again.

## Page-specific placement

### Heatmap

Split:

- left: heatmap canvas / treemap
- right: selected stream / live status / ranking / legend rail
- below: summary and support / coverage cards

Wide:

- chart first
- rail, summary, support, and coverage below

### Day Flow

Split:

- left: Day Flow chart and time slider
- right: Time Focus / Selected Stream rail
- below: summary / coverage / mode support content

Wide:

- chart first
- rail below
- mobile focus behavior remains narrow-screen only

### Battle Lines

Split:

- primary battle summary stays above the chart
- left: Battle Lines chart
- right: Time Inspector
- below: reversals / secondary battles / feed

Wide:

- existing vertical chart + inspector flow is preserved

## Compatibility

The layout foundation supports:

- `?layout=split`
- `?layout=wide`
- legacy `?layout=theater`, normalized to `wide`
- localStorage-backed requested layout per provider / feature

## Prohibitions preserved

This layout pass did not intentionally change:

- API paths
- collectors
- D1 schema
- data semantics
- History pages
- About / Support / Portal content
