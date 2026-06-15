# Heatmap PR 11 — Mobile and Accessibility

PR 11 of the 12-PR Heatmap repair schedule completes mobile interaction and keyboard accessibility before final production QA.

## Mobile layout

- mobile widths force Wide layout
- the Split control is hidden and disabled on mobile
- entering mobile width while Split is active switches the page to Wide
- desktop retains the existing Wide and Split options

## Selected-stream bottom sheet

On mobile, selecting a tile opens the selected-stream inspector as a bottom sheet.

- modal dialog semantics
- labelled by the selected stream title
- close button and backdrop dismissal
- Escape closes the sheet
- Tab and Shift+Tab remain inside the open sheet
- focus returns to the Heatmap viewport after closing
- background page scrolling is locked while open
- safe-area bottom padding and reduced-motion behavior are included

## Keyboard operation

The Canvas viewport is keyboard focusable.

- arrow keys move spatially between tiles
- Home and End move to the first and last observed tile
- Enter or Space opens the selected-stream inspector
- plus and minus change zoom
- zero resets the map
- the selected tile remains visually outlined
- a polite live region announces tile position, stream name, viewers, and the inspect action
- visible focus rings are provided for the viewport and controls

## Touch operation

- normal one-finger vertical movement remains page scrolling
- a tap selects and opens stream details
- Move map explicitly enables one-finger panning
- two-finger pinch remains available while Move map is enabled
- drag and tap remain separated by the existing movement threshold

## Scope boundary

PR 12 remains responsible for Twitch and Kick browser QA, performance gates, legacy renderer removal, and the final production cutover decision.

The optional one-time horizontal nudge remains absent and pending separate approval.
