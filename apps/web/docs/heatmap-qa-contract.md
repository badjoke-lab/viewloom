# Heatmap QA Contract

This page records the current production contract for the Heatmap view.

- The public Twitch and Kick Heatmap shells must use the live Heatmap entry.
- Public Heatmap pages must not ship static `Stream A` tile grids or static selected-stream metrics.
- Every non-empty snapshot must render through the Canvas scene.
- Camera pan and zoom must be clamped so the world never separates from the visible frame.
- Wide and Split must reuse the same world layout and scale.
- Mobile must force Wide and expose selected-stream detail through the bottom sheet.
- The production runtime must not restore the retired DOM tile renderer, DOM viewport transform, or renderer fallback switch.
- The 0 / 1 / 20 / 100 / 300 / 500 record release matrix must remain green.
