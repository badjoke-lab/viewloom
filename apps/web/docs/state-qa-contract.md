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

## Required behavior

- Empty datasets must render explicit empty-state copy.
- API errors must render explicit unavailable/error copy.
- Missing history rollups must render retained-rollup empty copy.
- Battle Lines must not draw connected lines when all points are missing, offline, or not observed.
- Status feature tables must render an explicit empty row when no feature rows are available.
- State labels such as `unknown`, `error`, `unavailable`, `partial`, and `fresh` are display states, not demo data.

## Regression rule

A page must not fall back to `Stream A`, `Stream B`, hard-coded fake metrics, static SVG charts, or placeholder freshness when the real API has no data.
