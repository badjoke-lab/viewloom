import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  describeHeatmapNode,
  findDirectionalNodeIndex,
} from '../src/features/twitch-heatmap/interactions/keyboard-navigation-core.mjs'

const nodes = [
  { x: 0, y: 0, width: 100, height: 100, displayName: 'Alpha', channelLogin: 'alpha', viewers: 100 },
  { x: 120, y: 0, width: 100, height: 100, displayName: 'Beta', channelLogin: 'beta', viewers: 80 },
  { x: 0, y: 120, width: 100, height: 100, displayName: 'Gamma', channelLogin: 'gamma', viewers: 60 },
  { x: 120, y: 120, width: 100, height: 100, displayName: 'Delta', channelLogin: 'delta', viewers: 40 },
]

assert.equal(findDirectionalNodeIndex(nodes, 0, 'right'), 1)
assert.equal(findDirectionalNodeIndex(nodes, 0, 'down'), 2)
assert.equal(findDirectionalNodeIndex(nodes, 3, 'left'), 2)
assert.equal(findDirectionalNodeIndex(nodes, 3, 'up'), 1)
assert.equal(findDirectionalNodeIndex(nodes, 0, 'left'), 0)
assert.equal(describeHeatmapNode(nodes[0], 0, nodes.length), 'Tile 1 of 4. Alpha, 100 viewers. Press Enter to inspect.')

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const sceneSource = read('../src/features/twitch-heatmap/canvas-scene.ts')
const layoutSource = read('../src/features/heatmap-page/layout-mode.ts')
const sheetSource = read('../src/features/heatmap-page/mobile-inspector-sheet.ts')
const sheetCss = read('../src/features/heatmap-page/mobile-inspector-sheet.css')
const adapterSource = read('../src/features/heatmap-page/data-truth-adapter.ts')

for (const fragment of [
  'tabindex="0"',
  'aria-roledescription="interactive heatmap"',
  'aria-describedby="heatmap-canvas-instructions heatmap-canvas-status"',
  'aria-keyshortcuts=',
  'findDirectionalNodeIndex',
  "event.key === 'Enter' || event.key === ' '",
  "event.key === '0'",
  'viewloom:heatmap-selection-change',
  'viewport.focus({ preventScroll: true })',
  "event.pointerType !== 'mouse' && !moveMode",
]) assert.ok(sceneSource.includes(fragment), `missing accessible canvas fragment: ${fragment}`)

for (const fragment of [
  "const MOBILE_WIDE_QUERY = '(max-width: 760px)'",
  "button.dataset.heatmapLayout === 'split'",
  'button.disabled = media.matches && split',
  'button.hidden = media.matches && split',
  "const resolved: HeatmapLayoutMode = media.matches ? 'wide' : next",
]) assert.ok(layoutSource.includes(fragment), `missing mobile Wide-only fragment: ${fragment}`)

for (const fragment of [
  "inspector.setAttribute('role', 'dialog')",
  "inspector.setAttribute('aria-modal', 'true')",
  "event.key === 'Escape'",
  "event.key !== 'Tab'",
  'heatmap-mobile-sheet-backdrop',
  'is-heatmap-sheet-open',
  "viewloom:heatmap-selection-change",
  "target?.focus({ preventScroll: true })",
]) assert.ok(sheetSource.includes(fragment), `missing bottom-sheet fragment: ${fragment}`)

for (const fragment of [
  '@media(max-width:760px)',
  'position:fixed',
  'max-height:min(86dvh,760px)',
  'overscroll-behavior:contain',
  'env(safe-area-inset-bottom)',
  '@media(prefers-reduced-motion:reduce)',
]) assert.ok(sheetCss.includes(fragment), `missing bottom-sheet CSS fragment: ${fragment}`)

assert.ok(adapterSource.includes('installHeatmapMobileInspectorSheet'))
assert.ok(adapterSource.includes('stopMobileSheet'))

console.log('Heatmap mobile and accessibility verification passed.')
