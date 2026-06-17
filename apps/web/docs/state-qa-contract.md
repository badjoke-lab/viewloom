# Empty / Stale / Error State QA Contract

This page records the production state-rendering contract for ViewLoom live pages.

## Scope

The state QA gate protects the live-rendered feature pages from returning to fake data when the real API is empty, stale, unavailable, or failing.

Covered live entries:

- Heatmap
- Day Flow
- Battle Lines
- History
- Status

## Canonical public states

Feature availability exposed through Home and Status uses exactly these public states:

- `fresh`
- `partial`
- `stale`
- `empty`
- `demo`
- `error`

Status may additionally use `strong_stale`, `failing`, `unconfigured`, and `not_ready` for collector and infrastructure diagnosis. These Status-only states must be normalized before they are copied into feature rows.

Raw endpoint states such as `live`, `ok`, `good`, `poor`, and `fixture` remain implementation or source states. They normalize to the public states above. In particular, `fixture` is a source mode and must be shown publicly as `demo`.

Unknown or unsupported states normalize to `error`; they must not silently appear as healthy or partial data.

## Required behavior

- Empty datasets must render explicit empty-state copy.
- API errors must render explicit unavailable/error copy.
- Missing history rollups must render retained-rollup empty copy.
- Battle Lines must not draw connected lines when all points are missing, offline, or not observed.
- Status feature tables must render an explicit empty row when no feature rows are available.
- State labels such as `unknown`, `error`, `unavailable`, `partial`, and `fresh` are display states, not demo data.

## Regression rule

A page must not fall back to `Stream A`, `Stream B`, hard-coded fake metrics, static SVG charts, or placeholder freshness when the real API has no data.
