# Heatmap Split Viewport

This document records PR 8 of the 12-PR Heatmap repair schedule.

## Shared scene

Wide defines the Heatmap world.

- world width is measured from the complete Heatmap layout root
- Split narrows only the visible viewport
- Split does not rebuild the treemap merely because the inspector opens
- Wide and Split use the same world coordinates, tile geometry, and 100% reference scale
- browser resize may rebuild the Wide reference world when the layout root itself changes size

## Initial and switching behavior

- a page loaded directly in Split starts at the left side of the Wide world
- switching layouts preserves zoom and normalized camera center where possible
- selected stream identity is preserved
- if the selected tile would become completely hidden in Split, only the minimum camera movement needed to reveal it is applied
- Reset view returns Split to the left edge of the shared world

## Continuation affordances

Split communicates off-screen content without explanatory text.

- tiles are clipped by the viewport edge
- subtle fades appear only on edges where more world content exists
- a thin horizontal camera-position rail appears at the bottom when horizontal continuation exists
- rail thumb width reflects the visible share of the world
- rail thumb position reflects the current horizontal camera position
- the thumb can be dragged with grab and grabbing cursors

The proposed one-time horizontal nudge remains absent and pending separate approval.

## Responsive boundary

Below the existing single-column breakpoint, Split no longer narrows the map because the inspector moves below it. In that state the continuation rail naturally disappears unless zoom creates off-screen content.

## Verification

The Split viewport verifier checks:

- Wide and Split keep the same base scale
- initial Split shows the left side of the Wide world
- Split viewport width is smaller than world width
- camera center survives Wide/Split restoration
- a hidden selected tile receives only a bounded reveal adjustment
- edge fades and draggable position rail are present
- Twitch and Kick load the same Split sizing contract
- no nudge implementation exists
