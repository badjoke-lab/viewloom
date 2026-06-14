# Heatmap Semantic LOD

This document records PR 6 of the 12-PR Heatmap repair schedule.

## Purpose

PR 5 rebuilt the field geometry so every valid observed record remains visible in one dense treemap. PR 6 controls how much information each tile shows at the current camera scale.

The layout is not rebuilt when labels appear or disappear. LOD is recalculated from final screen-space tile dimensions during redraw.

## LOD levels

### LOD 0 — fill only

Used when the tile is too small for reliable text. The tile remains fully rendered and selectable.

### LOD 1 — short label

Shows a compact grapheme-safe label when a very small tile has just enough space for a text cue.

### LOD 2 — display name

Shows the display name on one line with measured truncation.

### LOD 3 — name and viewers

Adds current viewers at the lower edge.

### LOD 4 — name, viewers, and momentum

Adds the signed momentum value. Viewers and momentum share the lower row when width permits and use separate rows when needed.

### LOD 5 — close-view detail

Adds secondary detail such as observed rank, activity, and channel login when the tile has enough screen-space area. A selected tile can enter this level slightly earlier when its geometry can support the extra detail.

## Long-name handling

- text is measured before drawing
- `fillText` maximum-width compression is not used
- Latin names prefer breaks near spaces, underscores, and hyphens
- unbroken Latin names are split safely when required
- Japanese and other no-space labels wrap by grapheme
- emoji sequences use grapheme segmentation and are not split in the middle
- ellipsis is added only after measured fitting

## Screen-space behavior

Font size, padding, and thresholds are expressed in CSS-pixel terms and converted back into world units for Canvas drawing. This means:

- labels retain readable visual weight during zoom
- small tiles reveal information as their projected size increases
- zoom does not change tile geometry or record count
- rank is not used to force text into unreadable rectangles

## Scope boundary

This PR does not add the final camera button set, refresh behavior, camera clamping changes, Split continuation rail, complete selected-stream inspector, mobile bottom sheet, or keyboard navigation. Those remain PR 7 through PR 12.

## Verification

The semantic LOD verifier checks:

- all six LOD levels are reachable
- increasing zoom never reduces detail
- selected close-view detail promotion works
- Japanese, long Latin, and emoji labels are segmented safely
- tile rendering uses screen-space dimensions rather than rank-based label exceptions
