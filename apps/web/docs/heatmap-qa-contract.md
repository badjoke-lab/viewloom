# Heatmap QA Contract

This page records the current production contract for the Heatmap view.

- The public Heatmap shell must use the live Heatmap entry.
- Twitch and Kick Heatmap pages must not ship static `Stream A` tile grids.
- The viewport must use cover-fit scaling so the canvas never separates from the visible frame during pan or zoom.
- The viewport must clamp translation after pan, wheel zoom, double-click zoom, reset, and resize.
- A future change that restores contain-fit scaling or static tile selection is a regression.
