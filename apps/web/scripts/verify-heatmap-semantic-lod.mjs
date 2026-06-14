import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  makeShortLabel,
  normalizeLabel,
  resolveHeatmapLod,
  segmentGraphemes,
} from '../src/features/twitch-heatmap/lod-core.mjs'

const fixtures = [
  [{ screenWidth: 10, screenHeight: 10 }, 0],
  [{ screenWidth: 30, screenHeight: 20 }, 1],
  [{ screenWidth: 50, screenHeight: 40 }, 2],
  [{ screenWidth: 90, screenHeight: 60 }, 3],
  [{ screenWidth: 140, screenHeight: 80 }, 4],
  [{ screenWidth: 200, screenHeight: 100 }, 5],
]

for (const [input, expected] of fixtures) {
  assert.equal(resolveHeatmapLod(input).level, expected)
}

const zoomLevels = [0.7, 1, 1.5, 2.2].map((zoom) => resolveHeatmapLod({
  screenWidth: 42 * zoom,
  screenHeight: 24 * zoom,
}).level)
for (let index = 1; index < zoomLevels.length; index += 1) {
  assert.ok(zoomLevels[index] >= zoomLevels[index - 1], 'zoom detail must be monotonic')
}
assert.ok(new Set(zoomLevels).size > 1, 'zoom must reveal additional detail without changing geometry')

const normal = resolveHeatmapLod({ screenWidth: 140, screenHeight: 75 })
const selected = resolveHeatmapLod({ screenWidth: 140, screenHeight: 75, isSelected: true })
assert.equal(normal.level, 4)
assert.equal(selected.level, 5)
assert.equal(selected.showActivity, true)
assert.equal(selected.showLogin, true)
assert.equal(selected.showRank, true)

assert.equal(normalizeLabel('  長い   配信名  '), '長い 配信名')
assert.equal(makeShortLabel('超長い日本語配信者名', 4), '超長い日')
assert.equal(makeShortLabel('Very_Long_Channel_Name', 4), 'Very')
assert.equal(segmentGraphemes('👩‍💻配信')[0], '👩‍💻')

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const tileSource = read('../src/features/twitch-heatmap/tiles-layer.ts')
const lodSource = read('../src/features/twitch-heatmap/lod-core.mjs')

for (const fragment of [
  'resolveHeatmapLod',
  'screenWidth: node.width * camera.scale',
  'screenHeight: node.height * camera.scale',
  "decision.titleMode === 'none'",
  'decision.showViewers',
  'decision.showMomentum',
  'decision.showActivity',
  'segmentGraphemes',
]) assert.ok(tileSource.includes(fragment), `missing semantic LOD fragment: ${fragment}`)

for (const fragment of [
  'FILL: 0',
  'SHORT: 1',
  'NAME: 2',
  'VIEWERS: 3',
  'MOMENTUM: 4',
  'DETAIL: 5',
]) assert.ok(lodSource.includes(fragment), `missing LOD level: ${fragment}`)

assert.ok(!tileSource.includes('TINY_AREA'))
assert.ok(!tileSource.includes('FEATURED_RANK_LIMIT'))

console.log('Heatmap semantic LOD verification passed.')
