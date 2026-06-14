# ViewLoom Heatmap Repair Contract

Status: implementation contract for the 12-PR Heatmap repair program.

## 1. Purpose

This document fixes the behavior and acceptance criteria for the ViewLoom Heatmap repair before implementation begins. The repair covers the complete Heatmap page for Twitch and Kick: page layout, treemap rendering, camera interaction, data-state truth, selected-stream analysis, responsive behavior, accessibility, and production QA.

The work is split into 12 pull requests. A pull request must not be treated as completion of the Heatmap repair unless its own acceptance gate and the cumulative schedule gate pass.

## 2. Rendering contract

### 2.1 Render every valid observed record

The current valid snapshot set is the Heatmap target set.

- One valid live record equals one tile.
- Every valid observed record in the snapshot must receive a treemap rectangle.
- The renderer must not automatically reduce the field to Top 20, Top 50, or Top 100 for visual convenience.
- Record count is data-dependent. The page must support the actual current field, including roughly 300 Twitch records and roughly 100 Kick records.
- Coverage limits and `hasMore` describe collector coverage; they do not permit the renderer to omit records already present in the valid snapshot.

### 2.2 Visual encodings

- Tile area represents current viewers.
- Tile base color represents momentum direction.
- Color intensity represents momentum strength.
- Activity is a secondary accent only and must not replace area or base color.
- Zero activity and unavailable activity are distinct states.

### 2.3 Small tiles and semantic zoom

Small tiles remain in the scene. Only their displayed information changes.

- LOD 0: fill only
- LOD 1: short label when readable
- LOD 2: display name
- LOD 3: name and viewers
- LOD 4: name, viewers, and momentum
- LOD 5: additional selected or close-view detail

LOD is determined from final screen-space tile dimensions and camera zoom. Zoom must reveal additional information without rebuilding the treemap layout.

## 3. Dense treemap design contract

- The map must read as one continuous field, not a grid of independent cards.
- Tile gutters must be visually minimal, generally 0 to 1 CSS pixel at the base view.
- Border weight must remain weaker than the color field.
- Squarified treemap is the preferred layout strategy.
- Extreme strip-like rectangles should be reduced where the weight distribution permits.
- The renderer must not enlarge small records arbitrarily to make labels fit.
- Large tiles use a clear hierarchy: name near the upper edge; viewers and momentum near the lower edge; central color area remains visually open.
- Tiny tiles do not show truncated noise.
- Selection is drawn in an overlay layer and must not change tile geometry.

## 4. Layout contract

### 4.1 Wide

- Wide is the default desktop layout.
- The map is the primary page element.
- The selected stream is shown below the map as a compact summary rather than consuming a permanent right column.
- Wide uses the available main content width as the reference size for the treemap world.

### 4.2 Split

Split is not a separately compressed treemap.

- Split uses the same snapshot scene, world coordinates, tile geometry, and base scale as Wide.
- Opening the detail rail narrows the visible map viewport only.
- The treemap must not be rebuilt merely because the Split rail opened or closed.
- The part of the Wide map beyond the Split viewport is reached through camera pan or the map position rail.
- Layout switching preserves selected record, camera zoom, and camera center where possible.
- If the selected tile would become completely hidden, apply only the minimum camera adjustment needed to keep it visible.

### 4.3 Split continuation affordances

Split must visually communicate that the map continues without permanent explanatory text.

Required:

- clip tiles at the viewport edge rather than ending on a clean tile boundary
- show a subtle edge fade in each direction where more world content exists
- show a thin camera-position rail at the bottom of the map viewport
- make the rail thumb draggable
- use `grab` and `grabbing` cursors on desktop

Pending, not included in the current 12-PR schedule:

- one-time horizontal nudge animation

The nudge must not be implemented unless it is explicitly approved after browser QA.

## 5. Camera and interaction contract

Desktop defaults:

- normal wheel: page scroll
- Ctrl, Alt, or Meta plus wheel: map zoom
- pointer drag: pan
- double click: zoom in
- tile click: select tile
- explicit minus and plus buttons: stepped zoom
- 100%: restore Wide reference scale
- Reset view: restore initial camera position and base scale

Interaction rules:

- Pointer capture begins only after the drag threshold is crossed.
- Drag completion must not trigger tile selection.
- Hit testing uses screen-to-world coordinates.
- Camera bounds prevent empty space appearing between the map world and viewport edge.
- If the world is smaller than the viewport on an axis, it is centered on that axis.
- Clamp after zoom, resize, layout switch, and scene update.
- Browser resize can rebuild the Wide reference layout when the actual reference width changes.
- Split rail opening alone must not rebuild the scene.

## 6. Page structure contract

The completed page must contain:

1. compact page hero
2. truthful observation status
3. unified control dock
4. Wide or Split map workspace
5. selected-stream summary or Split inspector
6. compact summary metrics
7. legend
8. coverage and limitation note

Remove duplicated counts and placeholder information. Each region has one responsibility.

## 7. Data-state truth contract

Supported visible states:

- loading
- fresh
- stale
- partial
- empty
- error
- demo

Rules:

- Unknown collector state must not use a healthy green indicator.
- Header state and page state must derive from the same normalized state model.
- `Real`, `Stale`, and `Demo` describe source mode.
- `Authenticated` or another access method is collection-method metadata and must not replace source mode.
- A healthy empty snapshot is not demo.
- Coverage information must distinguish observed records, configured collection limit, `hasMore`, snapshot age, and source mode.
- Refresh retrieves the latest stored snapshot; it does not promise to force a new collector run.
- Absolute time is rendered in the user's local timezone with timezone information available.

## 8. Selected-stream contract

The selected-stream view must show, when available:

- display name
- channel login
- live state
- current viewers
- observed rank
- observed share, clearly labeled as observed share
- momentum value, window, and Rising/Falling/Flat label
- activity value or explicit unavailable/not-sampled state
- observed since
- observed duration
- latest observed peak
- peak time
- external platform link
- Open in Battle Lines link
- Review history link

Long display names must not break the panel. External and internal actions must be labeled by destination.

## 9. Summary and legend contract

Compact summary candidates:

- total observed viewers
- active observed records
- strongest momentum
- highest available activity

Legend must explain:

- area equals viewers
- green means rising
- red means falling
- blue-gray means stable
- activity accent is secondary and availability-dependent

## 10. Mobile contract

- Mobile uses Wide only.
- Selected-stream detail uses a bottom sheet.
- Normal touch gesture allows page vertical scrolling.
- A visible `Move map` control enables one-finger map pan; `Done` exits the mode.
- Pinch zoom is allowed only while map movement mode is active.
- All valid records remain rendered.
- Mobile reduces label and effect density, not record count.

## 11. Performance and QA matrix

Test record counts:

- 0
- 1
- 20
- 100
- 300
- 500

Test scenarios:

- Wide and Split
- pan and zoom
- camera rail
- resize and device rotation
- selected tile synchronization
- refresh and automatic refresh
- loading, fresh, stale, partial, empty, error, and demo
- zero activity, unavailable activity, and not sampled activity
- long Japanese names
- long Latin names
- Twitch and Kick payloads

## 12. Twelve-PR implementation schedule

1. `docs/heatmap-repair-contract`
   - fix the implementation contract and acceptance criteria
2. `refactor/heatmap-page-boundaries`
   - separate fetch, state, layout, renderer, inspector, and status synchronization
3. `fix/heatmap-data-state-truth`
   - normalize state, source, coverage, and activity availability
4. `feature/heatmap-wide-layout`
   - compact hero, Wide layout, control dock, and page hierarchy
5. `feature/heatmap-dense-field`
   - full-record scene, dense packing, gutter, borders, colors, and selection overlay
6. `feature/heatmap-semantic-lod`
   - screen-space LOD, zoom detail, and long-label handling
7. `feature/heatmap-camera-controls`
   - camera pan/zoom, click-drag separation, bounds, resize, refresh, and reset controls
8. `feature/heatmap-split-viewport`
   - shared Wide scene, cropped Split viewport, edge fades, clipped tiles, and position rail
9. `feature/heatmap-selected-inspector`
   - complete selected-stream analysis and navigation
10. `feature/heatmap-summary-legend`
    - summary metrics, legend, coverage note, and auto-refresh state
11. `feature/heatmap-mobile-accessibility`
    - Move map, bottom sheet, responsive behavior, keyboard, and focus
12. `fix/heatmap-cross-platform-cutover`
    - Twitch/Kick browser QA, performance matrix, legacy cleanup, cutover, and documentation

## 13. Merge reporting rule

After every merge, the next work report must include:

1. the complete 12-PR schedule
2. current position in that schedule
3. the merged PR number and title
4. what changed in that merge
5. verification performed and known remaining limitations
6. the next PR and its exact scope

No later PR begins until the previous merge report has been written.

## 14. Completion gate

Heatmap repair is complete only when all of the following are true:

- every valid observed record is rendered
- small tiles remain and reveal information through zoom-dependent LOD
- Wide and Split both function
- Split reuses the Wide scene and base scale
- Split continuation is visually discoverable without permanent instructional copy
- the one-time nudge remains absent unless separately approved
- tile gaps and borders do not dominate the color field
- area, momentum color, and activity accent preserve their assigned meanings
- activity zero and unavailable are distinct
- visible data state is never a dash or a contradictory indicator
- tile click and camera drag do not conflict
- camera movement never reveals empty space outside the world
- selected-stream analysis is useful
- Battle Lines and History navigation works
- legend and coverage notes are present
- refresh and automatic refresh state are visible
- normal mobile page scrolling is not blocked
- Twitch and Kick both pass the QA matrix
