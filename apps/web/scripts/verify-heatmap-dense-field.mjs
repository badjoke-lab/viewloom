import assert from 'node:assert/strict'
import { buildDenseTreemap } from '../src/features/twitch-heatmap/dense-treemap-core.mjs'

const width = 1200
const height = 700
const items = Array.from({ length: 300 }, (_, index) => ({
  channelLogin: `stream-${index + 1}`,
  displayName: `Stream ${index + 1}`,
  viewers: 1 / Math.pow(index + 1, 0.8),
  momentum: index % 3 === 0 ? 0.08 : index % 3 === 1 ? -0.05 : 0,
  activity: 0.1,
}))

const layouts = buildDenseTreemap(items, 0, 0, width, height)
assert.equal(layouts.length, items.length)

const totalArea = layouts.reduce((sum, tile) => sum + tile.width * tile.height, 0)
assert.ok(Math.abs(totalArea - width * height) < 0.001)

for (const tile of layouts) {
  assert.ok(tile.width > 0 && tile.height > 0)
  assert.ok(tile.x >= -1e-7 && tile.y >= -1e-7)
  assert.ok(tile.x + tile.width <= width + 1e-6)
  assert.ok(tile.y + tile.height <= height + 1e-6)
}

const aspectRatios = layouts.map((tile) => Math.max(tile.width / tile.height, tile.height / tile.width))
assert.ok(Math.max(...aspectRatios) < 2.5)
assert.equal(layouts[0].channelLogin, 'stream-1')

console.log('Heatmap dense-field verification passed.')
