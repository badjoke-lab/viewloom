import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { buildDenseTreemap } from '../src/features/twitch-heatmap/dense-treemap-core.mjs'
import { resolveHeatmapLod } from '../src/features/twitch-heatmap/lod-core.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const productionSource = read('../src/live/twitch-heatmap.ts')
const twitchPage = read('../twitch/heatmap/index.html')
const kickPage = read('../kick/heatmap/index.html')

assert.ok(productionSource.includes('destroyCanvasScene'))
assert.ok(productionSource.includes('renderCanvasScene({'))
assert.ok(productionSource.includes("cache: 'no-store'"))
for (const fragment of ['shouldUseCanvasRenderer','createHeatmapViewport','renderHeatmapShell','heatmap-live-canvas','translate3d(','heatmap-viewport-v2']) {
  assert.ok(!productionSource.includes(fragment), `legacy production fragment: ${fragment}`)
}

for (const path of ['src/live/heatmap-viewport.ts','src/live/heatmap-viewport-v2.ts','src/live/heatmap-layout.ts','src/live/heatmap-live-shell.ts','src/live/heatmap-treemap.ts','src/live/heatmap-inspector.ts']) {
  assert.equal(existsSync(`${root}/${path}`), false, `legacy file present: ${path}`)
}

for (const page of [twitchPage, kickPage]) {
  assert.ok(page.includes('id="heatmap-inspector"'))
  assert.ok(page.includes('Preparing inspector…'))
  assert.ok(!page.includes('id="heatmap-detail-title"'))
  assert.ok(!page.includes('heatmap-live-detail-grid'))
}

const counts = [0, 1, 20, 100, 300, 500]
const width = 1600
const height = 900
let aggregateMs = 0
const timing = []
for (const count of counts) {
  const items = Array.from({ length: count }, (_, index) => ({
    channelLogin: `stream-${index + 1}`,
    displayName: `Stream ${index + 1}`,
    viewers: Math.max(1, Math.round(1000000 / Math.pow(index + 1, 0.78))),
    momentum: index % 3 === 0 ? 0.08 : index % 3 === 1 ? -0.05 : 0,
    activity: index % 7 === 0 ? 0.5 : 0.05,
  }))
  const startedAt = performance.now()
  const layouts = buildDenseTreemap(items, 0, 0, width, height)
  const elapsedMs = performance.now() - startedAt
  aggregateMs += elapsedMs
  timing.push(`${count}:${elapsedMs.toFixed(2)}ms`)
  assert.equal(layouts.length, count)
  assert.ok(elapsedMs < 750)
  if (count === 0) continue
  const totalArea = layouts.reduce((sum, tile) => sum + tile.width * tile.height, 0)
  assert.ok(Math.abs(totalArea - width * height) < 0.01)
  for (const tile of layouts) {
    assert.ok(tile.width > 0 && tile.height > 0)
    assert.ok(tile.x >= -1e-7 && tile.y >= -1e-7)
    assert.ok(tile.x + tile.width <= width + 1e-6)
    assert.ok(tile.y + tile.height <= height + 1e-6)
    const lod = resolveHeatmapLod({ screenWidth: tile.width, screenHeight: tile.height, isSelected: false })
    assert.ok(Number.isInteger(lod.level) && lod.level >= 0)
  }
  assert.deepEqual(buildDenseTreemap(items, 0, 0, width, height), layouts)
}
assert.ok(aggregateMs < 1500)
console.log(`Heatmap final cutover verification passed. ${timing.join(' · ')}`)
