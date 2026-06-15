# Heatmap PR 12 — Final QA, Cleanup, and Release Gate

PR 12 closes the twelve-PR Heatmap repair schedule.

## Production renderer

The public Twitch and Kick Heatmap routes now use the Canvas scene directly.

The production runtime no longer contains a DOM renderer branch, a renderer query-string override, or a local-storage fallback to the old implementation. The loading, empty, and error states remain lightweight DOM states, while every non-empty Heatmap snapshot is rendered by the Canvas scene.

## Removed legacy modules

The following obsolete Heatmap modules are removed:

- `src/live/heatmap-viewport.ts`
- `src/live/heatmap-viewport-v2.ts`
- `src/live/heatmap-layout.ts`
- `src/live/heatmap-live-shell.ts`
- `src/live/heatmap-treemap.ts`
- `src/live/heatmap-inspector.ts`

The production verifier fails if these files return or if the live Heatmap runtime reintroduces the old DOM viewport, tile renderer, or CSS-transform camera.

## Public page cleanup

The Twitch and Kick HTML pages retain only neutral pre-hydration mounts for the map and selected-stream inspector. Old static viewer, share, momentum, activity, and stream-link fields are no longer shipped in the initial document.

## Automated release matrix

CI runs all previous Heatmap gates and a final release gate.

The final gate covers these record counts:

- 0
- 1
- 20
- 100
- 300
- 500

For every non-empty case it verifies:

- one valid record produces one tile
- the complete world area is filled
- all rectangles remain inside world bounds
- widths and heights remain positive
- semantic LOD resolves for every tile
- repeated layout is deterministic
- each layout stays under the CI timing ceiling
- the aggregate matrix stays under the CI timing ceiling

The timing ceiling is a regression tripwire for the deterministic layout and LOD path. It is not a claim about real-device frame rate.

## Manual browser acceptance still required before merge

Automated CI cannot replace direct browser inspection. Before merging this PR, the preview should be checked for both Twitch and Kick in current Chrome, Safari, and Firefox where available.

Desktop checks:

- Wide initial view
- Split uses the same world and scale
- right-edge continuation affordance
- horizontal position rail
- drag and modified-wheel zoom
- Reset view, 100%, zoom controls, and Refresh
- tile selection and selected-stream inspector
- keyboard navigation and visible focus

Mobile checks:

- Wide only
- normal one-finger page scrolling
- Move map behavior
- tap selection
- bottom-sheet open, close, Escape, focus return, and scroll lock
- long names and long titles
- portrait and landscape resize

Data-state checks:

- loading
- real non-empty
- real empty
- partial / has-more
- stale and strong stale
- activity available
- sampled zero
- not sampled
- unavailable
- request error

## Pending item

The optional first-open horizontal nudge remains excluded. It is still pending a separate design decision.
